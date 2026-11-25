const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');

function formatTransactionRow(row, currentUserId) {
  const isBuyer = Number(row.buyerId) === Number(currentUserId);
  const isSeller = Number(row.sellerId) === Number(currentUserId);
  const peerId = isBuyer ? row.sellerId : row.buyerId;
  const peerHandle = isBuyer ? row.sellerHandle : row.buyerHandle;
  const peerEmoji = isBuyer ? row.sellerEmoji : row.buyerEmoji;

  return {
    id: row.id,
    listingId: row.listingId,
    itemName: row.itemName,
    category: row.category,
    transactionType: row.transactionType,
    status: row.status,
    proposedPrice: row.proposedPrice !== null ? Number(row.proposedPrice) : null,
    swapOffer: row.swapOffer || '',
    startDate: row.startDate || '',
    endDate: row.endDate || '',
    note: row.note || '',
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    buyerHandle: row.buyerHandle,
    buyerEmoji: row.buyerEmoji,
    sellerHandle: row.sellerHandle,
    sellerEmoji: row.sellerEmoji,
    buyerConfirmed: Boolean(row.buyerConfirmed),
    sellerConfirmed: Boolean(row.sellerConfirmed),
    isBuyer,
    isSeller,
    peerProfile: {
      id: peerId,
      handle: peerHandle,
      avatarEmoji: peerEmoji
    },
    hasRated: Boolean(row.myRatingId),
    myRatingScore: row.myRatingScore !== null && row.myRatingScore !== undefined ? Number(row.myRatingScore) : null,
    createdAt: row.createdAt,
    completedAt: row.completedAt
  };
}

function getMyTransactions(req, res, next) {
  try {
    const db = getDb();
    const userId = req.user.id;
    const rows = db
      .prepare(
        `SELECT
           t.id,
           t.listing_id AS listingId,
           l.item_name AS itemName,
           l.category,
           t.transaction_type AS transactionType,
           t.status,
           t.proposed_price AS proposedPrice,
           t.swap_offer AS swapOffer,
           t.start_date AS startDate,
           t.end_date AS endDate,
           t.note,
           t.buyer_id AS buyerId,
           t.seller_id AS sellerId,
           ub.handle AS buyerHandle,
           ub.avatar_emoji AS buyerEmoji,
           us.handle AS sellerHandle,
           us.avatar_emoji AS sellerEmoji,
           t.buyer_confirmed AS buyerConfirmed,
           t.seller_confirmed AS sellerConfirmed,
           t.created_at AS createdAt,
           t.completed_at AS completedAt,
           r.id AS myRatingId,
           r.score AS myRatingScore
         FROM transactions t
         JOIN listings l ON l.id = t.listing_id
         JOIN users ub ON ub.id = t.buyer_id
         JOIN users us ON us.id = t.seller_id
         LEFT JOIN ratings r ON r.transaction_id = t.id AND r.rater_id = ?
         WHERE t.buyer_id = ? OR t.seller_id = ?
         ORDER BY datetime(t.created_at) DESC, t.id DESC`
      )
      .all(userId, userId, userId);

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map((row) => formatTransactionRow(row, userId))
    });
  } catch (err) {
    return next(err);
  }
}

function createTransactionRequest(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', ')
      });
    }

    const db = getDb();
    const buyerId = req.user.id;
    const listingId = parseInt(req.body.listingId, 10);

    const listing = db
      .prepare(
        `SELECT id, seller_id AS sellerId, transaction_type AS transactionType,
                availability_status AS availabilityStatus, selling_price AS sellingPrice,
                rental_price_per_day AS rentalPricePerDay
         FROM listings WHERE id = ?`
      )
      .get(listingId);

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    if (!listing.sellerId) {
      return res.status(400).json({ success: false, message: 'Listing has no assigned campus owner' });
    }

    if (Number(listing.sellerId) === Number(buyerId)) {
      return res.status(400).json({ success: false, message: 'You cannot submit a request on your own listing' });
    }

    if (String(listing.availabilityStatus || 'AVAILABLE').toUpperCase() !== 'AVAILABLE') {
      return res.status(409).json({ success: false, message: 'This listing is currently unavailable' });
    }

    const existingActive = db
      .prepare(
        `SELECT id FROM transactions
         WHERE listing_id = ? AND buyer_id = ? AND status IN ('REQUESTED', 'ACCEPTED')`
      )
      .get(listingId, buyerId);
    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active request for this listing'
      });
    }

    const type = String(listing.transactionType || 'SELL').toUpperCase();
    let proposedPrice = null;
    if (type === 'SELL') {
      const rawPrice = req.body.proposedPrice;
      proposedPrice =
        rawPrice !== undefined && rawPrice !== null && rawPrice !== ''
          ? parseFloat(rawPrice)
          : Number(listing.sellingPrice || 0);
      if (!Number.isFinite(proposedPrice) || proposedPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Proposed price must be greater than ₹0' });
      }
    } else if (type === 'RENT') {
      proposedPrice = Number(listing.rentalPricePerDay || listing.sellingPrice || 0);
    } else {
      proposedPrice = 0;
    }

    const swapOffer = req.body.swapOffer ? String(req.body.swapOffer).trim().slice(0, 200) : '';
    const startDate = req.body.startDate ? String(req.body.startDate).trim().slice(0, 20) : '';
    const endDate = req.body.endDate ? String(req.body.endDate).trim().slice(0, 20) : '';
    const note = req.body.note ? String(req.body.note).trim().slice(0, 300) : '';

    if (type === 'SWAP' && !swapOffer) {
      return res.status(400).json({ success: false, message: 'Please describe the item you are offering to swap' });
    }

    if ((type === 'BORROW' || type === 'RENT') && startDate && endDate && endDate < startDate) {
      return res.status(400).json({ success: false, message: 'Return date must be on or after start date' });
    }

    const insertRes = db
      .prepare(
        `INSERT INTO transactions (
           listing_id, buyer_id, seller_id, transaction_type, status,
           proposed_price, swap_offer, start_date, end_date, note
         ) VALUES (?, ?, ?, ?, 'REQUESTED', ?, ?, ?, ?, ?)`
      )
      .run(listingId, buyerId, listing.sellerId, type, proposedPrice, swapOffer, startDate, endDate, note);

    const created = db
      .prepare(
        `SELECT
           t.id, t.listing_id AS listingId, l.item_name AS itemName, l.category,
           t.transaction_type AS transactionType, t.status, t.proposed_price AS proposedPrice,
           t.swap_offer AS swapOffer, t.start_date AS startDate, t.end_date AS endDate, t.note,
           t.buyer_id AS buyerId, t.seller_id AS sellerId,
           ub.handle AS buyerHandle, ub.avatar_emoji AS buyerEmoji,
           us.handle AS sellerHandle, us.avatar_emoji AS sellerEmoji,
           t.buyer_confirmed AS buyerConfirmed, t.seller_confirmed AS sellerConfirmed,
           t.created_at AS createdAt, t.completed_at AS completedAt,
           NULL AS myRatingId, NULL AS myRatingScore
         FROM transactions t
         JOIN listings l ON l.id = t.listing_id
         JOIN users ub ON ub.id = t.buyer_id
         JOIN users us ON us.id = t.seller_id
         WHERE t.id = ?`
      )
      .get(insertRes.lastInsertRowid);

    return res.status(201).json({
      success: true,
      data: formatTransactionRow(created, buyerId)
    });
  } catch (err) {
    return next(err);
  }
}

function updateTransactionStatus(req, res, next) {
  try {
    const db = getDb();
    const txId = parseInt(req.params.id, 10);
    const action = String(req.body?.action || '').trim().toUpperCase();
    const userId = req.user.id;

    if (Number.isNaN(txId) || txId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid transaction ID' });
    }
    if (!['ACCEPT', 'CONFIRM', 'CANCEL'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be ACCEPT, CONFIRM, or CANCEL' });
    }

    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const isBuyer = Number(tx.buyer_id) === Number(userId);
    const isSeller = Number(tx.seller_id) === Number(userId);
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this transaction' });
    }

    if (tx.status === 'COMPLETED' || tx.status === 'CANCELLED') {
      return res.status(409).json({ success: false, message: `Transaction is already ${tx.status}` });
    }

    const updateTx = db.transaction(() => {
      if (action === 'ACCEPT') {
        if (!isSeller) {
          const err = new Error('Only the listing owner can accept a request');
          err.statusCode = 403;
          throw err;
        }
        if (tx.status !== 'REQUESTED') {
          const err = new Error('Only REQUESTED transactions can be accepted');
          err.statusCode = 409;
          throw err;
        }
        db.prepare("UPDATE transactions SET status = 'ACCEPTED' WHERE id = ?").run(txId);
        db.prepare("UPDATE listings SET availability_status = 'RESERVED' WHERE id = ?").run(tx.listing_id);
      } else if (action === 'CANCEL') {
        db.prepare("UPDATE transactions SET status = 'CANCELLED' WHERE id = ?").run(txId);
        if (tx.status === 'ACCEPTED') {
          db.prepare("UPDATE listings SET availability_status = 'AVAILABLE' WHERE id = ?").run(tx.listing_id);
        }
      } else if (action === 'CONFIRM') {
        if (tx.status !== 'ACCEPTED') {
          const err = new Error('Transaction must be ACCEPTED before confirming completion');
          err.statusCode = 409;
          throw err;
        }
        const nextBuyerConf = isBuyer ? 1 : tx.buyer_confirmed;
        const nextSellerConf = isSeller ? 1 : tx.seller_confirmed;
        const bothConfirmed = nextBuyerConf === 1 && nextSellerConf === 1;

        if (bothConfirmed) {
          db.prepare(
            `UPDATE transactions
             SET buyer_confirmed = 1, seller_confirmed = 1, status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          ).run(txId);
          db.prepare("UPDATE listings SET availability_status = 'COMPLETED' WHERE id = ?").run(tx.listing_id);
        } else {
          db.prepare(
            `UPDATE transactions
             SET buyer_confirmed = ?, seller_confirmed = ?
             WHERE id = ?`
          ).run(nextBuyerConf, nextSellerConf, txId);
        }
      }
    });

    updateTx();

    const updated = db
      .prepare(
        `SELECT
           t.id, t.listing_id AS listingId, l.item_name AS itemName, l.category,
           t.transaction_type AS transactionType, t.status, t.proposed_price AS proposedPrice,
           t.swap_offer AS swapOffer, t.start_date AS startDate, t.end_date AS endDate, t.note,
           t.buyer_id AS buyerId, t.seller_id AS sellerId,
           ub.handle AS buyerHandle, ub.avatar_emoji AS buyerEmoji,
           us.handle AS sellerHandle, us.avatar_emoji AS sellerEmoji,
           t.buyer_confirmed AS buyerConfirmed, t.seller_confirmed AS sellerConfirmed,
           t.created_at AS createdAt, t.completed_at AS completedAt,
           r.id AS myRatingId, r.score AS myRatingScore
         FROM transactions t
         JOIN listings l ON l.id = t.listing_id
         JOIN users ub ON ub.id = t.buyer_id
         JOIN users us ON us.id = t.seller_id
         LEFT JOIN ratings r ON r.transaction_id = t.id AND r.rater_id = ?
         WHERE t.id = ?`
      )
      .get(userId, txId);

    return res.json({
      success: true,
      data: formatTransactionRow(updated, userId)
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    return next(err);
  }
}

module.exports = {
  getMyTransactions,
  createTransactionRequest,
  updateTransactionStatus
};
