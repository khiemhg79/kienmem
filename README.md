# Smart Office Management System
## Đề thi IT03A - Mã đề 2511

### Yêu cầu
- Docker Desktop (đã bật)
- Node.js 20+ (chỉ cần cho iot-simulator)

### Chạy toàn bộ hệ thống

```bash
# 1. Clone / giải nén project
cd smart-office-final

# 2. Chạy tất cả services
docker-compose up --build

# Lần đầu build ~5 phút. Sau đó:
# - Frontend:       http://localhost:5173
# - API Gateway:    http://localhost:3000
# - RabbitMQ UI:    http://localhost:15672  (souser/sopassword)
# - InfluxDB UI:    http://localhost:8086   (admin/influxpassword)
```

### Tài khoản mặc định
- Email: `admin@smartoffice.vn`
- Mật khẩu: `Admin@123`

### Chạy IoT Simulator (kịch bản nhiệt độ > 29°C)

```bash
cd iot-simulator
npm install
node simulator.js --scenario temp-exceed
```

### Cấu trúc project
```
smart-office-final/
├── docker-compose.yml
├── infra/                    # Config postgres, mosquitto
├── backend/
│   ├── api-gateway/          # Port 3000 - định tuyến request
│   ├── auth-service/         # Port 3001 - xác thực, JWT, RBAC
│   ├── device-service/       # Port 3002 - quản lý thiết bị
│   ├── automation-service/   # Port 3003 - kịch bản tự động
│   ├── monitoring-service/   # Port 3004 - cảm biến realtime (Python)
│   └── notification-service/ # Port 3005 - thông báo
├── frontend/                 # React + Vite - Port 5173
└── iot-simulator/            # Giả lập thiết bị IoT
```
