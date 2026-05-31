#!/bin/bash

# ==============================================================================
# SCRIPT TỰ ĐỘNG BACKUP POSTGRESQL DATABASE & DỌN DẸP BACKUP CŨ
# Hướng dẫn chạy tự động hàng ngày:
# 1. Cấp quyền thực thi: chmod +x backup-postgres.sh
# 2. Thêm vào crontab để chạy lúc 2h sáng mỗi ngày:
#    crontab -e
#    Thêm dòng sau vào cuối file:
#    0 2 * * * /path/to/backup-postgres.sh >> /var/log/postgres_backup.log 2>&1
# ==============================================================================

# Cấu hình kết nối cơ sở dữ liệu
DB_CONTAINER_NAME="so_postgres"
DB_USER="postgres"
DB_NAME="smart_office"
BACKUP_DIR="/var/backups/smart-office/postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/smart_office_backup_$DATE.sql"
RETENTION_DAYS=7

echo "[$(date)] Bắt đầu quy trình backup dữ liệu PostgreSQL..."

# 1. Tạo thư mục chứa file backup nếu chưa có
mkdir -p "$BACKUP_DIR"

# 2. Chạy lệnh pg_dump thông qua Docker container
# Lệnh này sẽ kết nối vào container PostgreSQL để dump dữ liệu ra file SQL
if docker exec "$DB_CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"; then
    echo "[$(date)] ✅ Backup thành công! File lưu tại: $BACKUP_FILE"
    
    # Nén file backup để tiết kiệm dung lượng
    gzip "$BACKUP_FILE"
    echo "[$(date)] Nén file backup thành công: $BACKUP_FILE.gz"
else
    echo "[$(date)] ❌ LỖI: Backup PostgreSQL thất bại!" >&2
    exit 1
fi

# 3. Dọn dẹp dữ liệu cũ (Xóa các file backup cũ hơn RETENTION_DAYS ngày)
echo "[$(date)] Tìm kiếm và xóa các file backup cũ hơn $RETENTION_DAYS ngày..."
find "$BACKUP_DIR" -type f -name "smart_office_backup_*.sql.gz" -mtime +$RETENTION_DAYS -exec rm {} \; -exec echo "[$(date)] Đã xóa file backup cũ: {}" \;

echo "[$(date)] Hoàn thành quy trình backup cơ sở dữ liệu."
