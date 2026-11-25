function computeBadges({ isVerified, completedCount, completedSwaps, completedLends, averageRating, ratingCount }) {
  const badges = [];

  if (isVerified) {
    badges.push({
      id: 'campus-verified',
      label: 'Campus Verified',
      emoji: '✅',
      tone: 'mint',
      reason: 'Confirmed campus roll ID or academic domain'
    });
  }

  if (completedCount >= 1) {
    badges.push({
      id: 'active-looper',
      label: completedCount >= 3 ? 'Campus Regular' : 'Completed Exchange',
      emoji: '🔁',
      tone: 'yellow',
      reason: `${completedCount} completed campus transaction${completedCount === 1 ? '' : 's'}`
    });
  }

  if (completedLends >= 1) {
    badges.push({
      id: 'helpful-lender',
      label: 'Helpful Lender',
      emoji: '🤝',
      tone: 'teal',
      reason: `Shared ${completedLends} borrow or rental item${completedLends === 1 ? '' : 's'}`
    });
  }

  if (completedSwaps >= 1) {
    badges.push({
      id: 'swap-partner',
      label: 'Swap Partner',
      emoji: '🔄',
      tone: 'purple',
      reason: `Completed ${completedSwaps} peer-to-peer swap${completedSwaps === 1 ? '' : 's'}`
    });
  }

  if (ratingCount >= 1 && averageRating >= 4.5) {
    badges.push({
      id: 'top-rated',
      label: 'Top Rated Peer',
      emoji: '⭐',
      tone: 'peach',
      reason: `${averageRating}/5 average from ${ratingCount} student rating${ratingCount === 1 ? '' : 's'}`
    });
  }

  return badges;
}

function getUserTrustSummary(db, userId) {
  const userRow = db
    .prepare('SELECT id, is_verified AS isVerified FROM users WHERE id = ?')
    .get(userId);

  const txStats = db
    .prepare(
      `SELECT
         COUNT(*) AS completedCount,
         SUM(CASE WHEN transaction_type = 'SELL' THEN 1 ELSE 0 END) AS completedSales,
         SUM(CASE WHEN transaction_type = 'SWAP' THEN 1 ELSE 0 END) AS completedSwaps,
         SUM(CASE WHEN transaction_type IN ('BORROW', 'RENT') AND seller_id = ? THEN 1 ELSE 0 END) AS completedLends,
         SUM(CASE WHEN transaction_type IN ('BORROW', 'RENT') THEN 1 ELSE 0 END) AS completedBorrowRent
       FROM transactions
       WHERE status = 'COMPLETED' AND (buyer_id = ? OR seller_id = ?)`
    )
    .get(userId, userId, userId);

  const ratingStats = db
    .prepare(
      `SELECT
         COUNT(*) AS ratingCount,
         ROUND(AVG(score), 1) AS averageRating
       FROM ratings
       WHERE ratee_id = ?`
    )
    .get(userId);

  const summary = {
    isVerified: Boolean(userRow && userRow.isVerified),
    completedCount: Number(txStats?.completedCount || 0),
    completedSales: Number(txStats?.completedSales || 0),
    completedSwaps: Number(txStats?.completedSwaps || 0),
    completedLends: Number(txStats?.completedLends || 0),
    completedBorrowRent: Number(txStats?.completedBorrowRent || 0),
    ratingCount: Number(ratingStats?.ratingCount || 0),
    averageRating:
      ratingStats?.averageRating !== null && ratingStats?.averageRating !== undefined
        ? Number(ratingStats.averageRating)
        : null
  };

  summary.badges = computeBadges(summary);
  return summary;
}

function getUserTrustMap(db, userIds) {
  const uniqueIds = [...new Set((userIds || []).filter((id) => Number.isInteger(Number(id))).map(Number))];
  const map = new Map();
  for (const uid of uniqueIds) {
    map.set(uid, getUserTrustSummary(db, uid));
  }
  return map;
}

function getRatingsForUser(db, userId) {
  return db
    .prepare(
      `SELECT
         r.id,
         r.transaction_id AS transactionId,
         r.score,
         r.feedback,
         r.created_at AS createdAt,
         u.id AS raterId,
         u.handle AS raterHandle,
         u.avatar_emoji AS raterEmoji,
         t.transaction_type AS transactionType,
         l.item_name AS itemName
       FROM ratings r
       JOIN users u ON u.id = r.rater_id
       JOIN transactions t ON t.id = r.transaction_id
       JOIN listings l ON l.id = t.listing_id
       WHERE r.ratee_id = ?
       ORDER BY datetime(r.created_at) DESC, r.id DESC`
    )
    .all(userId);
}

module.exports = {
  getUserTrustSummary,
  getUserTrustMap,
  getRatingsForUser,
  computeBadges
};
