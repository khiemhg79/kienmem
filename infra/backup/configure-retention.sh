#!/bin/bash

# ==============================================================================
# SCRIPT CẤU HÌNH CHÍNH SÁCH LƯU TRỮ DỮ LIỆU (RETENTION POLICY) TRÊN INFLUXDB v2
# Mục tiêu: Tự động xóa dữ liệu cảm biến cũ hơn 90 ngày để tránh đầy đĩa cứng.
# Hướng dẫn chạy:
# 1. Đảm bảo container InfluxDB đang chạy (docker ps | grep so_influxdb).
# 2. Cấp quyền thực thi và chạy:
#    chmod +x configure-retention.sh
#    ./configure-retention.sh
# ==============================================================================

# Cấu hình tham số InfluxDB
INFLUX_CONTAINER_NAME="so_influxdb"
INFLUX_BUCKET_NAME="sensor_data"
INFLUX_ORG="smart-office"
RETENTION_PERIOD="90d" # 90 ngày (90d = 2160h)

echo "[$(date)] Khởi động cấu hình Retention Policy trên InfluxDB..."

# 1. Kiểm tra xem container InfluxDB có đang chạy hay không
if ! docker ps --format '{{.Names}}' | grep -Eq "^${INFLUX_CONTAINER_NAME}$"; then
    echo "❌ LỖI: Container InfluxDB ($INFLUX_CONTAINER_NAME) không hoạt động!" >&2
    exit 1
fi

# 2. Lấy ID của Bucket "sensor_data" trong InfluxDB
echo "Đang truy vấn ID của bucket '$INFLUX_BUCKET_NAME'..."
BUCKET_ID=$(docker exec "$INFLUX_CONTAINER_NAME" influx bucket list \
  --org "$INFLUX_ORG" \
  --name "$INFLUX_BUCKET_NAME" \
  --token "so-influx-token-2025" \
  --hide-headers | awk '{print $1}')

if [ -z "$BUCKET_ID" ]; then
    echo "❌ LỖI: Không tìm thấy Bucket tên '$INFLUX_BUCKET_NAME' trên InfluxDB!" >&2
    exit 1
fi

echo "Tìm thấy Bucket ID: $BUCKET_ID"

# 3. Cập nhật thời hạn lưu trữ (Retention Period) cho Bucket thành 90 ngày
echo "Đang cấu hình thời gian lưu trữ tối đa thành $RETENTION_PERIOD..."
docker exec "$INFLUX_CONTAINER_NAME" influx bucket update \
  --id "$BUCKET_ID" \
  --retention "2160h" \
  --token "so-influx-token-2025"

# 4. Xác nhận lại cấu hình sau khi cập nhật
echo -e "\n=== THÔNG TIN CẤU HÌNH BUCKET HIỆN TẠI ==="
docker exec "$INFLUX_CONTAINER_NAME" influx bucket list \
  --org "$INFLUX_ORG" \
  --name "$INFLUX_BUCKET_NAME" \
  --token "so-influx-token-2025"

echo -e "==========================================\n"
echo "✅ Đã thiết lập thành công Retention Policy 90 ngày cho dữ liệu cảm biến!"
