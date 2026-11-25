const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');
const { getUserTrustSummary, getUserTrustMap, getRatingsForUser } = require('../services/trustService');

const ALLOWED_EMOJIS = ['🐼', '🍡', '🦊', '🐨', '🦦', '🍁', '🦉', '🐝', '🐢', '🌵', '🚀', '🎨'];
const RANDOM_ADJECTIVES = ['Pixel', 'Mochi', 'Maple', 'Solar', 'Comet', 'Boba', 'Sprout', 'Velvet'];
const RANDOM_ANIMALS = ['Panda', 'Fox', 'Otter', 'Koala', 'Finch', 'Lynx', 'Badger', 'Gecko'];

function issueSessionToken(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expiresAt
  );
  return token;
}

function formatUser(row, trust = null) {
  const out = {
    id: row.id,
    handle: row.handle,
    avatarEmoji: row.avatarEmoji,
    department: row.department,
    isDemo: Boolean(row.isDemo),
    isVerified: Boolean(row.isVerified)
  };
  if (trust) out.trust = trust;
  return out;
}

function listDemoPersonas(req, res, next) {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
         FROM users
         WHERE is_demo = 1
         ORDER BY id ASC`
      )
      .all();

    const trustMap = getUserTrustMap(
      db,
      rows.map((r) => r.id)
    );

    return res.json({
      success: true,
      allowedEmojis: ALLOWED_EMOJIS,
      data: rows.map((r) => formatUser(r, trustMap.get(r.id)))
    });
  } catch (err) {
    return next(err);
  }
}

function demoLogin(req, res, next) {
  try {
    const db = getDb();
    const requestedHandle = req.body?.handle ? String(req.body.handle).trim() : '';

    let userRow = null;
    if (requestedHandle) {
      userRow = db
        .prepare(
          `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
           FROM users
           WHERE LOWER(handle) = LOWER(?)`
        )
        .get(requestedHandle);

      if (!userRow) {
        return res.status(404).json({ success: false, message: 'Demo persona not found' });
      }
    } else {
      // Create a fresh random pseudonymous demo identity
      const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
      const animal = RANDOM_ANIMALS[Math.floor(Math.random() * RANDOM_ANIMALS.length)];
      const num = Math.floor(10 + Math.random() * 89);
      const handle = `${adj}_${animal}_${num}`;
      const emoji = ALLOWED_EMOJIS[Math.floor(Math.random() * ALLOWED_EMOJIS.length)];

      const insertRes = db
        .prepare(
          `INSERT INTO users (handle, avatar_emoji, department, is_demo, is_verified)
           VALUES (?, ?, 'Campus Student (Demo)', 1, 0)`
        )
        .run(handle, emoji);

      userRow = db
        .prepare(
          `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
           FROM users WHERE id = ?`
        )
        .get(insertRes.lastInsertRowid);
    }

    const token = issueSessionToken(db, userRow.id);
    return res.json({
      success: true,
      token,
      user: formatUser(userRow)
    });
  } catch (err) {
    return next(err);
  }
}

function getCurrentUser(req, res, next) {
  try {
    const db = getDb();
    const trust = getUserTrustSummary(db, req.user.id);
    return res.json({
      success: true,
      user: {
        ...req.user,
        trust
      }
    });
  } catch (err) {
    return next(err);
  }
}

function getPublicUserProfile(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const db = getDb();
    const row = db
      .prepare(
        `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
         FROM users WHERE id = ?`
      )
      .get(userId);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const trust = getUserTrustSummary(db, userId);
    const ratings = getRatingsForUser(db, userId);

    return res.json({
      success: true,
      user: formatUser(row, trust),
      ratings
    });
  } catch (err) {
    return next(err);
  }
}

function verifyCampusAccount(req, res, next) {
  try {
    const db = getDb();
    const rawCode = String(req.body?.campusCredential || '').trim();
    const rollRegex = /^[A-Za-z]{2,6}[-/]?\d{4,8}$/;
    const eduEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(edu|ac\.in|campus\.example)$/i;

    if (!rollRegex.test(rawCode) && !eduEmailRegex.test(rawCode)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid campus roll ID (e.g. CS2024042) or campus email (.edu / .ac.in)'
      });
    }

    db.prepare('UPDATE users SET is_verified = 1, campus_verified_roll = ? WHERE id = ?').run(
      rawCode.slice(0, 60),
      req.user.id
    );

    const updated = db
      .prepare(
        `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
         FROM users WHERE id = ?`
      )
      .get(req.user.id);

    const trust = getUserTrustSummary(db, req.user.id);

    return res.json({
      success: true,
      message: 'Campus student verification completed!',
      user: formatUser(updated, trust)
    });
  } catch (err) {
    return next(err);
  }
}

function updateProfile(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', ')
      });
    }

    const db = getDb();
    const { handle, avatarEmoji, department } = req.body;

    const nextHandle = handle ? String(handle).trim() : req.user.handle;
    const nextEmoji = avatarEmoji && ALLOWED_EMOJIS.includes(avatarEmoji) ? avatarEmoji : req.user.avatarEmoji;
    const nextDept = department ? String(department).trim().slice(0, 60) : req.user.department;

    if (nextHandle.toLowerCase() !== req.user.handle.toLowerCase()) {
      const existing = db
        .prepare('SELECT id FROM users WHERE LOWER(handle) = LOWER(?) AND id != ?')
        .get(nextHandle, req.user.id);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'That pseudonymous handle is already taken. Try another!'
        });
      }
    }

    const updateTx = db.transaction(() => {
      db.prepare(
        `UPDATE users SET handle = ?, avatar_emoji = ?, department = ? WHERE id = ?`
      ).run(nextHandle, nextEmoji, nextDept, req.user.id);

      db.prepare(`UPDATE listings SET seller_name = ? WHERE seller_id = ?`).run(
        `${nextHandle} ${nextEmoji}`,
        req.user.id
      );
    });
    updateTx();

    const updated = db
      .prepare(
        `SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified
         FROM users WHERE id = ?`
      )
      .get(req.user.id);

    return res.json({
      success: true,
      user: formatUser(updated)
    });
  } catch (err) {
    return next(err);
  }
}

function logout(req, res, next) {
  try {
    if (req.sessionToken) {
      const db = getDb();
      db.prepare('DELETE FROM sessions WHERE token = ?').run(req.sessionToken);
    }
    return res.json({ success: true, message: 'Signed out' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listDemoPersonas,
  demoLogin,
  getCurrentUser,
  getPublicUserProfile,
  verifyCampusAccount,
  updateProfile,
  logout,
  ALLOWED_EMOJIS
};
