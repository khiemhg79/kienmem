/**
 * IoT Simulator — Smart Office
 * Giả lập các thiết bị IoT gửi dữ liệu qua MQTT
 *
 * Chạy:
 *   node simulator.js --scenario temp-exceed   (Câu 3 - quan trọng nhất)
 *   node simulator.js --scenario door
 *   node simulator.js --scenario lights
 *   node simulator.js --scenario load
 *   node simulator.js --scenario all
 */
const mqtt      = require('mqtt')
const { program } = require('commander')

program.option('--scenario <name>', 'Kịch bản: temp-exceed|door|lights|load|all', 'temp-exceed')
program.option('--host <host>', 'MQTT host', 'localhost')
program.option('--port <port>', 'MQTT port', '1883')
program.parse()

const opts   = program.opts()
const BROKER = `mqtt://${opts.host}:${opts.port}`
const client = mqtt.connect(BROKER, { clientId: `simulator-${Date.now()}`, reconnectPeriod: 3000 })

function pub(topic, payload) {
  const msg = JSON.stringify({ ...payload, timestamp: new Date().toISOString(), simulator: true })
  client.publish(topic, msg, { qos: 1 })
  console.log(`📡 [${new Date().toLocaleTimeString('vi-VN')}] ${topic}`, JSON.stringify(payload))
}

const wait = ms => new Promise(r => setTimeout(r, ms))

// ════════════════════════════════════════════════════════════
//  KỊCH BẢN 1 — Vượt ngưỡng nhiệt độ 29°C (Câu 3 đề thi)
// ════════════════════════════════════════════════════════════
async function scenarioTempExceed() {
  const TOPIC = 'office/3/room301/temperature'
  console.log('\n📌 Kịch bản 1: Nhiệt độ vượt 29°C (Câu 3 đề thi)')
  console.log('   Luồng: Cảm biến → Monitoring → RabbitMQ → Automation → Device + Notification\n')

  // Giai đoạn 1: Bình thường
  console.log('--- Giai đoạn 1: Nhiệt độ bình thường ---')
  for (const temp of [26.1, 27.3, 28.0]) {
    pub(TOPIC, { device_id: 'sensor-temp-301', value: temp, unit: 'celsius', status: 'normal', room: 'room301', floor: 3 })
    await wait(3000)
  }

  // Giai đoạn 2: Vượt ngưỡng → TRIGGER
  console.log('\n--- Giai đoạn 2: ⚠️  Nhiệt độ VƯỢT NGƯỠNG 29°C ---')
  for (const temp of [29.2, 29.8, 30.5]) {
    pub(TOPIC, { device_id: 'sensor-temp-301', value: temp, unit: 'celsius', status: temp > 29 ? 'alert' : 'normal', room: 'room301', floor: 3 })
    await wait(3000)
  }

  // Giai đoạn 3: Sau khi điều hòa bật → nhiệt giảm
  console.log('\n--- Giai đoạn 3: ✅ Điều hòa đã bật — nhiệt độ giảm ---')
  for (const temp of [29.5, 28.8, 27.6, 26.2]) {
    pub(TOPIC, { device_id: 'sensor-temp-301', value: temp, unit: 'celsius', status: 'recovering', room: 'room301', floor: 3 })
    await wait(3000)
  }
  console.log('\n✅ Kịch bản 1 hoàn thành (~30 giây)')
}

// ════════════════════════════════════════════════════════════
//  KỊCH BẢN 2 — Cửa mở bất thường
// ════════════════════════════════════════════════════════════
async function scenarioDoor() {
  const TOPIC = 'office/1/entrance/door'
  console.log('\n📌 Kịch bản 2: Cửa mở bất thường\n')
  pub(TOPIC, { device_id: 'door-entrance-01', status: 'closed', locked: true })
  await wait(2000)
  console.log('⚠️  Cửa đột ngột mở lúc 23:00!')
  pub(TOPIC, { device_id: 'door-entrance-01', status: 'open', locked: false, anomaly: true, hour: 23 })
  await wait(5000)
  pub(TOPIC, { device_id: 'door-entrance-01', status: 'closed', locked: true })
  console.log('✅ Kịch bản 2 hoàn thành')
}

// ════════════════════════════════════════════════════════════
//  KỊCH BẢN 3 — Tắt đèn khi không có người
// ════════════════════════════════════════════════════════════
async function scenarioLights() {
  console.log('\n📌 Kịch bản 3: Không có người → tắt đèn\n')
  for (const room of ['room301','room302','room303']) {
    pub(`office/3/${room}/motion`, { device_id: `pir-${room}`, motion_detected: false, room, empty_for_minutes: 30 })
    await wait(1000)
  }
  console.log('✅ Kịch bản 3 hoàn thành')
}

// ════════════════════════════════════════════════════════════
//  KỊCH BẢN 4 — Load test: 10 cảm biến gửi đồng thời
// ════════════════════════════════════════════════════════════
async function scenarioLoad() {
  console.log('\n📌 Kịch bản 4: Load test — 10 cảm biến × 10 vòng\n')
  const sensors = Array.from({ length: 10 }, (_, i) => ({
    id: `sensor-temp-${301+i}`, room: `room${301+i}`,
    topic: `office/3/room${301+i}/temperature`
  }))
  for (let round = 0; round < 10; round++) {
    sensors.forEach(s => pub(s.topic, { device_id: s.id, value: +(24 + Math.random() * 8).toFixed(1), unit: 'celsius', room: s.room, round }))
    await wait(1000)
  }
  console.log('✅ Load test: 100 messages sent (10 sensors × 10 rounds)')
}

// ── Start ─────────────────────────────────────────────────
client.on('connect', async () => {
  console.log(`\n✅ Kết nối MQTT: ${BROKER}`)
  console.log(`▶  Kịch bản: ${opts.scenario}\n`)

  const map = {
    'temp-exceed': scenarioTempExceed,
    'door':        scenarioDoor,
    'lights':      scenarioLights,
    'load':        scenarioLoad,
    'all': async () => {
      await scenarioTempExceed()
      await wait(2000)
      await scenarioDoor()
      await wait(2000)
      await scenarioLights()
      await wait(2000)
      await scenarioLoad()
    },
  }

  const fn = map[opts.scenario]
  if (!fn) { console.error(`❌ Không có kịch bản: ${opts.scenario}`); process.exit(1) }

  await fn()
  console.log('\n🎉 Simulator hoàn thành!\n')
  client.end()
})

client.on('error', err => { console.error('❌ MQTT lỗi:', err.message); process.exit(1) })
