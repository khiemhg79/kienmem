require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const EXCHANGE = 'smart_office_events';

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json());

// ── Gmail transporter ───────────────────────────────────────
const mailer = process.env.GMAIL_USER ? nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  tls: { rejectUnauthorized: false }
}) : null

// ── Database ────────────────────────────────────────────────
const sequelize = new Sequelize(process.env.DB_URL || 'postgresql://souser:sopassword@localhost:5432/so_notifications', {
  dialect: 'postgres', logging: false,
});

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  type: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  channel: { type: DataTypes.ENUM('push', 'email', 'sms', 'in_app'), defaultValue: 'in_app' },
  status: { type: DataTypes.ENUM('pending', 'delivered', 'failed'), defaultValue: 'delivered' },
  context: { type: DataTypes.JSONB, defaultValue: {} },
  read_at: DataTypes.DATE,
}, { tableName: 'notifications' });

const SystemSetting = sequelize.define('SystemSetting', {
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'system_settings' });

async function getNotifyEmail() {
  try {
    const setting = await SystemSetting.findByPk('NOTIFY_EMAIL');
    if (setting) return setting.value;
  } catch (e) {
    console.error('Error fetching NOTIFY_EMAIL from DB:', e.message);
  }
  return process.env.NOTIFY_EMAIL || '';
}

async function sendEmail(subject, message, type) {
  const notifyEmail = await getNotifyEmail();
  if (!mailer || !notifyEmail) return;
  const isAlert = type === 'sensor_alert' || type === 'automation_alert';
  try {
    await mailer.sendMail({
      from: `"Smart Office IT03A" <${process.env.GMAIL_USER}>`,
      to: notifyEmail,
      subject,
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
          <div style="background:${isAlert ? '#fef2f2' : '#eff6ff'};border-left:4px solid ${isAlert ? '#ef4444' : '#3b82f6'};border-radius:8px;padding:20px">
            <h2 style="margin:0 0 12px;color:${isAlert ? '#dc2626' : '#2563eb'}">
              ${isAlert ? '⚠️ Cảnh báo Smart Office' : '✅ Smart Office Thông báo'}
            </h2>
            <p style="margin:0;color:#374151;font-size:16px">${message}</p>
            <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
            <p style="margin:0;color:#9ca3af;font-size:12px">
              🕐 ${new Date().toLocaleString('vi-VN')} &nbsp;·&nbsp; Smart Office IT03A-2511
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Gmail] ✓ Sent to ${notifyEmail}`);
  } catch (e) {
    console.error('[Gmail] ✗ Error:', e.message);
  }
}

// ── Auth middleware ─────────────────────────────────────────
function auth(req, res, next) {
  if (req.headers['x-internal-service']) return next();
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Notification logic ──────────────────────────────────────
async function save(type, message, context = {}, channel = 'in_app') {
  const n = await Notification.create({ type, message, context, channel, status: 'delivered' });

  // Gửi Gmail khi có cảnh báo automation (kịch bản tự động kích hoạt)
  if (type === 'automation_alert') {
    const subject = '⚠️ Kịch bản tự động kích hoạt'
    await sendEmail(subject, message, type)
  }

  console.log(`[notification] ${type}: ${message.substring(0, 80)}`);
  return n;
}

// ── Routes ──────────────────────────────────────────────────
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    res.json(await Notification.findAll({ order: [['createdAt', 'DESC']], limit }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.count({ where: { read_at: null } });
    res.json({ count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findByPk(req.params.id);
    if (n) await n.update({ read_at: new Date() });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.update({ read_at: new Date() }, { where: { read_at: null } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/notifications/settings
app.get('/api/notifications/settings', auth, async (req, res) => {
  try {
    const notifyEmail = await getNotifyEmail();
    res.json({ notifyEmail });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/notifications/settings
app.put('/api/notifications/settings', auth, async (req, res) => {
  try {
    const { notifyEmail } = req.body;
    if (!notifyEmail) return res.status(400).json({ error: 'Email không được để trống' });
    const [setting] = await SystemSetting.findOrCreate({ where: { key: 'NOTIFY_EMAIL' }, defaults: { value: notifyEmail } });
    await setting.update({ value: notifyEmail });
    res.json({ success: true, notifyEmail });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/notifications/settings/floor-plan
app.get('/api/notifications/settings/floor-plan', auth, async (req, res) => {
  try {
    const setting = await SystemSetting.findByPk('FLOOR_PLAN_CONFIG');
    if (setting) return res.json(JSON.parse(setting.value));
    res.json({ width: 680, height: 680, rooms: [] }); // Default config
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/notifications/settings/floor-plan
app.put('/api/notifications/settings/floor-plan', auth, async (req, res) => {
  try {
    const config = req.body;
    const value = JSON.stringify(config);
    const [setting] = await SystemSetting.findOrCreate({ where: { key: 'FLOOR_PLAN_CONFIG' }, defaults: { value } });
    await setting.update({ value });
    res.json({ success: true, config });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications/send', auth, async (req, res) => {
  try {
    const { type, message, context, channel } = req.body;
    const n = await save(type, message, context, channel || 'in_app');
    res.status(201).json(n);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notification-service' }));

// ── RabbitMQ consumer ───────────────────────────────────────
async function connectRabbit() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  const ch = await conn.createChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  const q = await ch.assertQueue('notification_queue', { durable: true });
  await ch.bindQueue(q.queue, EXCHANGE, 'sensor.alert');
  await ch.bindQueue(q.queue, EXCHANGE, 'automation.triggered');
  await ch.bindQueue(q.queue, EXCHANGE, 'device.fault');

  ch.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const key = msg.fields.routingKey;
      if (key === 'sensor.alert') {
        await save('sensor_alert', event.message || `Cảnh báo cảm biến: ${event.sensor_type}=${event.value}`, event, 'in_app');
      } else if (key === 'automation.triggered') {
        await save('automation', `Kịch bản "${event.rule_name}" đã kích hoạt thành công`, event, 'in_app');
      }
      ch.ack(msg);
    } catch (e) {
      console.error('[notification consumer]', e.message);
      ch.nack(msg, false, false);
    }
  });
  console.log('[notification-service] RabbitMQ consumer ready');
}

async function start() {
  await sequelize.sync({ alter: true });
  try {
    await SystemSetting.findOrCreate({
      where: { key: 'NOTIFY_EMAIL' },
      defaults: { value: process.env.NOTIFY_EMAIL || '26a4040720@hvnh.edu.vn' }
    });
    console.log('[notification-service] Settings seed done');
  } catch (e) {
    console.error('Error seeding settings:', e.message);
  }
  for (let i = 0; i < 10; i++) {
    try { await connectRabbit(); break; }
    catch { console.log(`[notification-service] RabbitMQ retry ${i + 1}`); await new Promise(r => setTimeout(r, 3000)); }
  }
  app.listen(PORT, () => console.log(`[notification-service] port ${PORT}`));
}
start().catch(console.error);