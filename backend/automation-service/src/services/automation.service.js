const axios   = require('axios')
const amqplib = require('amqplib')
const { Rule } = require('../models/automation.model')

const DEVICE_URL       = process.env.DEVICE_URL       || 'http://device-service:3002'
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://notification-service:3005'
const RABBITMQ_URL     = process.env.RABBITMQ_URL     || 'amqp://souser:sopassword@rabbitmq:5672'

let channel = null

// ── RabbitMQ ────────────────────────────────────────────────
async function connectRabbitMQ(retries = 10) {
  for (let i = 1; i <= retries; i++) {
    try {
      const conn = await amqplib.connect(RABBITMQ_URL)
      channel = await conn.createChannel()
      await channel.assertQueue('sensor.events',  { durable: true })
      await channel.assertQueue('device.commands', { durable: true })
      console.log('[automation-service] RabbitMQ connected')

      // Lắng nghe sự kiện cảm biến từ monitoring-service
      channel.consume('sensor.events', async (msg) => {
        if (!msg) return
        try {
          const event = JSON.parse(msg.content.toString())
          await processSensorEvent(event)
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