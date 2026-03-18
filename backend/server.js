/**
 * Property Pro - Backend Server
 * Oracle Cloud ERP Extension for Property & Facility Management
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const db = require('./config/database');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // Allow inline script on /debug/db page (no hash so unsafe-inline applies)
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
})); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '2mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '2mb' })); // Parse form bodies
app.use(morgan('dev')); // Logging

// ---- Debug & health routes first (before any other routes) ----
// Oracle DB connection check handler (used by /health?db=1, /health/db, /api/health/db)
// Add ?debug=1 for extra troubleshooting info (no secrets).
async function healthDb(req, res) {
  const debug = req.query && (req.query.debug === '1' || req.query.debug === 'true');
  const debugInfo = db.getDebugInfo ? db.getDebugInfo() : null;

  const requestSent = {
    sql: 'SELECT SYSDATE AS db_time FROM DUAL',
    binds: {}
  };
  const debugPayload = debug && debugInfo
    ? {
        ...debugInfo,
        user: process.env.DB_USER || null,
        password: process.env.DB_PASSWORD || null,
        connectionRequest: {
          user: process.env.DB_USER || null,
          password: process.env.DB_PASSWORD || null,
          connectString: debugInfo.connectStringFull || debugInfo.connectStringPreview || null,
          configDir: debugInfo.walletPathResolved || null,
          connectTimeout: debugInfo.connectTimeout ?? 45000
        }
      }
    : null;

  if (!db.isConfigured || !db.isConfigured()) {
    return res.status(200).json({
      connected: false,
      message: 'Oracle DB not configured',
      hint: 'Set DB_USER, DB_PASSWORD, and DB_CONNECTION_STRING in backend/.env',
      ...(debug && { requestSent }),
      ...(debugPayload && { debug: debugPayload })
    });
  }
  try {
    const conn = await db.getConnection();
    const result = await conn.execute(requestSent.sql, requestSent.binds);
    await conn.close();
    const dbTime = result.rows && result.rows[0] ? (result.rows[0].DB_TIME || result.rows[0].db_time) : null;
    res.status(200).json({
      connected: true,
      message: 'Oracle database connection OK',
      dbTime: dbTime ? String(dbTime) : null,
      ...(debug && { requestSent }),
      ...(debugPayload && { debug: debugPayload })
    });
  } catch (err) {
    const errMsg = err.message || String(err);
    const isRefused = /ORA-12506|NJS-511|refused|12506/.test(errMsg);
    const hints = isRefused
      ? [
          'Try a different TNS alias in .env: set DB_CONNECTION_STRING=propertypro_tp (or propertypro_medium / propertypro_low) and restart. Oracle ADB often accepts connections on _tp when _high is refused.',
          'Add your IP to Oracle Cloud: Autonomous Database → your DB → Network → Access Control List → Add my IP (or allow the CIDR for this machine).',
          'Ensure outbound TCP port 1522 is allowed (firewall / corporate proxy).',
          'If the database was scaled to zero or stopped, start it from the Oracle Cloud console.'
        ]
      : [];
    res.status(503).json({
      connected: false,
      message: 'Oracle database connection failed',
      error: errMsg,
      ...(hints.length && { hints }),
      ...(debug && { requestSent }),
      ...(debug && {
        errorCode: err.code || null,
        errorStack: process.env.NODE_ENV === 'development' ? (err.stack || null) : undefined,
        debug: debugPayload
      })
    });
  }
}

// Health check: GET /health (basic) or GET /health?db=1 (includes DB check)
app.get('/health', async (req, res) => {
  if (req.query.db === '1' || req.query.db === 'true') {
    return healthDb(req, res);
  }
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Property Pro API',
    version: '1.0.0'
  });
});
app.get('/health/db', healthDb);
app.get('/api/health/db', healthDb);

// Debug pages: mount router so /debug/db is always registered
const debugRouter = require('express').Router();
const DEBUG_DB_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Property Pro – DB connection check</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 24px auto; padding: 0 16px; }
    h1 { font-size: 1.25rem; }
    h2 { font-size: 0.95rem; margin: 16px 0 6px; color: #333; }
    button { padding: 8px 16px; cursor: pointer; margin-bottom: 12px; }
    pre { background: #f4f4f4; padding: 12px; overflow: auto; font-size: 12px; border-radius: 6px; margin: 0 0 8px; }
    .ok { color: #0a0; }
    .err { color: #c00; }
    .muted { color: #666; }
    #result { margin-top: 12px; }
    .section { margin-bottom: 16px; }
    .row { margin: 4px 0; font-size: 13px; }
    .label { font-weight: 600; display: inline-block; min-width: 140px; }
    summary { cursor: pointer; color: #666; font-size: 12px; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>DB connection check</h1>
  <p class="muted">Same as <code>node scripts/check-db.js</code> but from the browser. Uses .env credentials and shows user, password, and request sent to Oracle. <em>For local debugging only—do not use in production.</em></p>
  <button type="button" id="run">Run check</button>
  <div id="result"></div>
  <script>
    function escapeHtml(s) {
      if (s == null) return '';
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }
    document.getElementById('run').onclick = async function () {
      const el = document.getElementById('result');
      el.innerHTML = 'Running…';
      try {
        const r = await fetch('/api/health/db?debug=1');
        const data = await r.json();
        const isOk = data.connected === true;
        el.classList.toggle('ok', isOk);
        el.classList.toggle('err', !isOk);

        var html = '';
        html += '<div class="section"><strong>' + (isOk ? '✅ Connection OK' : '❌ Connection failed') + '</strong>';
        if (data.dbTime) html += ' — DB time: ' + data.dbTime;
        html += '</div>';

        if (data.debug) {
          html += '<h2>1. Connection (from .env)</h2><div class="section">';
          var d = data.debug;
          html += '<div class="row"><span class="label">Configured:</span> ' + d.configured + '</div>';
          html += '<div class="row"><span class="label">DB_USER:</span> <code>' + (d.user != null ? escapeHtml(d.user) : '—') + '</code></div>';
          html += '<div class="row"><span class="label">DB_PASSWORD:</span> <code>' + (d.password != null ? escapeHtml(d.password) : '—') + '</code></div>';
          html += '<div class="row"><span class="label">Connection string:</span> ' + (d.connectionStringAlias || '—') + '</div>';
          if (d.walletPathDisplay) {
            html += '<div class="row"><span class="label">Wallet path (sent to Oracle):</span> <code>' + escapeHtml(d.walletPathDisplay) + '</code></div>';
            html += '<div class="row" style="font-size:11px; color:#666;"><span class="label"></span> SQL Developer can use the .zip; our code uses the <strong>extracted folder</strong> (oracledb needs a folder, not the zip). This path is exactly what we pass as <code>configDir</code>.</div>';
            if (d.walletPathExists !== undefined) {
              html += '<div class="row"><span class="label">Wallet folder exists:</span> ' + (d.walletPathExists ? 'yes' : 'no') + '</div>';
              if (d.walletValid !== undefined) html += '<div class="row"><span class="label">Wallet valid (tnsnames + cert):</span> ' + (d.walletValid ? 'yes' : 'no') + '</div>';
              if (d.walletHasTnsnames !== undefined) html += '<div class="row"><span class="label">tnsnames.ora found:</span> ' + (d.walletHasTnsnames ? 'yes' : 'no') + '</div>';
              if (d.walletHasCwallet !== undefined || d.walletHasEwallet !== undefined) html += '<div class="row"><span class="label">cwallet.sso / ewallet.pem:</span> ' + (d.walletHasCwallet ? 'cwallet.sso' : '') + (d.walletHasCwallet && d.walletHasEwallet ? ', ' : '') + (d.walletHasEwallet ? 'ewallet.pem' : '') + (!d.walletHasCwallet && !d.walletHasEwallet ? 'none' : '') + '</div>';
              if (d.walletFilesFound && d.walletFilesFound.length) html += '<div class="row"><span class="label">Files in wallet folder:</span> ' + escapeHtml(d.walletFilesFound.join(', ')) + '</div>';
            }
          }
          if (d.connectStringPreview) html += '<div class="row"><span class="label">Connect string:</span> <code style="font-size:11px">' + (d.connectStringPreview.length > 60 ? d.connectStringPreview.slice(0,60) + '…' : d.connectStringPreview) + '</code></div>';
          html += '</div>';

          if (d.connectionRequest) {
            var cr = d.connectionRequest;
            html += '<h2>2. Request details (before we send to Oracle)</h2>';
            html += '<p class="muted" style="margin:0 0 8px; font-size:12px;">Exactly what is passed to <code>oracledb.getConnection' + '()</code>:</p>';
            html += '<div class="section">';
            html += '<div class="row"><span class="label">user:</span> <code>' + (cr.user != null ? escapeHtml(cr.user) : '—') + '</code></div>';
            html += '<div class="row"><span class="label">password:</span> <code>' + (cr.password != null ? escapeHtml(cr.password) : '—') + '</code></div>';
            html += '<div class="row"><span class="label">connectString:</span> <pre style="margin:4px 0; white-space:pre-wrap; word-break:break-all;">' + (cr.connectString != null ? escapeHtml(cr.connectString) : '—') + '</pre></div>';
                        html += '<div class="row"><span class="label">configDir:</span> ' + (cr.configDir != null ? escapeHtml(String(cr.configDir).split(String.fromCharCode(92)).join('/')) : '—') + '</div>';
            html += '<div class="row"><span class="label">connectTimeout:</span> ' + (cr.connectTimeout != null ? cr.connectTimeout + ' ms' : '—') + '</div>';
            html += '</div>';
          }

          html += '<h2>3. Request sent to Oracle (after connect)</h2><div class="section">';
          if (data.requestSent) {
            html += '<div class="row"><span class="label">SQL:</span> <code>' + escapeHtml(data.requestSent.sql) + '</code></div>';
            html += '<div class="row"><span class="label">Binds:</span> ' + escapeHtml(JSON.stringify(data.requestSent.binds)) + '</div>';
          } else {
            html += '<div class="row">(no query sent — check failed before execute)</div>';
          }
          html += '</div>';
        }

        if (data.error) {
          html += '<h2>Error</h2><div class="section"><pre>' + escapeHtml(data.error) + '</pre></div>';
          if (data.hints && data.hints.length) {
            html += '<h2>What to try</h2><div class="section"><ul style="margin:0; padding-left:20px;">';
            for (var i = 0; i < data.hints.length; i++) {
              html += '<li style="margin:6px 0;">' + escapeHtml(data.hints[i]) + '</li>';
            }
            html += '</ul></div>';
          }
        }

        html += '<details><summary>Full JSON response</summary><pre>' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre></details>';
        el.innerHTML = html;
      } catch (e) {
        el.innerHTML = '<pre class="err">Request failed: ' + e.message + '</pre>';
        el.classList.add('err');
      }
    };
  </script>
</body>
</html>`;
debugRouter.get('/db', (req, res) => {
  res.type('html').send(DEBUG_DB_HTML);
});
// Redirect /debug to /debug/db
debugRouter.get('/', (req, res) => {
  res.redirect(302, '/debug/db');
});
app.use('/debug', debugRouter);

// Public config (e.g. Google Maps key for frontend map - restrict key by HTTP referrer in Google Cloud)
app.get('/api/config', (req, res) => {
  res.json({
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || ''
  });
});

// API Routes
// Authentication routes (no auth required)
app.use('/api/auth', require('./routes/auth'));

// Global search route
app.use('/api/search', require('./routes/search'));

// Application routes (auth optional for now - will be required in production)
app.use('/api/properties', require('./routes/properties'));
app.use('/api/floors', require('./routes/floors'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use('/api/leases', require('./routes/leases'));
app.use('/api/lease-requests', require('./routes/lease_requests'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/space', require('./routes/space'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/workorders', require('./routes/workorders'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/financials', require('./routes/financials'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/security', require('./routes/security'));
app.use('/api/sustainability', require('./routes/sustainability'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/energy', require('./routes/energy'));
app.use('/api/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Serve frontend static build in production (e.g. OCI deployment)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  const fs = require('fs');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/debug')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server and optionally connect to Oracle
app.listen(PORT, async () => {
  console.log(`🚀 Property Pro API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`🏥 DB check: http://localhost:${PORT}/api/health/db`);
  console.log(`🔧 DB check (browser + debug): http://localhost:${PORT}/debug/db`);
  if (db.isConfigured && db.isConfigured()) {
    try {
      await db.initialize();
    } catch (err) {
      console.warn('⚠️  Oracle DB not available; app will use mock data where applicable.');
    }
  }
});

module.exports = app;

