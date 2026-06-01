import urllib.request
import json
import time

# Host Gateway URL
gateway_url = "http://localhost:9000"

print("=============================================================")
print("  CACHE SPEED TEST: POSTGRESQL VS REDIS CACHE (RAM)          ")
print("=============================================================")

# 1. Login to get JWT Token
login_url = f"{gateway_url}/api/auth/login"
login_data = json.dumps({"email": "admin@smartoffice.vn", "password": "Admin@123"}).encode('utf-8')
login_req = urllib.request.Request(
    login_url,
    data=login_data,
    headers={'Content-Type': 'application/json'}
)

print("[1] Logging in as admin...")
try:
    with urllib.request.urlopen(login_req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        token = res_data['accessToken']
        print("    => Logged in successfully.")
except Exception as e:
    print(f"[!] Login failed: {e}")
    exit(1)

# Auth Header
headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

# 2. Get a Device ID
devices_url = f"{gateway_url}/api/devices"
req_get = urllib.request.Request(devices_url, headers=headers)

try:
    with urllib.request.urlopen(req_get) as response:
        devices = json.loads(response.read().decode('utf-8'))
        if not devices:
            print("[!] No devices found in database.")
            exit(1)
        device_id = devices[0]['id']
        print(f"[2] Found device ID: {device_id}")
except Exception as e:
    print(f"[!] Failed to get devices: {e}")
    exit(1)

# 3. Send Control Command to invalidate cache
control_url = f"{gateway_url}/api/devices/{device_id}/control"
current_status = devices[0].get('status', False)
cmd = "OFF" if current_status else "ON"
control_data = json.dumps({"command": cmd}).encode('utf-8')
req_control = urllib.request.Request(control_url, data=control_data, headers=headers)

print(f"[3] Sending Control Command ({cmd}) to invalidate cache...")
try:
    with urllib.request.urlopen(req_control) as response:
        response.read()
    print("    => Cache invalidated successfully.")
except Exception as e:
    print(f"[!] Control command failed: {e}")
    exit(1)

# --- TEST 1: Database Query (Cache Miss) ---
print("[4] Sending Request 1 (Fetching from PostgreSQL)...")
start_time = time.time()
try:
    with urllib.request.urlopen(req_get) as response:
        response.read()
    t1 = (time.time() - start_time) * 1000
    print(f"    => Response Time 1 (PostgreSQL): {t1:.2f} ms")
except Exception as e:
    print(f"    [!] Error on Request 1: {e}")
    t1 = None

# --- TEST 2: Redis Cache (Cache Hit) ---
print("[5] Sending Request 2 (Fetching from Redis Cache)...")
start_time = time.time()
try:
    with urllib.request.urlopen(req_get) as response:
        response.read()
    t2 = (time.time() - start_time) * 1000
    print(f"    => Response Time 2 (Redis Cache): {t2:.2f} ms")
except Exception as e:
    print(f"    [!] Error on Request 2: {e}")
    t2 = None

# --- Comparison ---
if t1 is not None and t2 is not None:
    speedup = t1 / t2 if t2 > 0 else 0
    diff = t1 - t2
    print("-------------------------------------------------------------")
    print(f" RESULT: Redis is {diff:.2f} ms faster!")
    print(f" Redis Cache is {speedup:.1f}x faster than PostgreSQL database.")
    print("=============================================================")
else:
    print("[!] Insufficient data to compare.")
