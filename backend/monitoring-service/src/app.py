import os, json, asyncio, logging, threading, time, math, random
from collections import deque
from dotenv import load_dotenv
load_dotenv()

import paho.mqtt.client as mqtt
import aio_pika
from aiohttp import web

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s')
log = logging.getLogger('monitoring')

MQTT_HOST  = os.getenv('MQTT_HOST', 'localhost')
MQTT_PORT  = int(os.getenv('MQTT_PORT', '1883'))
RABBIT_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost/')
ALERT_TEMP = float(os.getenv('ALERT_THRESHOLD_TEMP', '29'))
PORT       = int(os.getenv('PORT', '3004'))
EXCHANGE   = 'smart_office_events'

# ── In-memory storage (thay InfluxDB) ──────────────────────
# { room: deque of {time, value, sensor_type, room} }
sensor_history = {}
sensor_latest  = {}  # { (sensor_type, room): {value, time} }

def store_reading(sensor_type, room, value, device_id=''):
    key = (sensor_type, room)
    now = time.time()
    sensor_latest[key] = {
        'sensor_type': sensor_type,
        'room': room,
        'value': value,
        'time': str(int(now)),
        'device_id': device_id,
    }
    if room not in sensor_history:
        sensor_history[room] = deque(maxlen=200)
    sensor_history[room].append({
        'sensor_type': sensor_type,
        'value': value,
        'time': now,
        'room': room,
    })

# ── RabbitMQ ────────────────────────────────────────────────
main_loop = None
rabbit_exchange = None

async def init_rabbit():
    global rabbit_exchange
    for attempt in range(10):
        try:
            conn = await aio_pika.connect_robust(RABBIT_URL)
            ch   = await conn.channel()
            rabbit_exchange = await ch.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
            log.info('RabbitMQ connected')
            return
        except Exception as e:
            log.warning(f'RabbitMQ attempt {attempt+1}: {e}')
            await asyncio.sleep(3)

async def publish_alert(routing_key, payload):
    if rabbit_exchange is None:
        return
    body = json.dumps(payload).encode()
    msg  = aio_pika.Message(body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT)
    await rabbit_exchange.publish(msg, routing_key=routing_key)
    log.info(f'Published {routing_key}: {payload.get("message", "")}')

# ── MQTT ────────────────────────────────────────────────────
last_alert_time = {}
mqtt_client = None

def on_mqtt_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        topic   = msg.topic
        parts   = topic.split('/')
        sensor_type = parts[-1] if len(parts) >= 4 else 'unknown'
        room        = parts[2]  if len(parts) >= 3 else 'unknown'
        floor       = parts[1]  if len(parts) >= 2 else '0'
        device_id   = payload.get('device_id', 'unknown')

        if sensor_type in ('cmd',):
            return

        if sensor_type == 'camera' or payload.get('sensor_type') == 'camera':
            return

        value = payload.get('value')
        if not isinstance(value, (int, float)):
            return
        value = float(value)
        unit  = payload.get('unit', '')

        # Lưu vào memory
        store_reading(sensor_type, room, value, device_id)
        log.info(f'Stored {sensor_type}={value}{unit} [{room}]')

        # Publish sensor.data
        data_event = {
            'device_id': device_id, 'sensor_type': sensor_type,
            'value': value, 'room': room, 'floor': floor,
            'unit': unit, 'service': 'monitoring-service',
        }
        if main_loop and main_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                publish_alert('sensor.data', data_event), main_loop)

        # Check threshold
        if sensor_type == 'temperature' and value > ALERT_TEMP:
            now = time.time()
            if now - last_alert_time.get(device_id, 0) > 60:
                last_alert_time[device_id] = now
                alert = {
                    'device_id': device_id, 'sensor_type': sensor_type,
                    'value': value, 'threshold': ALERT_TEMP,
                    'room': room, 'floor': floor, 'unit': unit,
                    'message': f'Cảnh báo: {sensor_type}={value}{unit} vượt ngưỡng {ALERT_TEMP}°C tại {room}',
                    'service': 'monitoring-service',
                }
                if main_loop and main_loop.is_running():
                    asyncio.run_coroutine_threadsafe(
                        publish_alert('sensor.alert', alert), main_loop)
    except Exception as e:
        log.error(f'MQTT message error: {e}')

def start_mqtt():
    global mqtt_client
    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION1,
        client_id=f'monitoring-{id(object())}'
    )
    mqtt_client.on_connect = lambda c, u, f, rc: (
        log.info(f'MQTT connected rc={rc}'), c.subscribe('office/#'))
    mqtt_client.on_message = on_mqtt_message
    while True:
        try:
            mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
            mqtt_client.loop_forever()
        except Exception as e:
            log.warning(f'MQTT reconnect: {e}')
            time.sleep(3)

# ── Simulation ───────────────────────────────────────────────
active_simulations = {
    'room301': {
        'active': True, 'base_temp': 26.0,
        'amplitude': 1.5, 'interval': 5.0,
        'sensor_type': 'temperature', 'floor': '3',
        'device_id': 'sensor-temp-301'
    }
}

async def run_simulation_loop():
    step = 0
    log.info('Simulation background loop started')
    while True:
        try:
            for room, sim in list(active_simulations.items()):
                if sim.get('active'):
                    base = float(sim.get('base_temp', 26.0))
                    amp  = float(sim.get('amplitude', 1.5))
                    val  = round(base + math.sin(step * 0.2) * amp + random.uniform(-0.1, 0.1), 1)
                    store_reading(sim['sensor_type'], room, val, sim['device_id'])

                    # Publish qua MQTT nếu connect được
                    global mqtt_client
                    if mqtt_client and mqtt_client.is_connected():
                        topic = f"office/{sim['floor']}/{room}/{sim['sensor_type']}"
                        mqtt_client.publish(topic, json.dumps({
                            'device_id': sim['device_id'], 'value': val,
                            'unit': 'celsius', 'room': room, 'floor': int(sim['floor'])
                        }))
            step += 1
        except Exception as e:
            log.error(f'Simulation error: {e}')
        await asyncio.sleep(5.0)

# ── HTTP API ─────────────────────────────────────────────────
routes = web.RouteTableDef()

@routes.get('/health')
async def health(req):
    return web.json_response({'status': 'ok', 'service': 'monitoring-service'})

@routes.get('/api/sensors/latest')
async def latest(req):
    room = req.query.get('room', '')
    results = []
    for (stype, r), data in sensor_latest.items():
        if not room or r == room:
            results.append(data)
    return web.json_response(results)

@routes.get('/api/sensors/history')
async def history(req):
    room  = req.query.get('room', 'room301')
    try:
        hours = int(req.query.get('hours', '1'))
    except ValueError:
        hours = 1
    cutoff = time.time() - hours * 3600
    data   = sensor_history.get(room, [])
    results = [
        {
            'time':        str(int(r['time'] * 1000)),
            'value':       r['value'],
            'sensor_type': r['sensor_type'],
            'room':        room,
        }
        for r in data if r['time'] >= cutoff
    ]
    return web.json_response(results)

@routes.get('/api/sensors/simulation')
async def get_simulation(req):
    return web.json_response(active_simulations)

@routes.post('/api/sensors/simulation')
async def update_simulation(req):
    try:
        body = await req.json()
        for room, config in body.items():
            if room in active_simulations:
                active_simulations[room].update({
                    'active':    bool(config.get('active', active_simulations[room]['active'])),
                    'base_temp': float(config.get('base_temp', active_simulations[room]['base_temp'])),
                    'amplitude': float(config.get('amplitude', active_simulations[room]['amplitude'])),
                })
        return web.json_response({'status': 'ok', 'config': active_simulations})
    except Exception as e:
        return web.json_response({'error': str(e)}, status=400)

async def main():
    global main_loop
    main_loop = asyncio.get_event_loop()
    await init_rabbit()
    t = threading.Thread(target=start_mqtt, daemon=True)
    t.start()
    log.info('MQTT thread started — subscribed to office/#')
    asyncio.create_task(run_simulation_loop())
    app = web.Application()
    app.add_routes(routes)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    log.info(f'HTTP API on port {PORT}')
    await asyncio.Event().wait()

if __name__ == '__main__':
    asyncio.run(main())