require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');
const amqp = require('amqplib');
const { Sequelize, DataTypes } = require('sequelize');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXCHANGE = 'smart_office_events';

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json());

// ── Redis Cache ─────────────────────────────────────────────
const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 3000,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        console.warn('[device-service] Redis reconnect attempts exceeded. Stop retrying.');
        return new Error('Redis connection failed');
      }
      return 2000;
    }
  },
  disableOfflineQueue: true
});
redis.connect().catch(e => console.error('[device-service] Redis Connection Error:', e.message));

// ── Database ────────────────────────────────────────────────
const sequelize = new Sequelize(process.env.DB_URL || 'postgresql://souser:sopassword@localhost:5432/so_devices', {
  dialect: 'postgres', logging: false,
});

const DeviceGroup = sequelize.define('DeviceGroup', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  floor: DataTypes.INTEGER,
  zone: DataTypes.STRING,
}, { tableName: 'device_groups' });

const Device = sequelize.define('Device', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('light', 'ac', 'camera', 'door', 'sensor', 'projector', 'printer', 'tv', 'router'), allowNull: false },
  room: DataTypes.STRING,
  floor: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: { type: DataTypes.BOOLEAN, defaultValue: false },
  ip_address: DataTypes.STRING,
  mqtt_topic: DataTypes.STRING,
  settings: { type: DataTypes.JSONB, defaultValue: {} },
  last_seen: DataTypes.DATE,
  group_id: DataTypes.UUID,
}, { tableName: 'devices' });

const CommandLog = sequelize.define('CommandLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  device_id: DataTypes.UUID,
  user_id: DataTypes.UUID,
  command: DataTypes.STRING,
  payload: DataTypes.JSONB,
  source: { type: DataTypes.STRING, defaultValue: 'user' },
  result: { type: DataTypes.STRING, defaultValue: 'success' },
}, { tableName: 'command_logs' });

DeviceGroup.hasMany(Device, { foreignKey: 'group_id' });
Device.belongsTo(DeviceGroup, { foreignKey: 'group_id' });

// ── MQTT (có xác thực — đối phó nguy cơ 4.1.3) ─────────────
let mqttClient;
function connectMqtt() {
  const host = process.env.MQTT_HOST || 'localhost';
  const port = process.env.MQTT_PORT || 1883;
  mqttClient = mqtt.connect(`mqtt://${host}:${port}`, {
    clientId: `device-service-${Date.now()}`,
    reconnectPeriod: 3000,
    username: process.env.MQTT_USER || 'souser',
    password: process.env.MQTT_PASS || 'sopassword',
  });
  mqttClient.on('connect', () => console.log('[device-service] MQTT connected (authenticated)'));
  mqttClient.on('error', e => console.error('[device-service] MQTT error:', e.message));
}

function publishMqtt(topic, payload) {
  if (mqttClient?.connected) mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
}

// ── RabbitMQ ────────────────────────────────────────────────
let rabbitChannel;
async function connectRabbit() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  rabbitChannel = await conn.createChannel();
  await rabbitChannel.assertExchange(EXCHANGE, 'topic', { durable: true });
  console.log('[device-service] RabbitMQ connected');
}
function publishEvent(key, payload) {
  if (rabbitChannel) rabbitChannel.publish(EXCHANGE, key, Buffer.from(JSON.stringify({ ...payload, ts: new Date() })), { persistent: true });
}

// ── Auth middleware ─────────────────────────────────────────
function auth(req, res, next) {
  if (req.headers['x-internal-service']) return next();
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Helper to resolve room ID to room name from floor plan config
async function resolveRoomName(roomIdOrName, token) {
  if (!roomIdOrName) return roomIdOrName;
  if (/^\d+$/.test(roomIdOrName)) {
    try {
      const url = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';
      const res = await fetch(`${url}/api/notifications/settings/floor-plan`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-internal-service': 'true'
        }
      });
      if (res.ok) {
        const config = await res.json();
        const room = config.rooms?.find(r => r.id === roomIdOrName);
        if (room) return room.name;
      }
    } catch (e) {
      console.error('[device-service] resolveRoomName error:', e.message);
    }
  }
  return roomIdOrName;
}

// ── RBAC middleware — Lớp 2: kiểm tra quyền theo role + assigned_room/floor ──
function rbacCheck(action) {
  return async (req, res, next) => {
    // Internal service calls (automation) bypass RBAC
    if (req.headers['x-internal-service']) return next();

    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const role = user.role;
    const permissions = user.permissions || {};
    const devicePerms = permissions.devices || [];

    // Kiểm tra permission theo action (read, write, delete, control)
    if (!devicePerms.includes(action)) {
      return res.status(403).json({
        error: `Forbidden: Vai trò "${role}" không có quyền "${action}" thiết bị`
      });
    }

    // Với action control/write/delete, kiểm tra thêm phạm vi theo room/floor
    if (['control', 'write', 'delete'].includes(action) && req.params.id) {
      const device = await Device.findByPk(req.params.id);
      if (!device) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });

      // Admin → toàn quyền, không cần kiểm tra phạm vi
      if (role === 'admin') { req.device = device; return next(); }

      // Director → chỉ được thao tác thiết bị trên tầng mình quản lý
      if (role === 'director') {
        const assignedFloor = user.assigned_floor;
        if (assignedFloor && device.floor !== assignedFloor) {
          return res.status(403).json({
            error: `Forbidden: Director chỉ quản lý tầng ${assignedFloor}, không thể ${action} thiết bị tầng ${device.floor}`
          });
        }
      }

      // Manager / Staff → chỉ được thao tác thiết bị trong phòng mình
      if (role === 'manager' || role === 'staff') {
        const assignedRoomIdOrName = user.assigned_room;
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const assignedRoom = await resolveRoomName(assignedRoomIdOrName, token);

        if (assignedRoom && device.room?.toLowerCase() !== assignedRoom.toLowerCase()) {
          return res.status(403).json({
            error: `Forbidden: ${role} phòng "${assignedRoom}" không thể ${action} thiết bị phòng "${device.room}"`
          });
        }
      }

      req.device = device;
    }

    next();
  };
}

// ── Routes ──────────────────────────────────────────────────
// GET /api/devices — đọc danh sách (mọi role có quyền read đều xem được) - tích hợp Redis Cache TTL=30s
app.get('/api/devices', auth, rbacCheck('read'), async (req, res) => {
  try {
    const user = req.user;
    
    // 1. Thử lấy danh sách thiết bị đầy đủ từ Redis Cache
    let allDevices;
    try {
      if (redis.isOpen) {
        const cached = await redis.get('devices:all');
        if (cached) {
          allDevices = JSON.parse(cached);
          console.log('[device-service] Cache hit for devices:all');
        }
      }
    } catch (err) {
      console.error('[device-service] Redis cache read error:', err.message);
    }

    // 2. Cache miss -> truy vấn từ PostgreSQL và lưu lại vào Redis với TTL=30s
    if (!allDevices) {
      console.log('[device-service] Cache miss for devices:all, fetching from database');
      allDevices = await Device.findAll({ include: [DeviceGroup], order: [['floor', 'ASC'], ['room', 'ASC']] });
      try {
        if (redis.isOpen) {
          await redis.setEx('devices:all', 30, JSON.stringify(allDevices));
        }
      } catch (err) {
        console.error('[device-service] Redis cache write error:', err.message);
      }
    }

    // 3. Phân quyền và lọc thiết bị trong bộ nhớ
    let filteredDevices = allDevices;
    if (user && user.role === 'director' && user.assigned_floor) {
      filteredDevices = allDevices.filter(d => d.floor === user.assigned_floor);
    } else if (user && (user.role === 'manager' || user.role === 'staff') && user.assigned_room) {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
      const resolvedRoomName = await resolveRoomName(user.assigned_room, token);
      filteredDevices = allDevices.filter(d => d.room && resolvedRoomName && d.room.toLowerCase() === resolvedRoomName.toLowerCase());
    }

    res.json(filteredDevices);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/devices/logs
app.get('/api/devices/logs', auth, async (req, res) => {
  try {
    const logs = await CommandLog.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/devices/:id
app.get('/api/devices/:id', auth, rbacCheck('read'), async (req, res) => {
  try {
    const d = await Device.findByPk(req.params.id, { include: [DeviceGroup] });
    if (!d) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/devices — chỉ role có quyền 'write' mới tạo được
app.post('/api/devices', auth, rbacCheck('write'), async (req, res) => {
  try {
    const d = await Device.create(req.body);
    publishEvent('device.created', { device_id: d.id, name: d.name });
    if (redis.isOpen) {
      await redis.del('devices:all').catch(() => {});
    }
    res.status(201).json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/devices/:id — chỉ role có quyền 'write' + đúng phạm vi
app.put('/api/devices/:id', auth, rbacCheck('write'), async (req, res) => {
  try {
    const d = req.device || await Device.findByPk(req.params.id);
    if (!d) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
    await d.update(req.body);
    publishEvent('device.updated', { device_id: d.id });
    if (redis.isOpen) {
      await redis.del('devices:all').catch(() => {});
    }
    res.json(d);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/devices/:id — chỉ role có quyền 'delete' + đúng phạm vi
app.delete('/api/devices/:id', auth, rbacCheck('delete'), async (req, res) => {
  try {
    const d = req.device || await Device.findByPk(req.params.id);
    if (!d) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
    await d.destroy();
    publishEvent('device.deleted', { device_id: req.params.id });
    if (redis.isOpen) {
      await redis.del('devices:all').catch(() => {});
    }
    res.json({ message: 'Đã xóa thiết bị' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/devices/:id/control  — Câu 3: Step 5-6 + RBAC Lớp 2
// Kiểm tra assigned_room trước khi cho phép điều khiển (đối phó nguy cơ 4.1.1)
app.post('/api/devices/:id/control', auth, rbacCheck('control'), async (req, res) => {
  try {
    const d = req.device || await Device.findByPk(req.params.id);
    if (!d) return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
    const { command, ...params } = req.body;
    const topic = d.mqtt_topic || `office/${d.floor}/${d.room}/${d.type}/command`;
    publishMqtt(topic, { device_id: d.id, command, ...params, ts: new Date() });
    if (command === 'ON') await d.update({ status: true, last_seen: new Date() });
    if (command === 'OFF') await d.update({ status: false, last_seen: new Date() });
    await CommandLog.create({ device_id: d.id, user_id: req.user?.sub, command, payload: params, source: req.headers['x-internal-service'] ? 'automation' : 'user' });
    publishEvent('device.controlled', { device_id: d.id, command, source: 'device-service' });
    if (redis.isOpen) {
      await redis.del('devices:all').catch(() => {});
    }
    res.json({ success: true, device_id: d.id, command, status: d.status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});



app.get('/health', (req, res) => res.json({ status: 'ok', service: 'device-service' }));

// ── Seed sample devices ─────────────────────────────────────
async function seed() {
  const [g1] = await DeviceGroup.findOrCreate({ where: { name: 'Tầng 3' }, defaults: { floor: 3, zone: 'office' } });
  const [g2] = await DeviceGroup.findOrCreate({ where: { name: 'Sảnh' }, defaults: { floor: 1, zone: 'entrance' } });
  const list = [
    { name: 'Đèn phòng 301', type: 'light', room: 'room301', floor: 3, status: false, mqtt_topic: 'office/3/room301/light/cmd', group_id: g1.id },
    { name: 'Đèn phòng 302', type: 'light', room: 'room302', floor: 3, status: false, mqtt_topic: 'office/3/room302/light/cmd', group_id: g1.id },
    { name: 'Điều hòa 301', type: 'ac', room: 'room301', floor: 3, status: false, mqtt_topic: 'office/3/room301/ac/cmd', group_id: g1.id, settings: { target_temp: 24 } },
    { name: 'Điều hòa 302', type: 'ac', room: 'room302', floor: 3, status: false, mqtt_topic: 'office/3/room302/ac/cmd', group_id: g1.id, settings: { target_temp: 24 } },
    { name: 'Camera sảnh', type: 'camera', room: 'lobby', floor: 1, status: true, mqtt_topic: 'office/1/lobby/camera/cmd', group_id: g2.id, settings: { ai_triggers: { cooldown_seconds: 15, person_detected: ['light'], no_person: ['light', 'ac'] } } },
    { name: 'Cửa chính', type: 'door', room: 'entrance', floor: 1, status: false, mqtt_topic: 'office/1/entrance/door/cmd', group_id: g2.id },
    { name: 'Cảm biến nhiệt 301', type: 'sensor', room: 'room301', floor: 3, status: true, mqtt_topic: 'office/3/room301/temperature', group_id: g1.id },
  ];
  for (const item of list) {
    const [d, created] = await Device.findOrCreate({ where: { name: item.name }, defaults: item });
    if (!created && item.settings && Object.keys(item.settings).length > 0) {
      await d.update({ settings: item.settings });
    }
  }
  console.log('[device-service] Seed done & settings synced');
}

async function start() {
  await sequelize.sync({ alter: true });
  await seed();
  connectMqtt();
  // Wait for RabbitMQ with retries
  for (let i = 0; i < 10; i++) {
    try { await connectRabbit(); break; }
    catch { console.log(`[device-service] RabbitMQ retry ${i + 1}/10`); await new Promise(r => setTimeout(r, 3000)); }
  }
  app.listen(PORT, () => console.log(`[device-service] port ${PORT}`));
}
start().catch(console.error);
