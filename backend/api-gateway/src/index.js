require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Path của chứng chỉ TLS (đối phó nguy cơ 4.1.2)
const certPath = process.env.TLS_CERT || '/app/certs/server.crt';
const keyPath = process.env.TLS_KEY || '/app/certs/server.key';
const caPath = process.env.TLS_CA || '/app/certs/ca.crt';

const SERVICES = {
  auth: process.env.AUTH_URL || 'http://auth-service:3001',
  device: process.env.DEVICE_URL || 'http://device-service:3002',
  automation: process.env.AUTOMATION_URL || 'http://automation-service:3003',
  monitoring: process.env.MONITORING_URL || 'http://monitoring-service:3004',
  notification: process.env.NOTIFICATION_URL || 'http://notification-service:3005',
};

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(morgan('tiny'));
app.use(rateLimit({ windowMs: 60_000, max: 10000 }));

// Public paths — no JWT required
const PUBLIC = ['/api/auth/login', '/api/auth/refresh', '/health', '/api/proxy-stream'];

// JWT auth middleware
function auth(req, res, next) {
  if (PUBLIC.some(p => req.path.startsWith(p))) return next();
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(h.slice(7), JWT_SECRET);
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    req.headers['x-user-email'] = payload.email;
    next();
  } catch (e) { res.status(401).json({ error: 'Invalid or expired token' }); }
}

app.use(auth);

const proxy = (target) => createProxyMiddleware({
  target, changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
  on: { error: (err, req, res) => { console.error(`[gateway] proxy error → ${target}:`, err.message); res.status(502).json({ error: 'Service unavailable' }); } },
});

app.use('/api/auth', proxy(SERVICES.auth));
app.use('/api/users', proxy(SERVICES.auth));
app.use('/api/devices', proxy(SERVICES.device));
app.use('/api/automations', proxy(SERVICES.automation));
app.use('/api/sensors', proxy(SERVICES.monitoring));
app.use('/api/notifications', proxy(SERVICES.notification));

app.get('/health', (req, res) => {
  const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
  res.json({
    status: 'ok',
    gateway: 'up',
    services: SERVICES,
    tls: hasCerts || !!process.env.TLS_ENABLED
  });
});

// Proxy MJPEG stream to bypass CORS for frontend AI
app.get('/api/proxy-stream', (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: 'Missing url parameter' });

  const http = require('http');
  const https = require('https');
  const client = targetUrl.startsWith('https') ? https : http;

  const proxyReq = client.get(targetUrl, (proxyRes) => {
    // Thiết lập headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Copy các headers cần thiết từ luồng gốc
    const headersToKeep = ['content-type', 'cache-control', 'connection', 'pragma'];
    headersToKeep.forEach(h => {
      if (proxyRes.headers[h]) res.setHeader(h, proxyRes.headers[h]);
    });

    res.status(proxyRes.statusCode);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    console.error('[gateway] Proxy stream error:', err.message);
    if (!res.headersSent) res.status(502).json({ error: 'Failed to connect to stream' });
  });

  // Xử lý ngắt kết nối từ client
  req.on('close', () => {
    proxyReq.destroy();
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Khởi động server với HTTPS/TLS nếu có chứng chỉ (đối phó nguy cơ 4.1.2) ──
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // Production / Demo: Chạy HTTPS trên cổng 443 (mapped từ HTTPS_PORT)
  const https = require('https');
  const sslOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };
  if (fs.existsSync(caPath)) sslOptions.ca = fs.readFileSync(caPath);

  https.createServer(sslOptions, app).listen(HTTPS_PORT, () => {
    console.log(`[api-gateway] 🔒 HTTPS port ${HTTPS_PORT}`);
  });

  // Vẫn giữ HTTP cho health check nội bộ
  app.listen(PORT, () => console.log(`[api-gateway] HTTP port ${PORT} (internal)`));
} else {
  // Development: Chỉ chạy HTTP (không có chứng chỉ TLS)
  app.listen(PORT, () => {
    console.log(`[api-gateway] ⚠️  HTTP port ${PORT} (TLS certificates not found — dev mode)`);
    console.log(`[api-gateway] Để bật HTTPS, chạy: bash infra/generate-certs.sh`);
  });
}

