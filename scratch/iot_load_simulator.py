#!/usr/bin/env python3
import time
import json
import random
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor
import paho.mqtt.client as mqtt

# Cấu hình mặc định
MQTT_HOST = "localhost"
MQTT_PORT = 1883
TOPIC_TEMPLATE = "office/{floor}/room{room}/{sensor_type}"

# Dữ liệu thống kê toàn cục
total_sent = 0
total_failed = 0
stats_lock = threading.Lock()

def send_sensor_data(sensor_id, floor, room, sensor_type, num_messages, interval):
    """
    Giả lập một cảm biến gửi dữ liệu định kỳ lên MQTT Broker
    """
    global total_sent, total_failed
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, f"sim-sensor-{sensor_id}")
    
    try:
        client.connect(MQTT_HOST, MQTT_PORT, 60)
    except Exception as e:
        with stats_lock:
            total_failed += num_messages
        print(f"[Sensor {sensor_id}] Không thể kết nối tới Broker: {e}")
        return

    topic = TOPIC_TEMPLATE.format(floor=floor, room=room, sensor_type=sensor_type)
    
    for _ in range(num_messages):
        # Trị số ngẫu nhiên tùy loại cảm biến
        if sensor_type == "temperature":
            value = round(random.uniform(22.0, 35.0), 1)
            unit = "celsius"
        elif sensor_type == "humidity":
            value = round(random.uniform(40.0, 80.0), 1)
            unit = "percent"
        else:
            value = random.choice([0, 1])
            unit = "boolean"

        payload = {
            "device_id": f"sensor-sim-{sensor_id}",
            "value": value,
            "unit": unit,
            "status": "normal",
            "room": f"room{room}",
            "floor": floor
        }
        
        try:
            client.publish(topic, json.dumps(payload), qos=1)
            with stats_lock:
                total_sent += 1
        except Exception as e:
            with stats_lock:
                total_failed += 1
            print(f"[Sensor {sensor_id}] Gửi lỗi: {e}")
            
        time.sleep(interval)
        
    client.disconnect()

def run_load_test(num_sensors, num_messages, interval):
    global total_sent, total_failed
    total_sent = 0
    total_failed = 0
    
    print(f"\n======================================================================")
    # Bắt đầu kiểm thử
    print(f"🚀 BẮT ĐẦU GIẢ LẬP HIỆU NĂNG TẢI: {num_sensors} cảm biến đồng thời...")
    print(f"📡 Broker: {MQTT_HOST}:{MQTT_PORT} | Tần suất: {num_messages} tin nhắn/cảm biến | Khoảng nghỉ: {interval}s")
    print(f"======================================================================")
    
    start_time = time.time()
    
    # Tạo ThreadPool để xử lý đồng thời N cảm biến
    with ThreadPoolExecutor(max_workers=min(num_sensors, 100)) as executor:
        futures = []
        for i in range(num_sensors):
            floor = random.choice([1, 2, 3, 4, 5])
            room = f"{floor}0{random.randint(1, 9)}"
            sensor_type = random.choice(["temperature", "humidity"])
            
            futures.append(
                executor.submit(
                    send_sensor_data, 
                    sensor_id=i+1, 
                    floor=floor, 
                    room=room, 
                    sensor_type=sensor_type, 
                    num_messages=num_messages, 
                    interval=interval
                )
            )
            
        # Đợi tất cả hoàn thành
        for future in futures:
            future.result()
            
    end_time = time.time()
    elapsed = end_time - start_time
    
    throughput = total_sent / elapsed if elapsed > 0 else 0
    success_rate = (total_sent / (total_sent + total_failed)) * 100 if (total_sent + total_failed) > 0 else 0
    
    print(f"\n📊 KẾT QUẢ THỬ NGHIỆM TẢI ({num_sensors} CẢM BIẾN):")
    print(f"⏱️ Tổng thời gian chạy: {elapsed:.2f} giây")
    print(f"📨 Tổng số tin nhắn đã gửi: {total_sent}")
    print(f"❌ Số tin nhắn thất bại: {total_failed}")
    print(f"✅ Tỷ lệ thành công: {success_rate:.2f}%")
    print(f"⚡ Throughput (Thông lượng gửi): {throughput:.2f} msg/sec")
    print(f"======================================================================\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Multi-threaded IoT Load Simulator for Smart Office")
    parser.add_argument("--host", default="localhost", help="MQTT broker host IP/domain")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port")
    parser.add_argument("--sensors", type=int, default=10, help="Number of simulated sensors")
    parser.add_argument("--msgs", type=int, default=5, help="Number of messages per sensor")
    parser.add_argument("--interval", type=float, default=1.0, help="Interval between messages in seconds")
    
    args = parser.parse_args()
    
    MQTT_HOST = args.host
    MQTT_PORT = args.port
    
    run_load_test(args.sensors, args.msgs, args.interval)
