# Smart Office Management System - Project Summary

## 1. Tổng quan hệ thống (System Overview)
Hệ thống **Smart Office Management** là một giải pháp quản lý văn phòng thông minh dựa trên kiến trúc **Microservices**. Hệ thống cho phép giám sát các thông số môi trường (nhiệt độ, độ ẩm), quản lý trạng thái thiết bị (đèn, điều hòa, cửa) và tự động hóa các kịch bản vận hành dựa trên dữ liệu cảm biến thời gian thực.

## 2. Kiến trúc kỹ thuật (Technical Architecture)

Hệ thống được thiết kế theo mô hình hướng sự kiện (**Event-Driven Architecture**) sử dụng các công nghệ hiện đại:

### 2.1. Thành phần Backend (Microservices)
Tất cả các dịch vụ backend (ngoại trừ Monitoring) được viết bằng **Node.js/Express**.

*   **API Gateway (Port 3000/9000):** Điểm tiếp nhận duy nhất cho mọi request từ Frontend. Thực hiện điều hướng (routing) đến các service nội bộ.
*   **Auth Service (Port 3001):** Quản lý người dùng, xác thực JWT và phân quyền (RBAC). Sử dụng **Redis** để quản lý phiên làm việc và blacklist token.
*   **Device Service (Port 3002):** Quản lý danh mục thiết bị, sơ đồ phòng/tầng và trạng thái bật/tắt của thiết bị. Kết nối với **MQTT** để điều khiển phần cứng.
*   **Automation Service (Port 3003):** Định nghĩa và thực thi các kịch bản tự động. Lắng nghe các sự kiện từ **RabbitMQ** để ra quyết định điều khiển.
*   **Monitoring Service (Python - Port 3004):** Chuyên trách xử lý dữ liệu cảm biến. 
    *   Nhận dữ liệu từ **MQTT Broker**.
    *   Lưu trữ dữ liệu chuỗi thời gian (time-series) vào **InfluxDB**.
    *   Kiểm tra ngưỡng (threshold) và đẩy cảnh báo vào **RabbitMQ**.
*   **Notification Service (Port 3005):** Lưu trữ lịch sử thông báo và gửi cảnh báo đến người dùng.

### 2.2. Thành phần Frontend
*   **Công nghệ:** React + Vite + Tailwind CSS.
*   **Tính năng:** Dashboard hiển thị thông số realtime, bản đồ thiết bị, quản lý người dùng và lịch sử cảnh báo.

### 2.3. Cơ sở hạ tầng (Infrastructure)
*   **PostgreSQL:** Lưu trữ dữ liệu quan hệ (User, Device, Automation Rules, Notifications).
*   **InfluxDB:** Lưu trữ dữ liệu cảm biến mật độ cao (nhiệt độ theo thời gian).
*   **Redis:** Caching và hỗ trợ xác thực.
*   **RabbitMQ:** Message Broker cho giao tiếp bất đồng bộ giữa các microservices.
*   **Mosquitto:** MQTT Broker cho giao tiếp với các thiết bị IoT.
*   **Docker & Docker Compose:** Đóng gói và triển khai toàn bộ hệ thống một cách nhất quán.

## 3. Luồng dữ liệu chính (Core Data Flows)

### 3.1. Luồng giám sát và cảnh báo (Monitoring & Alerting)
1.  **IoT Simulator/Devices** gửi dữ liệu nhiệt độ qua giao thức **MQTT** đến **Mosquitto**.
2.  **Monitoring Service** subscribe dữ liệu này, ghi vào **InfluxDB**.
3.  Nếu nhiệt độ > 29°C, **Monitoring Service** publish một tin nhắn `alert.temperature` lên **RabbitMQ**.
4.  **Automation Service** nhận tin nhắn, kiểm tra kịch bản và ra lệnh cho **Device Service** bật điều hòa.
5.  Đồng thời, **Notification Service** lưu lại thông báo để hiển thị trên UI.

### 3.2. Luồng xác thực (Authentication)
1.  Người dùng đăng nhập qua **API Gateway** -> **Auth Service**.
2.  **Auth Service** kiểm tra DB, trả về **JWT Access Token**.
3.  Các request sau đó mang theo Token, **API Gateway** xác thực trước khi forward đến các service nghiệp vụ.

## 4. Các kịch bản giả lập (IoT Simulation Scenarios)
Dự án đi kèm một công cụ giả lập (`iot-simulator`) hỗ trợ các kịch bản:
*   `temp-exceed`: Giả lập nhiệt độ tăng dần vượt ngưỡng 29°C để kiểm tra tính năng tự động bật AC.
*   `door`: Giả lập sự kiện cửa mở bất thường vào ban đêm.
*   `lights`: Giả lập tắt đèn tự động khi không có chuyển động.
*   `load`: Kiểm tra khả năng chịu tải với hàng trăm tin nhắn từ nhiều cảm biến.

## 5. Hướng dẫn vận hành nhanh
1.  **Khởi chạy hệ thống:** `docker-compose up --build`
2.  **Truy cập UI:** `https://kienmem-iz5ixp9r7-khiemhg79s-projects.vercel.app/`
3.  **Tài khoản Admin:** `admin@smartoffice.vn` / `Admin@123`
4.  **Chạy giả lập:** `node simulator.js --scenario temp-exceed` (trong thư mục `iot-simulator`)
