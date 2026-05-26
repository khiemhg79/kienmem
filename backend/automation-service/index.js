require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const helmet  = require('helmet')
const morgan  = require('morgan')

const { sequelize } = require('./models/automation.model')
const { connectRabbitMQ } = require('./services/automation.service')
const automationRoutes  = require('./routes/automation.routes')

const app  = express()
const PORT = process.env.PORT || 3003

app.use(helmet()); app.use(cors()); app.use(morgan('tiny')); app.use(express.json())

// Routes
app.use('/api/rules', automationRoutes)
app.get('/health', (_, res) => res.json({ status: 'ok', service: 'automation-service' }))

// Seed rule mặc định cho Câu 3 đề thi
async function seedDefaultRule() {
  const { Rule } = require('./models/automation.model')
  const count = await Rule.count()
  if (count > 0) return

  // Lấy device điều hòa đầu tiên từ device-service
  let deviceId = null
  try {
    const axios = require('axios')
    const r = await axios.get(`${process.env.DEVICE_URL || 'http://device-service:3002'}/api/devices`, { timeout: 5000 })
    const ac = r.data.find(d => d.type === 'ac')
    if (ac) deviceId = ac.id
  } catch (e) {
    console.log('[automation] Could not fetch devices for seed, skipping device_id')
  }

  await Rule.create({
    name: 'Bật điều hòa khi nhiệt độ > 29°C',
    description: 'Kịch bản Câu 3 — IT03A-2511: Nếu nhiệt độ phòng 301 vượt 29°C, tự động bật điều hòa và gửi thông báo',
    trigger_type: 'sensor',
    condition: { sensor_type: 'temperature', operator: '>', threshold: 29 },
    action: { device_id: deviceId || '', command: 'ON', params: { target_temp: 24 } },
    notify: true,
    notify_message: '🌡️ Nhiệt độ phòng 301 vượt 29°C — Đã tự động bật điều hòa',
    is_active: true,
  })
  console.log('[automation-service] Seed done — default rule created')
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