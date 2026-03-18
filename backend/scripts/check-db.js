/**
 * Oracle DB connection check script
 * Creates a connection using .env credentials and shows what is sent to Oracle.
 *
 * Usage:
 *   cd backend && node scripts/check-db.js
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const oracledb = require('oracledb');

// Resolve wallet/TNS path (same logic as config/database.js)
const backendDir = path.resolve(__dirname, '..');
const walletDir = process.env.TNS_ADMIN
  ? path.resolve(backendDir, process.env.TNS_ADMIN)
  : undefined;

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
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (line.trim().startsWith(alias + ' ') || line.trim().startsWith(alias + '=')) {
        const eq = line.indexOf('=');
        const descriptor = (eq >= 0 ? line.slice(eq + 1) : line).trim();
        if (descriptor.startsWith('(description')) return descriptor;
        break;
      }
    }
  } catch (_) {}
  return raw;
}

async function check() {
  console.log('Property Pro – DB connection check\n');
  console.log('=== 1. Credentials from .env (used for Oracle connection) ===\n');

  const user = process.env.DB_USER;
  const pass = process.env.DB_PASSWORD;
  const connStrRaw = (process.env.DB_CONNECTION_STRING || '').trim();
  const tnsAdmin = process.env.TNS_ADMIN;

  console.log('  DB_USER:             ', user ? `${user.substring(0, 2)}***` : '(not set)');
  console.log('  DB_PASSWORD:         ', pass ? '***' : '(not set)');
  console.log('  DB_CONNECTION_STRING: ', connStrRaw || '(not set)');
  console.log('  TNS_ADMIN:           ', tnsAdmin || '(not set)');
  console.log('  Wallet path resolved: ', walletDir || '(none)');
  if (walletDir) {
    console.log('  Wallet exists:         ', fs.existsSync(walletDir) ? 'yes' : 'no');
  }

  if (!user || !pass || !connStrRaw) {
    console.log('\n❌ Oracle DB not configured. Set DB_USER, DB_PASSWORD, DB_CONNECTION_STRING in backend/.env');
    process.exit(1);
  }

  const connectString = getConnectString();
  const isTnsResolved = connectString !== connStrRaw && connectString.toLowerCase().includes('description=');

  console.log('\n=== 2. Connection config sent to Oracle (oracledb.getConnection) ===\n');

  const connectionConfig = {
    user,
    password: pass,
    connectString,
    ...(walletDir && { configDir: walletDir }),
    connectTimeout: 45000,
  };

  console.log('  user:            ', connectionConfig.user);
  console.log('  password:        ***');
  console.log('  connectString:   ', typeof connectString === 'string'
    ? (connectString.length > 100 ? connectString.slice(0, 100) + '...' : connectString)
    : connectString);
  console.log('  connectString    (length):', typeof connectString === 'string' ? connectString.length : 0);
  if (connectionConfig.configDir) {
    console.log('  configDir:       ', connectionConfig.configDir);
    console.log('  (TNS alias       resolved from tnsnames.ora:', isTnsResolved ? 'yes' : 'no)');
  }
  console.log('  connectTimeout:  ', connectionConfig.connectTimeout, 'ms');

  console.log('\n=== 3. Request sent to Oracle (after connect) ===\n');

  const testSql = 'SELECT SYSDATE AS db_time FROM DUAL';
  const testBinds = {};
  console.log('  SQL:             ', testSql);
  console.log('  Binds:           ', JSON.stringify(testBinds));
  console.log('  (No bind variables for this check.)');

  let conn;
  try {
    console.log('\n--- Connecting... ---\n');
    conn = await oracledb.getConnection(connectionConfig);
    console.log('  ✅ TCP/TLS connection established; Oracle authentication done.\n');

    console.log('--- Executing query... ---\n');
    const result = await conn.execute(testSql, testBinds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    const dbTime = result.rows && result.rows[0] ? (result.rows[0].DB_TIME || result.rows[0].db_time) : null;

    console.log('  Rows returned:   ', result.rows ? result.rows.length : 0);
    console.log('  DB time (SYSDATE):', dbTime != null ? String(dbTime) : '—');
    console.log('\n✅ Connection and query OK.');
  } catch (err) {
    console.log('\n❌ Connection or query failed:', err.message);
    if (err.message && (err.message.includes('TNS') || err.message.includes('ORA-12506') || err.message.includes('refused'))) {
      console.log('   Hint: For Oracle Cloud use TNS alias (e.g. propertypro_tp), wallet in backend/wallet/, TNS_ADMIN=./wallet');
    }
    if (err.errorNum) console.log('   Oracle error code:', err.errorNum);
    process.exit(1);
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log('\n  Connection closed.');
      } catch (e) {
        console.error('  Error closing connection:', e.message);
      }
    }
  }

  process.exit(0);
}

check();
