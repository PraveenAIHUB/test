/**
 * Oracle Database Configuration
 * Connection pool management for Property Pro application
 */

const path = require('path');
const fs = require('fs');
const oracledb = require('oracledb');

// Wallet path: absolute (D:/wallet) → use as-is; relative (./wallet) → from backend dir (same as SQL Developer "extracted folder")
const backendDir = path.resolve(__dirname, '..');
const tnsAdminRaw = (process.env.TNS_ADMIN || '').trim();
const walletDir = tnsAdminRaw
  ? (path.isAbsolute(tnsAdminRaw) ? path.resolve(tnsAdminRaw) : path.resolve(backendDir, tnsAdminRaw))
  : undefined;

/**
 * Inject MY_WALLET_DIRECTORY into the connect descriptor so Oracle can open the wallet
 * (avoids ORA-28759 when sqlnet.ora WALLET_LOCATION doesn't match the actual path)
 */
function injectWalletDirectory(descriptor, walletPath) {
  if (!descriptor || !walletPath) return descriptor;
  const dir = path.resolve(walletPath);
  const walletClause = `(MY_WALLET_DIRECTORY=${dir})`;
  // Find (security=...) and insert (MY_WALLET_DIRECTORY=path) before its closing paren
  const securityStart = descriptor.search(/\(\s*security\s*=/i);
  if (securityStart === -1) return descriptor;
  let depth = 0;
  let i = securityStart;
  while (i < descriptor.length) {
    if (descriptor[i] === '(') depth++;
    else if (descriptor[i] === ')') {
      depth--;
      if (depth === 0) {
        return descriptor.slice(0, i) + walletClause + descriptor.slice(i);
      }
    }
    i++;
  }
  return descriptor;
}

function getConnectString() {
  const raw = (process.env.DB_CONNECTION_STRING || '').trim();
  if (!raw) return raw;
  if (raw.toLowerCase().includes('description=')) return raw;
  if (!walletDir) return raw;
    const tnsPath = path.join(walletDir, 'tnsnames.ora');
    if (!fs.existsSync(tnsPath)) return raw;
    try {
      const content = fs.readFileSync(tnsPath, 'utf8');
      const alias = raw.replace(/\s+/g, ' ').trim();
      let descriptor = findDescriptorInTnsnames(alias, content);
      if (descriptor && descriptor.toLowerCase().includes('description')) {
        descriptor = injectWalletDirectory(descriptor, walletDir);
        return descriptor;
      }
    } catch (_) {}

    // Fallback: if DB_HOST/DB_PORT/DB_SERVICE are provided, build an EZCONNECT-like string
    const host = (process.env.DB_HOST || '').trim();
    const port = (process.env.DB_PORT || '').trim();
    const service = (process.env.DB_SERVICE || '').trim();
    if (host && port && service) {
      return `${host}:${port}/${service}`;
    }
    return raw;
}

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: getConnectString(),
  poolMin: 1,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
  queueTimeout: 120000,
  connectTimeout: 45000,
  enableStatistics: true
};

let pool;
let initAttempted = false;
let oracleClientInitialized = false;

/**
 * Try to find an alias's connect descriptor in a tnsnames.ora file.
 * Handles multi-line descriptors by counting parentheses.
 */
function findDescriptorInTnsnames(alias, tnsContent) {
  if (!alias || !tnsContent) return null;
  const lines = tnsContent.split(/\r?\n/);
  const aliasEsc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const aliasRegex = new RegExp('^\\s*' + aliasEsc + '(\\s*=)?\\s*(\\(.*)?$', 'i');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(aliasRegex);
    if (m) {
      let descriptor = '';
      let parenBalance = 0;
      for (let j = i; j < lines.length; j++) {
        const l = lines[j];
        descriptor += l + '\n';
        for (const ch of l) {
          if (ch === '(') parenBalance++;
          if (ch === ')') parenBalance--;
        }
        if (parenBalance <= 0 && descriptor.includes('(')) {
          const d = descriptor.trim();
          const firstParen = d.indexOf('(');
          if (firstParen > 0) return d.slice(firstParen).trim();
          return d;
        }
      }
      return descriptor.trim() || null;
    }
  }
  return null;
}

function isConfigured() {
  return !!(
    process.env.DB_USER &&
    process.env.DB_PASSWORD &&
    process.env.DB_CONNECTION_STRING
  );
}

/**
 * Return safe debug info (no secrets) for connection troubleshooting
 */
function getDebugInfo() {
  const raw = (process.env.DB_CONNECTION_STRING || '').trim();
  const tnsPath = walletDir ? path.join(walletDir, 'tnsnames.ora') : null;
  const connectString = getConnectString();
  const walletFiles = walletDir && fs.existsSync(walletDir)
    ? fs.readdirSync(walletDir).filter((f) => /^\./.test(f) === false)
    : [];
  const walletHasTns = tnsPath ? fs.existsSync(tnsPath) : false;
  const walletHasCwallet = walletDir ? fs.existsSync(path.join(walletDir, 'cwallet.sso')) : false;
  const walletHasEwallet = walletDir ? fs.existsSync(path.join(walletDir, 'ewallet.pem')) : false;
  const walletValid = walletHasTns && (walletHasCwallet || walletHasEwallet);
  return {
    configured: isConfigured(),
    hasUser: !!process.env.DB_USER,
    hasPassword: !!process.env.DB_PASSWORD,
    hasConnectionString: !!raw,
    connectionStringAlias: raw || null,
    TNS_ADMIN: process.env.TNS_ADMIN || null,
    walletPathResolved: walletDir || null,
    walletPathDisplay: walletDir ? walletDir.replace(/\\/g, '/') : null,
    walletPathExists: walletDir ? fs.existsSync(walletDir) : false,
    walletPathSentToOracle: walletDir || null,
    walletFilesFound: walletFiles,
    walletHasTnsnames: walletHasTns,
    walletHasCwallet,
    walletHasEwallet,
    walletValid,
    tnsnamesPath: tnsPath,
    tnsnamesExists: walletHasTns,
    connectStringLength: typeof connectString === 'string' ? connectString.length : 0,
    connectStringPreview: typeof connectString === 'string'
      ? (connectString.length > 80 ? connectString.slice(0, 80) + '...' : connectString)
      : null,
    connectStringFull: typeof connectString === 'string' ? connectString : null,
    connectTimeout: 45000
  };
}

/**
 * Initialize database connection pool (only when DB_* env vars are set)
 */
async function initialize() {
  if (!isConfigured()) {
    initAttempted = true;
    return null;
  }
  if (pool) return pool;
  // If a wallet directory was resolved, ensure oracledb uses it via initOracleClient
  if (!oracleClientInitialized) {
    try {
      if (typeof oracledb.initOracleClient === 'function') {
        const oracleLibDir = process.env.DB_ORACLE_LIB_DIR || 'D:\\instantclient-basic-windows.x64-23.26.1.0.0\\instantclient_23_0';
        const initOpts = { libDir: oracleLibDir };
        if (walletDir) initOpts.configDir = walletDir;
        oracledb.initOracleClient(initOpts);
        oracleClientInitialized = true;
        console.log('🔐 oracledb.initOracleClient called with libDir=', oracleLibDir, walletDir ? ', configDir=' + walletDir : '');
      }
    } catch (initErr) {
      // If explicit libDir fails, try without it (relies on PATH)
      if (!process.env.DB_ORACLE_LIB_DIR) {
        try {
          if (typeof oracledb.initOracleClient === 'function') {
            const initOpts = walletDir ? { configDir: walletDir } : {};
            oracledb.initOracleClient(initOpts);
            oracleClientInitialized = true;
            console.log('🔐 oracledb.initOracleClient called (using PATH)');
          }
        } catch (fallbackErr) {
          console.warn('⚠️  oracledb.initOracleClient failed (both explicit libDir and PATH):', fallbackErr && fallbackErr.message ? fallbackErr.message : fallbackErr);
        }
      } else {
        console.warn('⚠️  oracledb.initOracleClient failed:', initErr && initErr.message ? initErr.message : initErr);
      }
    }
  }
  try {
    pool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle Database connection pool created');
    try {
      const connection = await pool.getConnection();
      const result = await connection.execute('SELECT SYSDATE FROM DUAL');
      console.log('✅ Database connection test OK:', result.rows[0][0]);
      await connection.close();
    } catch (testErr) {
      const msg = testErr.message || '';
      if (testErr.code === 'NJS-040' || msg.includes('queueTimeout')) {
        console.warn('⚠️  Oracle DB connection timeout (network/firewall?). App will use mock data until DB is reachable.');
      } else if (msg.includes('ORA-12506') || msg.includes('refused')) {
        console.warn('⚠️  Oracle listener refused (ORA-12506). Try: 1) Use propertypro_tp in .env 2) Oracle Cloud → DB → Network → add this machine\'s IP to Access Control 3) Confirm DB is running.');
      } else {
        console.error('❌ Oracle DB test failed:', msg);
      }
      pool = null;
      throw testErr;
    }
    return pool;
  } catch (err) {
    console.error('❌ Error creating database connection pool:', err.message);
    pool = null;
    throw err;
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  if (!pool) {
    await initialize();
  }
  if (!pool) {
    const err = new Error('Database not configured. Set DB_USER, DB_PASSWORD, and DB_CONNECTION_STRING in .env to use Oracle.');
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }
  return await pool.getConnection();
}

/**
 * Execute a query with automatic connection management
 */
async function execute(sql, binds = [], options = {}) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    console.error('❌ Database query error:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Error closing connection:', err);
      }
    }
  }
}

/**
 * Execute multiple queries in a transaction
 */
async function executeTransaction(queries) {
  let connection;
  try {
    connection = await getConnection();
    
    for (const query of queries) {
      await connection.execute(query.sql, query.binds || [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false
      });
    }
    
    await connection.commit();
    console.log('✅ Transaction committed successfully');
    return { success: true };
  } catch (err) {
    if (connection) {
      await connection.rollback();
      console.log('⚠️  Transaction rolled back');
    }
    console.error('❌ Transaction error:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Error closing connection:', err);
      }
    }
  }
}

/**
 * Close the connection pool
 */
async function close() {
  try {
    if (pool) {
      await pool.close(10);
      console.log('✅ Database connection pool closed');
    }
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
    throw err;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await close();
  process.exit(0);
});

module.exports = {
  initialize,
  getConnection,
  execute,
  executeTransaction,
  close,
  isConfigured,
  getDebugInfo
};

