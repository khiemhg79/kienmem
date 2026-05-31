#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Script tạo chứng chỉ TLS self-signed cho Smart Office
# Dùng cho: MQTTS (port 8883) và HTTPS API Gateway (port 443)
# Đối phó nguy cơ 4.1.2 và 4.1.3: mã hóa kênh truyền
# ═══════════════════════════════════════════════════════════════

set -e

CERT_DIR="$(dirname "$0")/certs"
mkdir -p "$CERT_DIR"

echo "🔐 Tạo Certificate Authority (CA)..."
openssl genrsa -out "$CERT_DIR/ca.key" 2048
openssl req -new -x509 -days 3650 -key "$CERT_DIR/ca.key" \
  -out "$CERT_DIR/ca.crt" \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=SmartOffice/OU=IT/CN=SmartOffice CA"

echo "🔐 Tạo Server Certificate..."
openssl genrsa -out "$CERT_DIR/server.key" 2048
openssl req -new -key "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.csr" \
  -subj "/C=VN/ST=Hanoi/L=Hanoi/O=SmartOffice/OU=IT/CN=localhost"

# Tạo extension file cho Subject Alternative Names
cat > "$CERT_DIR/server-ext.cnf" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = mosquitto
DNS.3 = api-gateway
DNS.4 = *.smartoffice.local
IP.1  = 127.0.0.1
IP.2  = 0.0.0.0
EOF

openssl x509 -req -in "$CERT_DIR/server.csr" \
  -CA "$CERT_DIR/ca.crt" -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
  -out "$CERT_DIR/server.crt" -days 3650 \
  -extfile "$CERT_DIR/server-ext.cnf"

# Cleanup
rm -f "$CERT_DIR/server.csr" "$CERT_DIR/server-ext.cnf" "$CERT_DIR/ca.srl"

echo ""
echo "✅ Chứng chỉ đã tạo thành công tại: $CERT_DIR/"
echo "   - ca.crt      (Certificate Authority)"
echo "   - server.crt   (Server Certificate)"
echo "   - server.key   (Server Private Key)"
echo ""
echo "📋 Sử dụng:"
echo "   - MQTTS (Mosquitto): Mount vào /mosquitto/certs/"
echo "   - HTTPS (Gateway):   Mount vào /app/certs/"
