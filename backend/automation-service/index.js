require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const morgan  = require('morgan')

const { sequelize, Rule } = require('./models/automation.model')
const { connectRabbitMQ, executeRule } = require('./services/automation.service')
const automationRoutes  = require('./routes/automation.routes')

const app  = express()
const PORT = process.env.PORT || 3003

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json())

// Routine kiểm tra các kịch bản theo thời gian
setInterval(async () => {
  try {
    const now = new Date()
    const currentHHMM = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
    
    const rules = await Rule.findAll({ where: { is_active: true, trigger_type: 'time' } })
    for (const rule of rules) {
      if (rule.condition && rule.condition.time === currentHHMM) {
        // Tránh chạy nhiều lần trong cùng 1 phút
        const last = rule.last_triggered ? new Date(rule.last_triggered) : null
        if (!last || (now - last) > 60000) {
          console.log(`[automation] Time rule "${rule.name}" triggered at ${currentHHMM}`)
          await executeRule(rule, { value: currentHHMM })
        }
      }
    }
  } catch (e) {
    console.error('[automation] check time rules error:', e.message)
  }
}, 10000)

// Routes
app.use('/api/rules', automationRoutes)
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'automation-service' }))

// Seed rule mặc định cho Câu 3 đề thi
async function seedDefaultRule() {
  const count = await Rule.count()
  if (count > 0) return

  // Lấy device điều hòa đầu tiên từ device-service
  let acId = null, lightId = null
  try {
    const axios = require('axios')
    const r = await axios.get(`${process.env.DEVICE_URL || 'http://device-service:3002'}/api/devices`, { timeout: 5000 })
    const ac = r.data.find(d => d.type === 'ac')
    if (ac) acId = ac.id
    const light = r.data.find(d => d.type === 'light')
    if (light) lightId = light.id
  } catch (e) {
    console.log('[automation] Could not fetch devices for seed, skipping device_id')
  }

  await Rule.create({
    name: 'Bật điều hòa khi nhiệt độ > 29°C',
    description: 'Kịch bản Câu 3 — IT03A-2511: Nếu nhiệt độ phòng 301 vượt 29°C, tự động bật điều hòa và gửi thông báo',
    trigger_type: 'sensor',
    condition: { sensor_type: 'temperature', operator: '>', threshold: 29 },
    action: { device_id: acId || '', command: 'ON', params: { target_temp: 24 } },
    notify: true,
    notify_message: '🌡️ Nhiệt độ phòng 301 vượt 29°C — Đã tự động bật điều hòa',
    is_active: true,
  })

  await Rule.create({
    name: 'Tắt điều hòa khi không có người',
    description: 'Nếu cảm biến chuyển động = 0, tự động tắt điều hòa để tiết kiệm điện',
    trigger_type: 'sensor',
    condition: { sensor_type: 'motion', operator: '==', threshold: 0 },
    action: { device_id: acId || '', command: 'OFF', params: {} },
    notify: true,
    notify_message: '🚶 Không có người trong phòng — Đã tự động tắt điều hòa',
    is_active: true,
  })

  await Rule.create({
    name: 'Bật đèn vào buổi tối',
    description: 'Tự động bật đèn vào lúc 18:00 hàng ngày',
    trigger_type: 'time',
    condition: { time: '18:00' },
    action: { device_id: lightId || '', command: 'ON', params: {} },
    notify: false,
    is_active: true,
  })

  console.log('[automation-service] Seed done — default rules created')
}

async function start() {
  try {
    await sequelize.sync({ force: false })
    await seedDefaultRule()
    await connectRabbitMQ()
    app.listen(PORT, () => console.log(`[automation-service] port ${PORT}`))
  } catch (e) {
    console.error('[automation-service] start error:', e.message)
    process.exit(1)
  }
}

start()