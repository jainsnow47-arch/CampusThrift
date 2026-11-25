const { buildLittleLoop } = require('./mascotService');

function parseJsonArray(raw) {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function computeDaysUntil(eventDateStr) {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const parts = String(eventDateStr || '').split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 999;
  const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.round((targetUtc - todayUtc) / (24 * 60 * 60 * 1000));
}

function formatCountdownLabel(daysUntil) {
  if (daysUntil === 0) return 'Today';
  if (daysUntil === 1) return 'Tomorrow';
  if (daysUntil > 1) return `In ${daysUntil} days`;
  return `${Math.abs(daysUntil)}d ago`;
}

function getMatchForEvent(listing, eventObj) {
  const categories = eventObj.relevantCategories || [];
  const keywords = eventObj.keywords || [];
  const haystack = `${listing.itemName} ${listing.description} ${listing.category}`.toLowerCase();

  let score = 0;
  const matchedKeywords = [];
  for (const kw of keywords) {
    const lowerKw = String(kw).toLowerCase();
    if (lowerKw && haystack.includes(lowerKw)) {
      score += 3;
      matchedKeywords.push(kw);
    }
  }

  const isGenericOther = String(listing.category).toLowerCase() === 'other';
  const catMatch = categories.some((c) => String(c).toLowerCase() === String(listing.category).toLowerCase());
  if (catMatch && (!isGenericOther || matchedKeywords.length > 0 || keywords.length === 0)) {
    score += 2;
  }

  if (score <= 0) return null;

  const reason =
    matchedKeywords.length > 0
      ? `Useful for ${eventObj.eventName} (${matchedKeywords.slice(0, 2).join(', ')})`
      : `Matches ${eventObj.eventName} (${listing.category})`;

  return { score, reason };
}

function fetchAvailablePublicListings(db) {
  // Explicitly omit min_acceptable_price
  const rows = db
    .prepare(
      `SELECT
         l.id,
         l.seller_id AS sellerId,
         l.item_name AS itemName,
         l.category,
         l.condition_grade AS condition,
         l.age_in_months AS ageInMonths,
         l.original_price AS originalPrice,
         l.suggested_price AS suggestedPrice,
         l.selling_price AS sellingPrice,
         l.willing_to_negotiate AS willingToNegotiate,
         l.transaction_type AS transactionType,
         l.availability_status AS availabilityStatus,
         l.swap_for AS swapFor,
         l.rental_price_per_day AS rentalPricePerDay,
         l.min_duration_days AS minDurationDays,
         l.max_duration_days AS maxDurationDays,
         l.collection_location AS collectionLocation,
         l.description,
         l.image_url AS imageUrl,
         l.created_at AS createdAt,
         u.handle AS userHandle,
         u.avatar_emoji AS userAvatarEmoji,
         u.department AS userDepartment,
         u.is_verified AS userIsVerified
       FROM listings l
       LEFT JOIN users u ON u.id = l.seller_id
       WHERE UPPER(COALESCE(l.availability_status, 'AVAILABLE')) = 'AVAILABLE'
       ORDER BY datetime(l.created_at) DESC, l.id DESC`
    )
    .all();

  return rows.map((row) => {
    const item = {
      id: row.id,
      sellerId: row.sellerId,
      itemName: row.itemName,
      category: row.category,
      condition: row.condition,
      ageInMonths: Number(row.ageInMonths),
      originalPrice: Number(row.originalPrice),
      suggestedPrice: row.suggestedPrice !== null ? Number(row.suggestedPrice) : null,
      sellingPrice: Number(row.sellingPrice || 0),
      willingToNegotiate: Boolean(row.willingToNegotiate),
      transactionType: String(row.transactionType || 'SELL').toUpperCase(),
      availabilityStatus: row.availabilityStatus || 'AVAILABLE',
      swapFor: row.swapFor || '',
      rentalPricePerDay: row.rentalPricePerDay !== null ? Number(row.rentalPricePerDay) : null,
      minDurationDays: row.minDurationDays !== null ? Number(row.minDurationDays) : null,
      maxDurationDays: row.maxDurationDays !== null ? Number(row.maxDurationDays) : null,
      collectionLocation: row.collectionLocation || '',
      description: row.description || '',
      imageUrl: row.imageUrl || '',
      sellerProfile: {
        id: row.sellerId,
        handle: row.userHandle || 'Campus_Peer',
        avatarEmoji: row.userAvatarEmoji || '🐼',
        department: row.userDepartment || 'Campus Student',
        isVerified: Boolean(row.userIsVerified)
      }
    };
    item.littleLoop = buildLittleLoop(item);
    return item;
  });
}

function formatEventRow(row, listings) {
  const relevantCategories = parseJsonArray(row.relevant_categories);
  const keywords = parseJsonArray(row.keywords);
  const daysUntil = computeDaysUntil(row.event_date);

  const eventObj = {
    id: row.id,
    slug: row.slug,
    eventName: row.event_name,
    eventDate: row.event_date,
    daysUntil,
    countdownLabel: formatCountdownLabel(daysUntil),
    isApproaching: daysUntil >= 0 && daysUntil <= 21,
    isPast: daysUntil < 0,
    description: row.description,
    bannerMessage: row.banner_message,
    relevantCategories,
    keywords,
    imageUrl: row.image_url || ''
  };

  const matched = [];
  for (const item of listings) {
    const match = getMatchForEvent(item, eventObj);
    if (match) {
      matched.push({
        ...item,
        matchScore: match.score,
        matchReason: match.reason
      });
    }
  }
  matched.sort((a, b) => b.matchScore - a.matchScore || b.id - a.id);

  eventObj.matchingCount = matched.length;
  eventObj.recommendedListings = matched.slice(0, 6);
  return eventObj;
}

function getAllEventsWithRecommendations(db) {
  const eventRows = db
    .prepare(
      `SELECT id, slug, event_name, event_date, description, banner_message, relevant_categories, keywords, image_url
       FROM campus_events
       ORDER BY date(event_date) ASC, id ASC`
    )
    .all();

  const listings = fetchAvailablePublicListings(db);
  return eventRows.map((row) => formatEventRow(row, listings));
}

function getApproachingEvents(db) {
  return getAllEventsWithRecommendations(db).filter((ev) => ev.isApproaching);
}

function getEventByIdWithRecommendations(db, eventId) {
  const row = db
    .prepare(
      `SELECT id, slug, event_name, event_date, description, banner_message, relevant_categories, keywords, image_url
       FROM campus_events
       WHERE id = ?`
    )
    .get(eventId);
  if (!row) return null;
  const listings = fetchAvailablePublicListings(db);
  return formatEventRow(row, listings);
}

module.exports = {
  getAllEventsWithRecommendations,
  getApproachingEvents,
  getEventByIdWithRecommendations
};
