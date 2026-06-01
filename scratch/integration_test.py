import os
import sys
import json
import time
import ssl
import urllib.request
import urllib.error
import paho.mqtt.client as mqtt

# Base Configurations
GATEWAY_URL = os.getenv("GATEWAY_URL", "http://api-gateway:3000")
MQTT_HOST = os.getenv("MQTT_HOST", "mosquitto")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER = os.getenv("MQTT_USER", "souser")
MQTT_PASS = os.getenv("MQTT_PASS", "sopassword")

def make_request(url, method="GET", data=None, token=None):
    headers = {
        "Content-Type": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        with urllib.request.urlopen(req, context=ctx) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else None
    except urllib.error.HTTPError as e:
        res_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(res_body)
        except:
            err_json = res_body
        return e.code, err_json
    except Exception as e:
        return 0, str(e)

def main():
    print("======================================================================")
    print("🚀 BẮT ĐẦU CHUỖI TÍCH HỢP KIỂM THỬ (INTEGRATION TEST)")
    print(f"🔗 Gateway: {GATEWAY_URL}")
    print(f"📡 MQTT Broker: {MQTT_HOST}:{MQTT_PORT}")
    print("======================================================================")

    # 1. ĐĂNG NHẬP (Nhận token)
    print("\n🔑 [Bước 1] Đăng nhập tài khoản Admin...")
    login_url = f"{GATEWAY_URL}/api/auth/login"
    login_payload = {
        "email": "admin@smartoffice.vn",
        "password": "Admin@123"
    }
    status, res = make_request(login_url, "POST", login_payload)
    if status != 200:
        print(f"❌ Đăng nhập thất bại (Status: {status}): {res}")
        sys.exit(1)
        
    token = res.get("accessToken")
    print(f"✅ Đăng nhập thành công! Token: {token[:20]}...")

    # 2. THÊM THIẾT BỊ (Được thực hiện bởi Admin)
    # 2.1 Thêm điều hòa (AC)
    print("\n❄️ [Bước 2.1] Thêm thiết bị Điều hòa (AC)...")
    device_url = f"{GATEWAY_URL}/api/devices"
    ac_payload = {
        "name": "Điều hòa Tích Hợp Test",
        "type": "ac",
        "room": "room301",
        "floor": 3
    }
    status, res_ac = make_request(device_url, "POST", ac_payload, token)
    if status not in (200, 201):
        print(f"❌ Thêm điều hòa thất bại (Status: {status}): {res_ac}")
        sys.exit(1)
    ac_id = res_ac.get("id")
    print(f"✅ Đã thêm Điều hòa! ID: {ac_id}, Trạng thái ban đầu: {res_ac.get('status')}")

    # 2.2 Thêm cảm biến nhiệt độ
    print("\n🌡️ [Bước 2.2] Thêm thiết bị Cảm biến nhiệt độ...")
    sensor_payload = {
        "name": "Cảm biến Nhiệt Độ Tích Hợp",
        "type": "sensor",
        "room": "room301",
        "floor": 3
    }
    status, res_sensor = make_request(device_url, "POST", sensor_payload, token)
    if status not in (200, 201):
        print(f"❌ Thêm cảm biến thất bại (Status: {status}): {res_sensor}")
        sys.exit(1)
    sensor_id = res_sensor.get("id")
    print(f"✅ Đã thêm Cảm biến! ID: {sensor_id}")

    # 3. CÀI KỊCH BẢN (Automation Rule)
    print("\n⚙️ [Bước 3] Đăng ký Kịch bản tự động hóa (Bật AC khi nhiệt độ > 29°C)...")
    auto_url = f"{GATEWAY_URL}/api/automations"
    auto_payload = {
        "name": "Integration Temp Rule",
        "description": "Kịch bản tự động bật điều hòa khi cảm biến vượt ngưỡng 29 độ C",
        "trigger_type": "sensor",
        "condition": {
            "sensor_type": "temperature",
            "operator": ">",
            "threshold": 29,
            "device_id": sensor_id
        },
        "action": {
            "device_ids": [ac_id],
            "command": "ON"
        },
        "notify": True,
        "notify_message": "Cảnh báo kiểm thử: Nhiệt độ vượt ngưỡng! Hệ thống tự động BẬT điều hòa tích hợp.",
        "is_active": True
    }
    status, res_rule = make_request(auto_url, "POST", auto_payload, token)
    if status not in (200, 201):
        print(f"❌ Cài kịch bản thất bại (Status: {status}): {res_rule}")
        sys.exit(1)
    rule_id = res_rule.get("id")
    print(f"✅ Kịch bản đã đăng ký thành công! ID: {rule_id}")

    # 4. GIẢ LẬP CẢM BIẾN VƯỢT NGƯỠNG QUA MQTT
    print("\n📡 [Bước 4] Giả lập phát tín hiệu MQTT cảm biến vượt ngưỡng (32.5°C)...")
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "integration-tester")
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
    try:
        mqtt_client.connect(MQTT_HOST, MQTT_PORT, 60)
    except Exception as e:
        print(f"❌ Không thể kết nối MQTT Broker tại {MQTT_HOST}:{MQTT_PORT}: {e}")
        sys.exit(1)
        
    topic = "office/3/room301/temperature"
    payload = {
        "device_id": sensor_id,
        "value": 32.5,
        "unit": "celsius",
        "status": "normal",
        "room": "room301",
        "floor": 3
    }
    mqtt_client.publish(topic, json.dumps(payload))
    print(f"✅ Đã gửi MQTT message tới topic '{topic}': {payload}")
    mqtt_client.disconnect()

    # Chờ 5 giây để chuỗi microservices xử lý (MQTT -> Monitoring -> RabbitMQ -> Automation -> Device & Notification)
    print("\n⏳ Chờ 5 giây cho chuỗi tự động thực thi...")
    time.sleep(5)

    # 5. KIỂM TRA ĐIỀU HÒA ĐÃ ĐƯỢC BẬT CHƯA
    print("\n🔍 [Bước 5] Kiểm tra trạng thái của Điều hòa sau tự động hóa...")
    check_url = f"{GATEWAY_URL}/api/devices"
    status, devices = make_request(check_url, "GET", token=token)
    
    target_ac = None
    for d in devices:
        if d.get("id") == ac_id:
            target_ac = d
            break
            
    if not target_ac:
        print("❌ Không tìm thấy Điều hòa đã thêm để kiểm tra trạng thái.")
        sys.exit(1)
        
    print(f"📊 Trạng thái hiện tại của Điều hòa: {target_ac.get('status')}")
    if target_ac.get("status") is True:
        print("🎉 [THÀNH CÔNG] Điều hòa đã tự động BẬT thành công!")
    else:
        print("❌ [THẤT BẠI] Điều hòa vẫn đang TẮT. Hãy kiểm tra logs của automation-service.")

    # 6. KIỂM TRA EMAIL ĐƯỢC GỬI VÀ LOGS THỰC THI
    print("\n📧 [Bước 6] Kiểm tra lịch sử thực thi kịch bản và thông báo...")
    logs_url = f"{GATEWAY_URL}/api/automations/exec-logs"
    status, logs = make_request(logs_url, "GET", token=token)
    
    triggered_log = None
    for log in logs:
        if log.get("rule_id") == rule_id:
            triggered_log = log
            break
            
    if triggered_log:
        print(f"✅ Lịch sử thực thi ghi nhận: Kịch bản được gọi lúc {triggered_log.get('createdAt')}")
        print(f"   Kết quả thực thi: {triggered_log.get('result')}")
    else:
        print("⚠️ Cảnh báo: Chưa tìm thấy log thực thi kịch bản trong database.")

    # Kiểm tra Notification logs
    notif_url = f"{GATEWAY_URL}/api/notifications"
    status, notifications = make_request(notif_url, "GET", token=token)
    
    found_notif = False
    for n in notifications:
        if "Integration Temp Rule" in n.get("message", "") or "Cảnh báo kiểm thử" in n.get("message", ""):
            print(f"✅ Nhật ký thông báo: '{n.get('message')}' gửi lúc {n.get('createdAt')}")
            found_notif = True
            break
            
    if not found_notif:
         print("⚠️ Cảnh báo: Chưa tìm thấy bản ghi thông báo trong hệ thống.")

    print("\n🏁 Hoàn tất chuỗi kiểm thử liên kết tích hợp.")
    print("======================================================================")

if __name__ == "__main__":
    main()
