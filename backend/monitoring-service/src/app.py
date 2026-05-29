"""
Monitoring Service — Smart Office
Bước 2-4 của Câu 3:
  2. Nhận dữ liệu cảm biến qua MQTT
  3. Lưu vào InfluxDB
  4. So sánh ngưỡng → publish sensor.alert lên RabbitMQ
"""
import os, json, asyncio, logging, threading
from dotenv import load_dotenv
load_dotenv()

import paho.mqtt.client as mqtt
import time
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import aio_pika
from aiohttp import web

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s')
log = logging.getLogger('monitoring')

MQTT_HOST    = os.getenv('MQTT_HOST', 'localhost')
MQTT_PORT    = int(os.getenv('MQTT_PORT', '1883'))
INFLUX_URL   = os.getenv('INFLUXDB_URL', 'http://localhost:8086')
INFLUX_TOKEN = os.getenv('INFLUXDB_TOKEN', 'so-influx-token-2025')
INFLUX_ORG   = os.getenv('INFLUXDB_ORG', 'smart-office')
INFLUX_BKT   = os.getenv('INFLUXDB_BUCKET', 'sensor_data')
RABBIT_URL   = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost/')
ALERT_TEMP   = float(os.getenv('ALERT_THRESHOLD_TEMP', '29'))
PORT         = int(os.getenv('PORT', '3004'))
EXCHANGE     = 'smart_office_events'

# ── InfluxDB ────────────────────────────────────────────────
influx = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx.write_api(write_options=SYNCHRONOUS)
query_api = influx.query_api()

# ── Global async loop + exchange ────────────────────────────
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

async def publish_alert(routing_key: str, payload: dict):
    if rabbit_exchange is None:
        log.warning('RabbitMQ not ready, skipping alert')
        return
    body = json.dumps(payload).encode()
    msg  = aio_pika.Message(body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT)
    await rabbit_exchange.publish(msg, routing_key=routing_key)
    log.info(f'Published {routing_key}: {payload.get("message", "")}')

# ── MQTT message handler ─────────────────────────────────────
last_alert_time = {}

def on_mqtt_message(client, userdata, msg):
    """
    Step 2: Nhận dữ liệu từ cảm biến IoT
    topic pattern: office/{floor}/{room}/{sensor_type}
    """
    try:
        payload = json.loads(msg.payload.decode())
        topic   = msg.topic                          # e.g. office/3/room301/temperature
        parts   = topic.split('/')
        sensor_type = parts[-1] if len(parts) >= 4 else 'unknown'
        room        = parts[2]  if len(parts) >= 3 else 'unknown'
        floor       = parts[1]  if len(parts) >= 2 else '0'
        device_id   = payload.get('device_id', 'unknown')

        # ── Camera AI event — chuyển thẳng lên RabbitMQ, không ghi InfluxDB ──
        if sensor_type == 'camera' or payload.get('sensor_type') == 'camera':
            person_detected = payload.get('person_detected', False)
            person_count    = payload.get('person_count', 0)
            camera_event = {
                'device_id':       device_id,
                'sensor_type':     'camera',
                'person_detected': person_detected,
                'person_count':    person_count,
                'room':            room,
                'floor':           floor,
                'service':         'monitoring-service',
            }
            log.info(f'📷 Camera event: person_detected={person_detected} count={person_count} [{room}]')
            if main_loop and main_loop.is_running():
                asyncio.run_coroutine_threadsafe(
                    publish_alert('sensor.events', camera_event), main_loop
                )
            return

        value       = float(payload.get('value', 0))
        unit        = payload.get('unit', '')

        # Step 3: Save to InfluxDB
        point = (
            Point('sensor_readings')
            .tag('device_id', device_id)
            .tag('sensor_type', sensor_type)
            .tag('room', room)
            .tag('floor', floor)
            .field('value', value)
            .field('unit', unit)
        )
        write_api.write(bucket=INFLUX_BKT, record=point)
        log.info(f'InfluxDB ← {sensor_type}={value}{unit} [{room}]')
        # Publish sensor data for automation rules
        data_event = {
            'device_id':   device_id,
            'sensor_type': sensor_type,
            'value':       value,
            'room':        room,
            'floor':       floor,
            'unit':        unit,
            'service':     'monitoring-service',
        }
        if main_loop and main_loop.is_running():
            asyncio.run_coroutine_threadsafe(
                publish_alert('sensor.data', data_event), main_loop
            )

        # Step 4: Check threshold → publish sensor.alert
        thresholds = {'temperature': ALERT_TEMP}
        threshold  = thresholds.get(sensor_type)
        if threshold and value > threshold:
            now = time.time()
            if now - last_alert_time.get(device_id, 0) > 60: # Cooldown 60s
                last_alert_time[device_id] = now
                alert = {
                    'device_id':   device_id,
                    'sensor_type': sensor_type,
                    'value':       value,
                    'threshold':   threshold,
                    'room':        room,
                    'floor':       floor,
                    'unit':        unit,
                    'message':     f'Cảnh báo: {sensor_type}={value}{unit} vượt ngưỡng {threshold}°C tại {room}',
                    'service':     'monitoring-service',
                }
                if main_loop and main_loop.is_running():
                    asyncio.run_coroutine_threadsafe(
                        publish_alert('sensor.alert', alert), main_loop
                    )
    except Exception as e:
        log.error(f'MQTT message error: {e}')

mqtt_client = None

# Active simulations config
active_simulations = {
    'room301': {
        'active': True,
        'base_temp': 26.0,
        'amplitude': 1.5,
        'interval': 5.0,
        'sensor_type': 'temperature',
        'floor': '3',
        'device_id': 'sensor-temp-301'
    }
}

async def run_simulation_loop():
    import random, math
    step = 0
    log.info("Simulation background loop started")
    while True:
        try:
            for room, sim in list(active_simulations.items()):
                if sim.get('active'):
                    base = float(sim.get('base_temp', 26.0))
                    amp = float(sim.get('amplitude', 1.5))
                    val = base + math.sin(step * 0.2) * amp + random.uniform(-0.1, 0.1)
                    val = round(val, 1)
                    
                    topic = f"office/{sim['floor']}/{room}/{sim['sensor_type']}"
                    payload = {
                        'device_id': sim['device_id'],
                        'value': val,
                        'unit': 'celsius',
                        'status': 'normal',
                        'room': room,
                        'floor': int(sim['floor'])
                    }
                    
                    global mqtt_client
                    if mqtt_client and mqtt_client.is_connected():
                        mqtt_client.publish(topic, json.dumps(payload))
                    else:
                        try:
                            point = (
                                Point('sensor_readings')
                                .tag('device_id', sim['device_id'])
                                .tag('sensor_type', sim['sensor_type'])
                                .tag('room', room)
                                .tag('floor', sim['floor'])
                                .field('value', val)
                                .field('unit', 'celsius')
                            )
                            write_api.write(bucket=INFLUX_BKT, record=point)
                        except Exception as ex:
                            log.error(f"Failed to write direct simulated value: {ex}")
            step += 1
        except Exception as e:
            log.error(f"Error in simulation loop: {e}")
        await asyncio.sleep(5.0)

def start_mqtt():
    global mqtt_client
    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION1,
        client_id=f'monitoring-{id(object())}'
    )
    mqtt_client.on_connect = lambda c, u, f, rc: (log.info(f'MQTT connected rc={rc}'), c.subscribe('office/#'))
    mqtt_client.on_message = on_mqtt_message
    while True:
        try:
            mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
            mqtt_client.loop_forever()
        except Exception as e:
            log.warning(f'MQTT reconnect: {e}')
            import time; time.sleep(3)

# ── HTTP API for frontend dashboard ─────────────────────────
routes = web.RouteTableDef()

@routes.get('/health')
async def health(req):
    return web.json_response({'status': 'ok', 'service': 'monitoring-service'})

@routes.get('/api/sensors/latest')
async def latest(req):
    room = req.query.get('room', '')
    room_filter = f'|> filter(fn: (r) => r.room == "{room}")' if room else ''
    flux = f'''
from(bucket: "{INFLUX_BKT}")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "sensor_readings" and r._field == "value")
  {room_filter}
  |> group(columns: ["sensor_type", "room"])
  |> last()
'''
    try:
        tables  = query_api.query(flux)
        results = []
        for table in tables:
            for row in table.records:
                results.append({
                    'sensor_type': row.values.get('sensor_type'),
                    'room':        row.values.get('room'),
                    'value':       row.get_value(),
                    'time':        str(row.get_time()),
                })
        return web.json_response(results)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

@routes.get('/api/sensors/history')
async def history(req):
    room  = req.query.get('room', 'room301')
    try:
        hours = int(req.query.get('hours', '1'))
    except ValueError:
        hours = 1
    flux  = f'''
from(bucket: "{INFLUX_BKT}")
  |> range(start: -{hours}h)
  |> filter(fn: (r) => r._measurement == "sensor_readings" and r.room == "{room}" and r._field == "value")
  |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
  |> sort(columns: ["_time"])
'''
    try:
        tables  = query_api.query(flux)
        results = []
        for table in tables:
            for row in table.records:
                results.append({
                    'time':        str(row.get_time()),
                    'value':       row.get_value(),
                    'sensor_type': row.values.get('sensor_type'),
                    'room':        room,
                })
        return web.json_response(results)
    except Exception as e:
        return web.json_response({'error': str(e)}, status=500)

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
                    'active': bool(config.get('active', active_simulations[room]['active'])),
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

    # Start MQTT in background thread
    t = threading.Thread(target=start_mqtt, daemon=True)
    t.start()
    log.info('MQTT thread started — subscribed to office/#')

    # Start simulation loop in main event loop
    asyncio.create_task(run_simulation_loop())

    app = web.Application()
    app.add_routes(routes)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', PORT)
    await site.start()
    log.info(f'HTTP API on port {PORT}')
    await asyncio.Event().wait()   # run forever

if __name__ == '__main__':
    asyncio.run(main())
