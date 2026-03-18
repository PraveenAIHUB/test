/**
 * Resolve user_id to display name for use in lease requests etc.
 * Uses same mock users as auth when DB is not used.
 */
const db = require('../config/database');

const mockUsers = [
  { user_id: 1, username: 'admin', full_name: 'Admin User' },
  { user_id: 2, username: 'manager', full_name: 'Property Manager' },
  { user_id: 3, username: 'user', full_name: 'Regular User' }
];

async function getUserDisplayName(userId) {
  if (userId == null || userId === '') return null;
  const idStr = String(userId);
  if (db.isConfigured && db.isConfigured()) {
    try {
      const result = await db.execute(
        'SELECT full_name, username FROM users WHERE user_id = :id AND status = \'ACTIVE\'',
        { id: userId }
      );
      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        return row.full_name || row.FULL_NAME || row.username || row.USERNAME || idStr;
      }
    } catch (e) {
      // fall through to mock
    }
  }
  const u = mockUsers.find(u => String(u.user_id) === idStr || u.user_id === Number(userId));
  return u ? (u.full_name || u.username) : null;
}

module.exports = { getUserDisplayName };
