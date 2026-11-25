const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');
const { getUserTrustSummary, getRatingsForUser } = require('../services/trustService');

function submitRating(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', ')
      });
    }

    const db = getDb();
    const raterId = req.user.id;
    const transactionId = parseInt(req.body.transactionId, 10);
    const score = parseInt(req.body.score, 10);
    const feedback = req.body.feedback ? String(req.body.feedback).trim().slice(0, 300) : '';

    const tx = db
      .prepare('SELECT id, buyer_id AS buyerId, seller_id AS sellerId, status FROM transactions WHERE id = ?')
      .get(transactionId);

    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (tx.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Ratings can only be submitted after a transaction is COMPLETED'
      });
    }

    const isBuyer = Number(tx.buyerId) === Number(raterId);
    const isSeller = Number(tx.sellerId) === Number(raterId);
    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Only participants of this completed transaction can submit a rating'
      });
    }

    // Derive ratee server-side as the other party (prevents self-rating or tampering)
    const rateeId = isBuyer ? tx.sellerId : tx.buyerId;
    if (Number(rateeId) === Number(raterId)) {
      return res.status(400).json({ success: false, message: 'Self-rating is not allowed' });
    }

    const existing = db
      .prepare('SELECT id FROM ratings WHERE transaction_id = ? AND rater_id = ?')
      .get(transactionId, raterId);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already rated this transaction'
      });
    }

    const insertRes = db
      .prepare(
        `INSERT INTO ratings (transaction_id, rater_id, ratee_id, score, feedback)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(transactionId, raterId, rateeId, score, feedback);

    const rateeTrust = getUserTrustSummary(db, rateeId);

    return res.status(201).json({
      success: true,
      data: {
        id: insertRes.lastInsertRowid,
        transactionId,
        raterId,
        rateeId,
        score,
        feedback,
        rateeTrust
      }
    });
  } catch (err) {
    if (String(err.message).includes('UNIQUE constraint failed')) {
      return res.status(409).json({ success: false, message: 'You have already rated this transaction' });
    }
    return next(err);
  }
}

function getUserRatings(req, res, next) {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }

    const db = getDb();
    const userRow = db
      .prepare('SELECT id, handle, avatar_emoji AS avatarEmoji, department, is_demo AS isDemo, is_verified AS isVerified FROM users WHERE id = ?')
      .get(userId);

    if (!userRow) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const trust = getUserTrustSummary(db, userId);
    const ratings = getRatingsForUser(db, userId);

    return res.json({
      success: true,
      user: {
        id: userRow.id,
        handle: userRow.handle,
        avatarEmoji: userRow.avatarEmoji,
        department: userRow.department,
        isDemo: Boolean(userRow.isDemo),
        isVerified: Boolean(userRow.isVerified)
      },
      trust,
      ratings
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  submitRating,
  getUserRatings
};
