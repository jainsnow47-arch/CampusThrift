const { getDb } = require('../config/db');

function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return null;
}

function attachSessionUser(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      req.user = null;
      return next();
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT u.id, u.handle, u.avatar_emoji AS avatarEmoji, u.department,
                u.is_demo AS isDemo, u.is_verified AS isVerified, s.expires_at AS expiresAt
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = ?`
      )
      .get(token);

    if (!row || new Date(row.expiresAt) <= new Date()) {
      if (row) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
      req.user = null;
      return next();
    }

    req.user = {
      id: row.id,
      handle: row.handle,
      avatarEmoji: row.avatarEmoji,
      department: row.department,
      isDemo: Boolean(row.isDemo),
      isVerified: Boolean(row.isVerified)
    };
    req.sessionToken = token;
    return next();
  } catch (err) {
    return next(err);
  }
}

function requireAuth(req, res, next) {
  attachSessionUser(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please select or sign into a demo campus profile.'
      });
    }
    return next();
  });
}

module.exports = {
  attachSessionUser,
  requireAuth
};
