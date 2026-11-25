const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');
const { buildLittleLoop } = require('../services/mascotService');
const { getUserTrustSummary, getUserTrustMap } = require('../services/trustService');

const CATEGORY_THUMBNAILS = {
  Calculators:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#BFE8C9"/><rect x="135" y="28" width="130" height="184" rx="14" fill="#111111"/><rect x="148" y="42" width="104" height="40" rx="6" fill="#FFC93C"/><text x="242" y="70" font-family="monospace" font-size="18" font-weight="bold" fill="#111111" text-anchor="end">sin(x)</text><g fill="#FFFDF8"><rect x="150" y="96" width="20" height="18" rx="4"/><rect x="176" y="96" width="20" height="18" rx="4"/><rect x="202" y="96" width="20" height="18" rx="4"/><rect x="228" y="96" width="20" height="18" rx="4"/><rect x="150" y="122" width="20" height="18" rx="4"/><rect x="176" y="122" width="20" height="18" rx="4"/><rect x="202" y="122" width="20" height="18" rx="4"/><rect x="228" y="122" width="20" height="18" rx="4"/><rect x="150" y="148" width="20" height="18" rx="4"/><rect x="176" y="148" width="20" height="18" rx="4"/><rect x="202" y="148" width="20" height="18" rx="4"/><rect x="228" y="148" width="20" height="44" rx="4" fill="#3CC4B3"/><rect x="150" y="174" width="46" height="18" rx="4"/><rect x="202" y="174" width="20" height="18" rx="4"/></g></svg>`
    ),
  Books:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#FFC93C"/><rect x="92" y="140" width="216" height="36" rx="8" fill="#FFFDF8" stroke="#111111" stroke-width="5"/><rect x="108" y="100" width="184" height="36" rx="8" fill="#3CC4B3" stroke="#111111" stroke-width="5"/><rect x="124" y="60" width="152" height="36" rx="8" fill="#9B7BEA" stroke="#111111" stroke-width="5"/><rect x="145" y="72" width="90" height="10" rx="4" fill="#FFFDF8"/></svg>`
    ),
  Cycles:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#4C9BE8"/><circle cx="120" cy="155" r="44" fill="#FFFDF8" stroke="#111111" stroke-width="8"/><circle cx="280" cy="155" r="44" fill="#FFFDF8" stroke="#111111" stroke-width="8"/><path d="M120 155 L185 155 L230 95 L155 95 Z M230 95 L280 155 M175 75 L200 75 M222 72 L248 72" fill="none" stroke="#FFC93C" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    ),
  Electronics:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#9B7BEA"/><rect x="105" y="48" width="190" height="122" rx="12" fill="#111111"/><rect x="118" y="61" width="164" height="96" rx="6" fill="#3CC4B3"/><path d="M85 178 L315 178 L330 196 L70 196 Z" fill="#FFC93C" stroke="#111111" stroke-width="5"/></svg>`
    ),
  Furniture:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#F9C9B0"/><rect x="90" y="95" width="220" height="22" rx="6" fill="#111111"/><rect x="110" y="117" width="18" height="78" rx="4" fill="#111111"/><rect x="272" y="117" width="18" height="78" rx="4" fill="#111111"/><rect x="145" y="55" width="110" height="40" rx="8" fill="#FFC93C" stroke="#111111" stroke-width="5"/></svg>`
    ),
  'Lab Equipment':
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#F7A8C4"/><path d="M175 45 L225 45 M185 45 L185 95 L140 178 C134 188 142 198 154 198 L246 198 C258 198 266 188 260 178 L215 95 L215 45" fill="#FFFDF8" stroke="#111111" stroke-width="8" stroke-linejoin="round"/><path d="M158 148 L242 148 L254 178 C256 183 252 188 246 188 L154 188 C148 188 144 183 146 178 Z" fill="#3CC4B3"/></svg>`
    ),
  Other:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#3CC4B3"/><rect x="125" y="62" width="150" height="122" rx="14" fill="#FFC93C" stroke="#111111" stroke-width="6"/><path d="M125 104 L275 104 M200 62 L200 184" stroke="#111111" stroke-width="6"/></svg>`
    )
};

function resolveImageUrl(category, imageUrl) {
  const cleaned = imageUrl ? String(imageUrl).trim() : '';
  if (cleaned && (/^https?:\/\//i.test(cleaned) || /^data:image\//i.test(cleaned))) {
    return cleaned;
  }
  return CATEGORY_THUMBNAILS[category] || CATEGORY_THUMBNAILS.Other;
}

// NOTE: min_acceptable_price is STRICTLY EXCLUDED from SELECT_LISTING_COLUMNS and every public response.
const SELECT_LISTING_COLUMNS = `
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
  l.allow_multiple_swaps AS allowMultipleSwaps,
  l.rental_price_per_day AS rentalPricePerDay,
  l.min_duration_days AS minDurationDays,
  l.max_duration_days AS maxDurationDays,
  l.refundable_deposit AS refundableDeposit,
  l.collection_location AS collectionLocation,
  l.special_conditions AS specialConditions,
  l.description,
  l.seller_name AS sellerName,
  l.image_url AS imageUrl,
  l.created_at AS createdAt,
  u.handle AS userHandle,
  u.avatar_emoji AS userAvatarEmoji,
  u.department AS userDepartment,
  u.is_demo AS userIsDemo,
  u.is_verified AS userIsVerified
`;

function mapListingRow(row, trustSummary = null) {
  if (!row) return null;
  const transactionType = String(row.transactionType || 'SELL').toUpperCase();
  const sellerHandle = row.userHandle || row.sellerName || 'Campus_Senior';
  const sellerAvatar = row.userAvatarEmoji || '🎓';

  const mapped = {
    id: row.id,
    sellerId: row.sellerId || null,
    itemName: row.itemName,
    category: row.category,
    condition: row.condition,
    ageInMonths: Number(row.ageInMonths),
    originalPrice: Number(row.originalPrice),
    suggestedPrice: row.suggestedPrice !== null && row.suggestedPrice !== undefined ? Number(row.suggestedPrice) : null,
    sellingPrice: Number(row.sellingPrice || 0),
    willingToNegotiate: Boolean(row.willingToNegotiate),
    transactionType,
    availabilityStatus: row.availabilityStatus || 'AVAILABLE',
    swapFor: row.swapFor || '',
    allowMultipleSwaps: Boolean(row.allowMultipleSwaps),
    rentalPricePerDay:
      row.rentalPricePerDay !== null && row.rentalPricePerDay !== undefined
        ? Number(row.rentalPricePerDay)
        : null,
    minDurationDays: row.minDurationDays !== null && row.minDurationDays !== undefined ? Number(row.minDurationDays) : null,
    maxDurationDays: row.maxDurationDays !== null && row.maxDurationDays !== undefined ? Number(row.maxDurationDays) : null,
    refundableDeposit: Number(row.refundableDeposit || 0),
    collectionLocation: row.collectionLocation || '',
    specialConditions: row.specialConditions || '',
    description: row.description || '',
    sellerName: `${sellerHandle} ${sellerAvatar}`.trim(),
    sellerProfile: {
      id: row.sellerId || null,
      handle: sellerHandle,
      avatarEmoji: sellerAvatar,
      department: row.userDepartment || 'Campus Student (Demo)',
      isDemo: row.userIsDemo !== undefined ? Boolean(row.userIsDemo) : true,
      isVerified: Boolean(row.userIsVerified)
    },
    sellerTrust: trustSummary || null,
    imageUrl: resolveImageUrl(row.category, row.imageUrl),
    createdAt: row.createdAt
  };

  mapped.littleLoop = buildLittleLoop(mapped);
  return mapped;
}

function getAllListings(req, res, next) {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT ${SELECT_LISTING_COLUMNS}
         FROM listings l
         LEFT JOIN users u ON u.id = l.seller_id
         ORDER BY datetime(l.created_at) DESC, l.id DESC`
      )
      .all();

    const trustMap = getUserTrustMap(
      db,
      rows.map((r) => r.sellerId)
    );

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map((r) => mapListingRow(r, r.sellerId ? trustMap.get(r.sellerId) : null))
    });
  } catch (err) {
    return next(err);
  }
}

function searchListings(req, res, next) {
  try {
    const db = getDb();
    const { category, condition, transactionType, minPrice, maxPrice, keyword } = req.query;

    const conditions = [];
    const params = [];

    if (category && category !== 'All') {
      conditions.push('LOWER(l.category) = LOWER(?)');
      params.push(String(category).trim());
    }
    if (condition && condition !== 'All') {
      conditions.push('LOWER(l.condition_grade) = LOWER(?)');
      params.push(String(condition).trim());
    }
    if (transactionType && transactionType !== 'All') {
      conditions.push('UPPER(l.transaction_type) = UPPER(?)');
      params.push(String(transactionType).trim());
    }
    if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      conditions.push('COALESCE(l.rental_price_per_day, l.selling_price) >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      conditions.push('COALESCE(l.rental_price_per_day, l.selling_price) <= ?');
      params.push(Number(maxPrice));
    }
    if (keyword && String(keyword).trim()) {
      const pattern = `%${String(keyword).trim()}%`;
      conditions.push('(l.item_name LIKE ? OR l.description LIKE ? OR l.category LIKE ? OR l.swap_for LIKE ?)');
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT ${SELECT_LISTING_COLUMNS}
         FROM listings l
         LEFT JOIN users u ON u.id = l.seller_id
         ${whereClause}
         ORDER BY datetime(l.created_at) DESC, l.id DESC`
      )
      .all(...params);

    const trustMap = getUserTrustMap(
      db,
      rows.map((r) => r.sellerId)
    );

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map((r) => mapListingRow(r, r.sellerId ? trustMap.get(r.sellerId) : null))
    });
  } catch (err) {
    return next(err);
  }
}

function getListingById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID' });
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT ${SELECT_LISTING_COLUMNS}
         FROM listings l
         LEFT JOIN users u ON u.id = l.seller_id
         WHERE l.id = ?`
      )
      .get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const sellerTrust = row.sellerId ? getUserTrustSummary(db, row.sellerId) : null;

    return res.json({
      success: true,
      data: mapListingRow(row, sellerTrust)
    });
  } catch (err) {
    return next(err);
  }
}

function createListing(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const body = req.body;
    const transactionType = String(body.transactionType || 'SELL').trim().toUpperCase();
    if (!['SELL', 'SWAP', 'BORROW', 'RENT'].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'transactionType must be SELL, SWAP, BORROW, or RENT'
      });
    }

    const originalPrice = parseFloat(body.originalPrice);
    let sellingPrice = body.sellingPrice !== undefined && body.sellingPrice !== '' ? parseFloat(body.sellingPrice) : 0;
    let minAcceptablePrice =
      body.minAcceptablePrice !== undefined && body.minAcceptablePrice !== null && body.minAcceptablePrice !== ''
        ? parseFloat(body.minAcceptablePrice)
        : null;
    const willingToNegotiate = body.willingToNegotiate === false || body.willingToNegotiate === 0 ? 0 : 1;
    const swapFor = body.swapFor ? String(body.swapFor).trim() : '';
    const allowMultipleSwaps = body.allowMultipleSwaps === false || body.allowMultipleSwaps === 0 ? 0 : 1;
    let rentalPricePerDay =
      body.rentalPricePerDay !== undefined && body.rentalPricePerDay !== null && body.rentalPricePerDay !== ''
        ? parseFloat(body.rentalPricePerDay)
        : null;
    const minDurationDays =
      body.minDurationDays !== undefined && body.minDurationDays !== null && body.minDurationDays !== ''
        ? parseInt(body.minDurationDays, 10)
        : null;
    const maxDurationDays =
      body.maxDurationDays !== undefined && body.maxDurationDays !== null && body.maxDurationDays !== ''
        ? parseInt(body.maxDurationDays, 10)
        : null;
    const refundableDeposit =
      body.refundableDeposit !== undefined && body.refundableDeposit !== null && body.refundableDeposit !== ''
        ? parseFloat(body.refundableDeposit)
        : 0;
    const collectionLocation = body.collectionLocation ? String(body.collectionLocation).trim() : '';
    const specialConditions = body.specialConditions ? String(body.specialConditions).trim() : '';

    // Type-specific validation
    if (transactionType === 'SELL') {
      if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
        return res.status(400).json({ success: false, message: 'Selling price must be greater than 0 for SELL listings' });
      }
      if (minAcceptablePrice !== null && (!Number.isFinite(minAcceptablePrice) || minAcceptablePrice < 0)) {
        return res.status(400).json({ success: false, message: 'Minimum acceptable price cannot be negative' });
      }
    } else if (transactionType === 'SWAP') {
      if (!swapFor) {
        return res.status(400).json({ success: false, message: 'Please specify what items or categories you want to swap for' });
      }
      sellingPrice = 0;
      minAcceptablePrice = null;
    } else if (transactionType === 'BORROW') {
      sellingPrice = 0;
      minAcceptablePrice = null;
      if (!collectionLocation) {
        return res.status(400).json({ success: false, message: 'Collection location is required for BORROW listings' });
      }
    } else if (transactionType === 'RENT') {
      if (!Number.isFinite(rentalPricePerDay) || rentalPricePerDay <= 0) {
        return res.status(400).json({ success: false, message: 'Rental price per day must be greater than 0 for RENT listings' });
      }
      if (!collectionLocation) {
        return res.status(400).json({ success: false, message: 'Collection location is required for RENT listings' });
      }
      sellingPrice = rentalPricePerDay;
      minAcceptablePrice = null;
    }

    if (minDurationDays !== null && maxDurationDays !== null && minDurationDays > maxDurationDays) {
      return res.status(400).json({
        success: false,
        message: 'Minimum duration days cannot exceed maximum duration days'
      });
    }

    if (!Number.isFinite(refundableDeposit) || refundableDeposit < 0) {
      return res.status(400).json({ success: false, message: 'Refundable deposit cannot be negative' });
    }

    const db = getDb();
    // Server-side identity resolution: NEVER trust frontend-supplied sellerId
    let resolvedUser = req.user;
    if (!resolvedUser) {
      const defaultRow = db
        .prepare('SELECT id, handle, avatar_emoji AS avatarEmoji FROM users ORDER BY id ASC LIMIT 1')
        .get();
      resolvedUser = defaultRow || null;
    }

    const sellerId = resolvedUser ? resolvedUser.id : null;
    const sellerDisplay = resolvedUser
      ? `${resolvedUser.handle} ${resolvedUser.avatarEmoji}`
      : (body.sellerName && String(body.sellerName).trim()) || 'Campus_Senior 🎓';

    const rawImg = body.imageUrl ? String(body.imageUrl).trim() : '';
    const safeImg = /^https?:\/\//i.test(rawImg) ? rawImg : '';

    const insertResult = db
      .prepare(
        `INSERT INTO listings (
          seller_id, item_name, category, condition_grade, age_in_months, original_price,
          suggested_price, selling_price, min_acceptable_price, willing_to_negotiate,
          transaction_type, availability_status, swap_for, allow_multiple_swaps,
          rental_price_per_day, min_duration_days, max_duration_days, refundable_deposit,
          collection_location, special_conditions, description, seller_name, contact_info, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        sellerId,
        String(body.itemName).trim(),
        String(body.category).trim(),
        String(body.condition).trim(),
        parseInt(body.ageInMonths, 10),
        originalPrice,
        body.suggestedPrice !== null && body.suggestedPrice !== undefined && body.suggestedPrice !== ''
          ? parseFloat(body.suggestedPrice)
          : null,
        sellingPrice,
        minAcceptablePrice,
        willingToNegotiate,
        transactionType,
        swapFor,
        allowMultipleSwaps,
        rentalPricePerDay,
        minDurationDays,
        maxDurationDays,
        refundableDeposit,
        collectionLocation,
        specialConditions,
        body.description ? String(body.description).trim() : '',
        sellerDisplay,
        resolvedUser ? `${resolvedUser.handle.toLowerCase()}@campus.example` : 'senior@campus.example',
        safeImg
      );

    const created = db
      .prepare(
        `SELECT ${SELECT_LISTING_COLUMNS}
         FROM listings l
         LEFT JOIN users u ON u.id = l.seller_id
         WHERE l.id = ?`
      )
      .get(insertResult.lastInsertRowid);

    const sellerTrust = created?.sellerId ? getUserTrustSummary(db, created.sellerId) : null;

    return res.status(201).json({
      success: true,
      data: mapListingRow(created, sellerTrust)
    });
  } catch (err) {
    return next(err);
  }
}

function deleteListing(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid listing ID' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, seller_id AS sellerId FROM listings WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Enforce ownership when authenticated
    if (req.user && existing.sellerId && existing.sellerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete listings created under your current campus profile.'
      });
    }

    db.prepare('DELETE FROM listings WHERE id = ?').run(id);
    return res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  deleteListing
};
