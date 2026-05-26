require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const jwt     = require('jsonwebtoken');
const amqp    = require('amqplib');
const axios   = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

const app  = express();
const PORT = process.env.PORT || 3003;
const JWT_SECRET  = process.env.JWT_SECRET  || 'dev-secret';
const DEVICE_URL  = process.env.DEVICE_SERVICE_URL || 'http://device-service:3002';
const NOTIF_URL   = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';
const EXCHANGE    = 'smart_office_events';

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json());

// ── Database ────────────────────────────────────────────────
const sequelize = new Sequelize(process.env.DB_URL || 'postgresql://souser:sopassword@localhost:5432/so_devices', {
  dialect: 'postgres', logging: false,
});

const Rule = sequelize.define('AutomationRule', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:         { type: DataTypes.STRING, allowNull: false },
  description:  DataTypes.TEXT,
  trigger_type: { type: DataTypes.ENUM('sensor','schedule','manual'), defaultValue: 'sensor' },
  condition:    { type: DataTypes.JSONB, defaultValue: {} },
  action:       { type: DataTypes.JSONB, defaultValue: {} },
  notify:       { type: DataTypes.BOOLEAN, defaultValue: true },
  notify_message: DataTypes.STRING,
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
  last_triggered: DataTypes.DATE,
  trigger_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'automation_rules' });

const ExecLog = sequelize.define('ExecLog', {
  id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  rule_id:      DataTypes.UUID,
  trigger_data: DataTypes.JSONB,
  result:       { type: DataTypes.ENUM('success','failed','skipped'), defaultValue: 'success' },
  error_msg:    DataTypes.TEXT,
  duration_ms:  DataTypes.INTEGER,
}, { tableName: 'exec_logs' });

// ── RabbitMQ ────────────────────────────────────────────────
let channel;
async function connectRabbit() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  const q = await channel.assertQueue('automation_queue', { durable: true });
  await channel.bindQueue(q.queue, EXCHANGE, 'sensor.alert');
  await channel.bindQueue(q.queue, EXCHANGE, 'sensor.data');
  console.log('[automation-service] RabbitMQ connected');

  // ── Step 4 (Câu 3): Subscribe sensor.alert ─────────────
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const key   = msg.fields.routingKey;
      if (key === 'sensor.alert') await processSensorAlert(event);
      channel.ack(msg);
    } catch (e) {
      console.error('[automation] Consumer error:', e.message);
      channel.nack(msg, false, false);
    }
  });
}

function publishEvent(key, payload) {
  if (channel) channel.publish(EXCHANGE, key, Buffer.from(JSON.stringify({ ...payload, ts: new Date() })), { persistent: true });
}

// ── Core engine ─────────────────────────────────────────────
function evalCondition(value, op, threshold) {
  if (op === '>')  return value > threshold;
  if (op === '>=') return value >= threshold;
  if (op === '<')  return value < threshold;
  if (op === '<=') return value <= threshold;
  if (op === '==') return value == threshold;
  return false;
}

async function processSensorAlert(event) {
  const { sensor_type, value, room, floor } = event;
  const rules = await Rule.findAll({ where: { trigger_type: 'sensor', is_active: true } });
  for (const rule of rules) {
    const c = rule.condition;
    if (c.sensor_type !== sensor_type) continue;
    if (!evalCondition(value, c.operator, c.threshold)) continue;
    await executeRule(rule, event);
  }
}

async function executeRule(rule, context) {
  const t0 = Date.now();
  console.log(`[automation] Executing: ${rule.name}`);
  try {
    const action = rule.action;

    // Step 5-6: Control device via Device Service
    await axios.post(`${DEVICE_URL}/api/devices/${action.device_id}/control`,
      { command: action.command, ...(action.params || {}) },
      { headers: { 'x-internal-service': 'automation-service' } }
    );

    // Step 7-8: Send notification
    if (rule.notify) {
      const msg = rule.notify_message || `Kịch bản "${rule.name}" đã thực thi.`;
      await axios.post(`${NOTIF_URL}/api/notifications/send`,
        { type: 'automation_alert', message: msg, context: { rule_id: rule.id, rule_name: rule.name, ...context } },
        { headers: { 'x-internal-service': 'automation-service' } }
      ).catch(e => console.error('[automation] Notify failed:', e.message));
    }

    await ExecLog.create({ rule_id: rule.id, trigger_data: context, result: 'success', duration_ms: Date.now() - t0 });
    await rule.update({ last_triggered: new Date(), trigger_count: rule.trigger_count + 1 });
    publishEvent('automation.triggered', { rule_id: rule.id, rule_name: rule.name });
    console.log(`[automation] Done: ${rule.name} (${Date.now()-t0}ms)`);
  } catch (e) {
    await ExecLog.create({ rule_id: rule.id, trigger_data: context, result: 'failed', error_msg: e.message, duration_ms: Date.now() - t0 });
    console.error(`[automation] Failed ${rule.name}:`, e.message);
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

// ── Routes ──────────────────────────────────────────────────
app.get('/api/automations', auth, async (req, res) => {
  try { res.json(await Rule.findAll({ order: [['createdAt','DESC']] })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/automations', auth, async (req, res) => {
  try { res.status(201).json(await Rule.create(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/automations/:id', auth, async (req, res) => {
  try {
    const r = await Rule.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Rule not found' });
    res.json(await r.update(req.body));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/automations/:id', auth, async (req, res) => {
  try {
    const r = await Rule.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Rule not found' });
    await r.destroy(); res.json({ message: 'Đã xóa' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/automations/:id/logs', auth, async (req, res) => {
  try { res.json(await ExecLog.findAll({ where: { rule_id: req.params.id }, order: [['createdAt','DESC']], limit: 50 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Trigger thủ công để test
app.post('/api/automations/:id/trigger', auth, async (req, res) => {
  try {
    const r = await Rule.findByPk(req.params.id);
    if (!r) return res.status(404).json({ error: 'Rule not found' });
    await executeRule(r, { manual: true, triggered_by: req.user?.sub });
    res.json({ message: 'Đã thực thi' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'automation-service' }));

// ── Seed default rule for Câu 3 ─────────────────────────────
async function seed() {
  // Fetch ac device id from device-service
  let acDeviceId = null;
  try {
    const res = await axios.get(`${DEVICE_URL}/api/devices`, { headers: { 'x-internal-service': 'automation-service' } });
    const ac301 = res.data.find(d => d.type === 'ac' && d.room === 'room301');
    const acAny = res.data.find(d => d.type === 'ac');
    acDeviceId = ac301?.id || acAny?.id || null;
    console.log('[automation-service] AC device_id:', acDeviceId);
  } catch (e) {
    console.log('[automation-service] Không lấy được device list:', e.message);
  }

  // Nếu rule đã tồn tại thì update device_id, nếu chưa thì tạo mới
  const existingRule = await Rule.findOne({ where: { name: 'Bật điều hòa khi nhiệt độ > 29°C' } });
  if (existingRule) {
    if (acDeviceId && existingRule.action?.device_id !== acDeviceId) {
      await existingRule.update({ action: { device_id: acDeviceId, command: 'ON', params: { target_temp: 24 } } });
      console.log('[automation-service] Đã cập nhật device_id cho rule');
    }
  } else {
    await Rule.create({
      name: 'Bật điều hòa khi nhiệt độ > 29°C',
      description: 'Kịch bản Câu 3 đề thi IT03A-2511',
      trigger_type: 'sensor',
      condition: { sensor_type: 'temperature', operator: '>', threshold: 29 },
      action: { device_id: acDeviceId, command: 'ON', params: { target_temp: 24 } },
      notify: true,
      notify_message: '⚠️ Nhiệt độ phòng 301 vượt 29°C! Đã tự động bật điều hòa.',
      is_active: true,
    });
  }
  await Rule.findOrCreate({
    where: { name: 'Tắt đèn khi không có người' },
    defaults: {
      trigger_type: 'sensor',
      condition: { sensor_type: 'motion', operator: '==', threshold: 0 },
      action: { device_id: 'placeholder-light-id', command: 'OFF' },
      notify: false, is_active: true,
    },
  });
  console.log('[automation-service] Seed done');
}

async function start() {
  await sequelize.sync({ alter: true });
  await seed();
  for (let i = 0; i < 10; i++) {
    try { await connectRabbit(); break; }
    catch { console.log(`[automation-service] RabbitMQ retry ${i+1}`); await new Promise(r => setTimeout(r, 3000)); }
  }
  app.listen(PORT, () => console.log(`[automation-service] port ${PORT}`));
}
start().catch(console.error);
