require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize, User, Role, RefreshToken } = require('./db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('redis');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json());

// Redis
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 3000,
    reconnectStrategy: (retries) => {
      if (retries > 3) return new Error('Redis connection failed');
      return 2000;
    }
  },
  disableOfflineQueue: true
});
redis.connect().catch(e => console.error('Redis connection error:', e.message));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// ── POST /api/auth/login ────────────────────────────────────
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email và password là bắt buộc' });

    const user = await User.findOne({ where: { email, is_active: true }, include: [Role] });
    if (!user) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

    const payload = {
      sub: user.id, email: user.email,
      role: user.Role.name, permissions: user.Role.permissions,
      assigned_room: user.assigned_room
    };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const hash = await bcrypt.hash(refreshToken, 8);
    await RefreshToken.create({ user_id: user.id, token_hash: hash, expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000) });
    await user.update({ last_login: new Date() });

    res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, email: user.email, role: user.Role.name, assigned_room: user.assigned_room } });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// ── POST /api/auth/refresh ──────────────────────────────────
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const p = jwt.verify(refreshToken, JWT_SECRET);
    const tokens = await RefreshToken.findAll({ where: { user_id: p.sub, revoked: false } });
    let matched = null;
    for (const t of tokens) { if (await bcrypt.compare(refreshToken, t.token_hash)) { matched = t; break; } }
    if (!matched) return res.status(401).json({ error: 'Invalid refresh token' });
    await matched.update({ revoked: true });
    const user = await User.findByPk(p.sub, { include: [Role] });
    const payload = { sub: user.id, email: user.email, role: user.Role.name, permissions: user.Role.permissions, assigned_room: user.assigned_room };
    const newAccess = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const newRefresh = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

// ── POST /api/auth/verify (internal — called by API Gateway) ─
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const payload = jwt.verify(token, JWT_SECRET);
    const bl = redis.isOpen ? await redis.get(`blacklist:${payload.jti}`).catch(() => null) : null;
    if (bl) return res.status(401).json({ valid: false, error: 'Token revoked' });
    res.json({ valid: true, payload });
  } catch (e) { res.status(401).json({ valid: false, error: e.message }); }
});

// ── POST /api/auth/logout ───────────────────────────────────
app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.slice(7);
    if (token) { const p = jwt.decode(token); if (p?.jti && redis.isOpen) await redis.setEx(`blacklist:${p.jti}`, 900, '1').catch(() => { }); }
    res.json({ message: 'Đăng xuất thành công' });
  } catch (e) { res.json({ message: 'OK' }); }
});

// ── GET /api/auth/me ────────────────────────────────────────
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.slice(7);
    const p = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(p.sub, { include: [Role], attributes: { exclude: ['password_hash'] } });
    res.json(user);
  } catch (e) { res.status(401).json({ error: 'Unauthorized' }); }
});

// ── GET /api/users ──────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ include: [Role], attributes: { exclude: ['password_hash'] } });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── POST /api/users ─────────────────────────────────────────
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role_name, assigned_floor, assigned_room } = req.body;
    const role = await Role.findOne({ where: { name: role_name || 'manager' } });
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password_hash: hash, role_id: role.id, assigned_floor, assigned_room });
    res.status(201).json({ id: user.id, name: user.name, email: user.email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PUT /api/users/:id ──────────────────────────────────────
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, password, role_name, assigned_floor, assigned_room } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    if (role_name) {
      const role = await Role.findOne({ where: { name: role_name } });
      if (role) user.role_id = role.id;
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password_hash = await bcrypt.hash(password, 12);
    user.assigned_floor = assigned_floor;
    user.assigned_room = assigned_room;
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELETE /api/users/:id ───────────────────────────────────
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    await user.destroy();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

// ── Start ───────────────────────────────────────────────────
async function start() {
  await sequelize.sync({ alter: true });
  await seed();
  app.listen(PORT, () => console.log(`[auth-service] port ${PORT}`));
}

async function seed() {
  const roles = [
    { name: 'admin', permissions: { devices: ['read', 'write', 'delete', 'control'], users: ['read', 'write', 'delete'], automation: ['read', 'write', 'delete'] } },
    { name: 'director', permissions: { devices: ['read', 'write', 'control'], automation: ['read', 'write'] } },
    { name: 'manager', permissions: { devices: ['read', 'write', 'control'], automation: ['read', 'write'] } },
    { name: 'staff', permissions: { devices: ['read', 'control'], automation: ['read'] } },
    { name: 'guest', permissions: { devices: ['read'] } },
  ];
  for (const r of roles) await Role.findOrCreate({ where: { name: r.name }, defaults: r });

  const hash = await bcrypt.hash('Admin@123', 12);

  const adminRole = await Role.findOne({ where: { name: 'admin' } });
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@smartoffice.vn' },
    defaults: { name: 'System Admin', email: 'admin@smartoffice.vn', password_hash: hash, role_id: adminRole.id },
  });
  await admin.update({ name: 'System Admin', role_id: adminRole.id });

  const directorRole = await Role.findOne({ where: { name: 'director' } });
  const [director] = await User.findOrCreate({
    where: { email: 'director@smartoffice.vn' },
    defaults: { name: 'Floor 1 Director', email: 'director@smartoffice.vn', password_hash: hash, role_id: directorRole.id, assigned_floor: 1 },
  });
  await director.update({ name: 'Floor 1 Director', role_id: directorRole.id, assigned_floor: 1, assigned_room: null });

  const managerRole = await Role.findOne({ where: { name: 'manager' } });
  const [manager] = await User.findOrCreate({
    where: { email: 'manager@smartoffice.vn' },
    defaults: { name: 'Office Manager', email: 'manager@smartoffice.vn', password_hash: hash, role_id: managerRole.id, assigned_room: '1780061195691' },
  });
  await manager.update({ name: 'Office Manager', role_id: managerRole.id, assigned_room: '1780061195691', assigned_floor: null });

  const staffRole = await Role.findOne({ where: { name: 'staff' } });
  const [staff] = await User.findOrCreate({
    where: { email: 'staff@smartoffice.vn' },
    defaults: { name: 'Office Staff (Room 301)', email: 'staff@smartoffice.vn', password_hash: hash, role_id: staffRole.id, assigned_room: 'room301' },
  });
  await staff.update({ name: 'Office Staff (Room 301)', role_id: staffRole.id, assigned_room: 'room301', assigned_floor: null });

  // Test accounts for room301 email routing
  const testEmails = [
    { name: 'Duy Quang (HVNH)', email: '26a4040725@hvnh.edu.vn' },
    { name: 'Quang Duy Nguyễn', email: 'nquangduy2005@gmail.com' },
    { name: 'Khiêm Hoàng Giang', email: 'khiemhg0709@gmail.com' },
    { name: 'Sơn Quý Hoa', email: 'hoasonquy@gmail.com' }
  ];
  for (const item of testEmails) {
    const [u] = await User.findOrCreate({
      where: { email: item.email },
      defaults: { name: item.name, email: item.email, password_hash: hash, role_id: staffRole.id, assigned_room: 'room301' }
    });
    await u.update({ name: item.name, role_id: staffRole.id, assigned_room: 'room301', assigned_floor: null });
  }

  console.log('[auth-service] Seed done — core and test accounts created/updated with password Admin@123');
}

start().catch(console.error);
