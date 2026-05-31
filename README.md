# Smart Office Management System
## Đề thi IT03A - Mã đề 2511

### Yêu cầu
- Docker Desktop (đã bật)
- Node.js 20+ (chỉ cần cho iot-simulator)

### Chạy toàn bộ hệ thống

```bash
# 1. Clone / giải nén project
cd smart-office-final

# 2. Khởi tạo / Chạy tất cả services
# (Nếu bạn đã từng chạy code cũ, hãy chạy `docker-compose down -v` trước để xóa db cũ và nạp sơ đồ 3D mới nhất)
docker-compose up -d --build

# Lần đầu build ~5 phút. Sau đó:
# - Frontend (Vercel): https://kienmem-iz5ixp9r7-khiemhg79s-projects.vercel.app/
# - API Gateway:    http://localhost:3000
# - RabbitMQ UI:    http://localhost:15672  (souser/sopassword)
# - InfluxDB UI:    http://localhost:8086   (admin/influxpassword)
```

### Tài khoản mặc định (Mật khẩu chung: `Admin@123`)
- **Admin** (Toàn quyền): `admin@smartoffice.vn`
- **Giám đốc** (Quản lý Tầng 1): `director@smartoffice.vn`
- **Trưởng phòng** (Quản lý Phòng Marketing): `manager@smartoffice.vn`
- **Nhân viên** (Phòng 301): `staff@smartoffice.vn`
- **Khách**: `guest@smartoffice.vn`

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
