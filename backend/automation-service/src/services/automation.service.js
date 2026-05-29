const axios   = require('axios')
const amqplib = require('amqplib')
const { Rule } = require('../models/automation.model')

const DEVICE_URL       = process.env.DEVICE_URL       || 'http://device-service:3002'
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://notification-service:3005'
const RABBITMQ_URL     = process.env.RABBITMQ_URL     || 'amqp://souser:sopassword@rabbitmq:5672'

let channel = null

// ── AI Camera Cooldown Tracker ──────────────────────────────
// Lưu trạng thái đếm ngược cho từng camera { [device_id]: { lastSeen, timer, triggered } }
const cameraTimers = {}

async function handleCameraEvent(event) {
  const { device_id, person_detected, room, floor } = event
  if (!device_id) return

  // 1. Nếu phát hiện CÓ NGƯỜI → reset timer, bật thiết bị nếu đã tắt
  if (person_detected) {
    if (cameraTimers[device_id]?.timer) {
      clearTimeout(cameraTimers[device_id].timer)
      console.log(`[AI-Camera] ${device_id}: Người quay lại — hủy cooldown`)
    }
    cameraTimers[device_id] = { lastSeen: Date.now(), timer: null, triggered: false }

    // Bật lại thiết bị nếu trước đó đã tắt
    try {
      const config = await getCameraAIConfig(device_id)
      if (config && config.person_detected && config.person_detected.length > 0) {
        const devices = await getDevicesInRoom(room, config.person_detected)
        for (const dev of devices) {
          if (!dev.status) {
            await controlDevice(dev.id, 'ON')
            console.log(`[AI-Camera] BẬT ${dev.name} (${dev.type}) — có người quay lại`)
          }
        }
      }
    } catch (e) { /* ignore */ }
    return
  }

  // 2. Nếu KHÔNG CÓ NGƯỜI → bắt đầu đếm ngược cooldown
  if (cameraTimers[device_id]?.triggered) return // Đã xử lý rồi, chờ có người quay lại

  // Lấy cấu hình AI từ device-service
  const config = await getCameraAIConfig(device_id)
  if (!config) {
    console.log(`[AI-Camera] ${device_id}: Chưa có cấu hình AI, bỏ qua`)
    return
  }

  const cooldown = (config.cooldown_seconds || 120) * 1000
  const noPersonTypes = config.no_person || []
  if (noPersonTypes.length === 0) return

  // Reset timer cũ nếu có
  if (cameraTimers[device_id]?.timer) {
    clearTimeout(cameraTimers[device_id].timer)
  }

  console.log(`[AI-Camera] ${device_id}: Vắng người — bắt đầu cooldown ${cooldown/1000}s`)

  cameraTimers[device_id] = {
    lastSeen: Date.now(),
    triggered: false,
    timer: setTimeout(async () => {
      console.log(`[AI-Camera] ${device_id}: ⏰ Hết cooldown — TẮT thiết bị [${noPersonTypes.join(', ')}]`)
      cameraTimers[device_id].triggered = true

      // Tìm tất cả thiết bị có type nằm trong danh sách cần tắt
      const devices = await getDevicesInRoom(room, noPersonTypes)
      for (const dev of devices) {
        if (dev.status) { // Chỉ tắt thiết bị đang bật
          await controlDevice(dev.id, 'OFF')
          console.log(`[AI-Camera] TẮT ${dev.name} (${dev.type})`)
        }
      }

      // Gửi thông báo
      try {
        await axios.post(`${NOTIFICATION_URL}/api/notifications`, {
          message: `📷 Camera "${device_id}" không phát hiện người trong ${cooldown/1000}s — Đã tự động tắt: ${noPersonTypes.join(', ')}`,
          type: 'ai_camera',
        }, { headers: { 'x-internal': 'automation' }, timeout: 5000 })
      } catch (e) { console.error('[AI-Camera] Notify failed:', e.message) }
    }, cooldown)
  }
}

// Lấy cấu hình ai_triggers của camera từ device-service
async function getCameraAIConfig(deviceId) {
  try {
    const r = await axios.get(`${DEVICE_URL}/api/devices`, { timeout: 5000 })
    const camera = r.data.find(d => d.type === 'camera')
    if (camera && camera.settings && camera.settings.ai_triggers) {
      return camera.settings.ai_triggers
    }
  } catch (e) {
    console.error('[AI-Camera] Fetch config failed:', e.message)
  }
  return null
}

// Tìm tất cả thiết bị theo loại
async function getDevicesInRoom(room, types) {
  try {
    const r = await axios.get(`${DEVICE_URL}/api/devices`, { timeout: 5000 })
    return r.data.filter(d => types.includes(d.type))
  } catch (e) {
    console.error('[AI-Camera] Fetch devices failed:', e.message)
    return []
  }
}

// Gửi lệnh điều khiển đến thiết bị
async function controlDevice(deviceId, command) {
  try {
    await axios.post(`${DEVICE_URL}/api/devices/${deviceId}/control`,
      { command, params: {} },
      { headers: { 'x-internal': 'automation' }, timeout: 5000 }
    )
  } catch (e) {
    console.error(`[AI-Camera] Control ${deviceId} failed:`, e.message)
  }
}

// ── RabbitMQ ────────────────────────────────────────────────
async function connectRabbitMQ(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await amqplib.connect(RABBITMQ_URL)
      channel = await conn.createChannel()
      await channel.assertQueue('sensor.events',  { durable: true })
      await channel.assertQueue('device.commands', { durable: true })

      // Bind queue vào Exchange của monitoring-service để nhận camera events
      await channel.assertExchange('smart_office_events', 'topic', { durable: true })
      await channel.bindQueue('sensor.events', 'smart_office_events', 'sensor.events')
      await channel.bindQueue('sensor.events', 'smart_office_events', 'sensor.alert')

      console.log('[automation-service] RabbitMQ connected + bound to exchange')

      // Lắng nghe sự kiện cảm biến từ monitoring-service
      channel.consume('sensor.events', async (msg) => {
        if (!msg) return
        try {
          const event = JSON.parse(msg.content.toString())

          // Phân loại: Camera AI event vs Sensor event
          if (event.sensor_type === 'camera') {
            await handleCameraEvent(event)
          } else {
            await processSensorEvent(event)
          }

          channel.ack(msg)
        } catch (e) {
          console.error('[automation] consume error', e.message)
          channel.nack(msg, false, false)
        }
      })
      return
    } catch (e) {
      console.log(`[automation-service] RabbitMQ retry ${i}`)
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  console.error('[automation-service] RabbitMQ failed after retries')
}

// ── Xử lý sự kiện cảm biến ─────────────────────────────────
async function processSensorEvent(event) {
  // event = { sensor_type, value, device_id, room, floor, timestamp }
  const rules = await Rule.findAll({ where: { is_active: true, trigger_type: 'sensor' } })

  for (const rule of rules) {
    const { sensor_type, operator, threshold } = rule.condition
    if (sensor_type !== event.sensor_type) continue

    const val = Number(event.value)
    const thr = Number(threshold)
    let triggered = false

    if (operator === '>'  && val >  thr) triggered = true
    if (operator === '>=' && val >= thr) triggered = true
    if (operator === '<'  && val <  thr) triggered = true
    if (operator === '<=' && val <= thr) triggered = true
    if (operator === '==' && val === thr) triggered = true

    if (triggered) {
      console.log(`[automation] Rule "${rule.name}" triggered — ${sensor_type}=${val} ${operator} ${thr}`)
      await executeRule(rule, event)
    }
  }
}

// ── Thực thi rule ────────────────────────────────────────────
async function executeRule(rule, context = {}) {
  const { device_id, command, params } = rule.action

  // 1. Điều khiển thiết bị
  try {
    await axios.post(`${DEVICE_URL}/api/devices/${device_id}/control`,
      { command, params },
      { headers: { 'x-internal': 'automation' }, timeout: 5000 }
    )
    console.log(`[automation] Sent ${command} to device ${device_id}`)
  } catch (e) {
    console.error(`[automation] Control device failed: ${e.message}`)
  }

  // 2. Gửi thông báo
  if (rule.notify) {
    const message = rule.notify_message ||
      `[Tự động hóa] Kịch bản "${rule.name}" đã kích hoạt: ` +
      `${rule.condition.sensor_type} = ${context.value ?? '?'} ${rule.condition.operator} ${rule.condition.threshold} — ` +
      `Đã ${command === 'ON' ? 'bật' : 'tắt'} thiết bị`

    try {
      await axios.post(`${NOTIFICATION_URL}/api/notifications`,
        { message, type: 'automation', rule_id: rule.id },
        { headers: { 'x-internal': 'automation' }, timeout: 5000 }
      )
      console.log(`[automation] Notification sent`)
    } catch (e) {
      console.error(`[automation] Notify failed: ${e.message}`)
    }
  }

  // 3. Cập nhật thống kê rule
  await rule.update({
    last_triggered: new Date(),
    trigger_count: (rule.trigger_count || 0) + 1,
  })
}

module.exports = { connectRabbitMQ, executeRule, processSensorEvent }