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

Rule.hasMany(ExecLog, { foreignKey: 'rule_id', as: 'logs' });
ExecLog.belongsTo(Rule, { foreignKey: 'rule_id', as: 'rule' });


// ── AI Camera Cooldown Tracker ──────────────────────────────
// Lưu trạng thái đếm ngược cho từng camera { [device_id]: { lastSeen, timer, triggered } }
const cameraTimers = {};

async function handleCameraEvent(event) {
  const { device_id, person_detected, room, floor } = event;
  if (!device_id) return;

  // 1. Nếu phát hiện CÓ NGƯỜI → reset timer, bật thiết bị nếu đã tắt
  if (person_detected) {
    if (cameraTimers[device_id]?.timer) {
      clearTimeout(cameraTimers[device_id].timer);
      console.log(`[AI-Camera] ${device_id}: Người quay lại — hủy cooldown`);
    }
    cameraTimers[device_id] = { lastSeen: Date.now(), timer: null, triggered: false };

    // Bật lại thiết bị nếu trước đó đã tắt
    try {
      const config = await getCameraAIConfig(device_id);
      if (config && config.person_detected && config.person_detected.length > 0) {
        const devices = await getDevicesInRoom(room, config.person_detected);
        for (const dev of devices) {
          if (!dev.status) {
            await controlDevice(dev.id, 'ON');
            console.log(`[AI-Camera] BẬT ${dev.name} (${dev.type}) — có người quay lại`);
          }
        }
      }
    } catch (e) { /* ignore */ }
    return;
  }

  // 2. Nếu KHÔNG CÓ NGƯỜI → bắt đầu đếm ngược cooldown
  if (cameraTimers[device_id]?.triggered) return; // Đã xử lý rồi, chờ có người quay lại

  // Lấy cấu hình AI từ device-service
  const config = await getCameraAIConfig(device_id);
  if (!config) {
    console.log(`[AI-Camera] ${device_id}: Chưa có cấu hình AI, bỏ qua`);
    return;
  }

  const cooldown = (config.cooldown_seconds || 120) * 1000;
  const noPersonTypes = config.no_person || [];
  if (noPersonTypes.length === 0) return;

  // Reset timer cũ nếu có
  if (cameraTimers[device_id]?.timer) {
    clearTimeout(cameraTimers[device_id].timer);
  }

  console.log(`[AI-Camera] ${device_id}: Vắng người — bắt đầu cooldown ${cooldown/1000}s`);

  cameraTimers[device_id] = {
    lastSeen: Date.now(),
    triggered: false,
    timer: setTimeout(async () => {
      console.log(`[AI-Camera] ${device_id}: ⏰ Hết cooldown — TẮT thiết bị [${noPersonTypes.join(', ')}]`);
      cameraTimers[device_id].triggered = true;

      // Tìm tất cả thiết bị có type nằm trong danh sách cần tắt
      const devices = await getDevicesInRoom(room, noPersonTypes);
      for (const dev of devices) {
        if (dev.status) { // Chỉ tắt thiết bị đang bật
          await controlDevice(dev.id, 'OFF');
          console.log(`[AI-Camera] TẮT ${dev.name} (${dev.type})`);
        }
      }

      // Gửi thông báo
      try {
        await axios.post(`${NOTIF_URL}/api/notifications/send`, {
          type: 'ai_camera',
          message: `📷 Camera sảnh không phát hiện người trong ${cooldown/1000}s — Đã tự động tắt: ${noPersonTypes.join(', ')}`,
          context: { camera_id: device_id, room }
        }, { headers: { 'x-internal-service': 'automation-service' }, timeout: 5000 });
      } catch (e) { console.error('[AI-Camera] Notify failed:', e.message); }
    }, cooldown)
  };
}

async function getCameraAIConfig(deviceId) {
  try {
    const r = await axios.get(`${DEVICE_URL}/api/devices`, {
      headers: { 'x-internal-service': 'automation-service' },
      timeout: 5000
    });
    const camera = r.data.find(d => d.type === 'camera');
    if (camera && camera.settings && camera.settings.ai_triggers) {
      return camera.settings.ai_triggers;
    }
  } catch (e) {
    console.error('[AI-Camera] Fetch config failed:', e.message);
  }
  return null;
}

async function getDevicesInRoom(room, types) {
  try {
    const r = await axios.get(`${DEVICE_URL}/api/devices`, {
      headers: { 'x-internal-service': 'automation-service' },
      timeout: 5000
    });
    return r.data.filter(d => types.includes(d.type));
  } catch (e) {
    console.error('[AI-Camera] Fetch devices failed:', e.message);
    return [];
  }
}

async function controlDevice(deviceId, command) {
  try {
    await axios.post(`${DEVICE_URL}/api/devices/${deviceId}/control`,
      { command, params: {} },
      { headers: { 'x-internal-service': 'automation-service' }, timeout: 5000 }
    );
  } catch (e) {
    console.error(`[AI-Camera] Control ${deviceId} failed:`, e.message);
  }
}

// ── RabbitMQ ────────────────────────────────────────────────
let channel;
async function connectRabbit() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  const q = await channel.assertQueue('automation_queue', { durable: true });
  await channel.bindQueue(q.queue, EXCHANGE, 'sensor.alert');
  await channel.bindQueue(q.queue, EXCHANGE, 'sensor.data');
  await channel.bindQueue(q.queue, EXCHANGE, 'sensor.events');
  console.log('[automation-service] RabbitMQ connected & bound to exchange');

  // ── Step 4 (Câu 3): Subscribe sensor.alert & sensor.events ─────────────
  channel.consume(q.queue, async (msg) => {
    if (!msg) return;
    try {
      const event = JSON.parse(msg.content.toString());
      const key   = msg.fields.routingKey;
      if (key === 'sensor.alert' || key === 'sensor.data') {
        await processSensorAlert(event);
      } else if (key === 'sensor.events' && event.sensor_type === 'camera') {
        console.log('[automation] Received camera event:', event.device_id, 'person_detected:', event.person_detected);
        await handleCameraEvent(event);
      }
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
    if (c.device_id && c.device_id !== event.device_id) continue;
    if (!evalCondition(value, c.operator, c.threshold)) continue;
    
    // Cooldown 60s để tránh spam email và lệnh liên tục
    const now = Date.now();
    if (rule.last_triggered && (now - new Date(rule.last_triggered).getTime() < 60000)) {
      continue;
    }
    await executeRule(rule, event);
  }
}

async function executeRule(rule, context) {
  const t0 = Date.now();
  console.log(`[automation] Executing: ${rule.name}`);
  try {
    const action = rule.action;

    // Step 5-6: Control device via Device Service
    const deviceIds = Array.isArray(action.device_ids) ? action.device_ids : (action.device_id ? [action.device_id] : []);
    
    await Promise.all(deviceIds.map(dId => 
      axios.post(`${DEVICE_URL}/api/devices/${dId}/control`,
        { command: action.command, ...(action.params || {}) },
        { headers: { 'x-internal-service': 'automation-service' } }
      ).catch(e => console.error(`[automation] Control ${dId} failed:`, e.message))
    ));

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

app.get('/api/automations/exec-logs', auth, async (req, res) => {
  try {
    const logs = await ExecLog.findAll({
      include: [{ model: Rule, as: 'rule', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    res.json(logs);
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
  for (let i = 0; i < 10; i++) {
    try {
      const res = await axios.get(`${DEVICE_URL}/api/devices`, { headers: { 'x-internal-service': 'automation-service' } });
      const ac301 = res.data.find(d => d.type === 'ac' && d.room === 'room301');
      const acAny = res.data.find(d => d.type === 'ac');
      acDeviceId = ac301?.id || acAny?.id || null;
      console.log('[automation-service] AC device_id:', acDeviceId);
      if (acDeviceId) break;
    } catch (e) {
      console.log('[automation-service] Không lấy được device list, đang thử lại...', e.message);
    }
    await new Promise(r => setTimeout(r, 3000));
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
