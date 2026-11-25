const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');

const CATEGORY_THUMBNAILS = {
  Calculators:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#e9f2ec"/><rect x="135" y="28" width="130" height="184" rx="14" fill="#143d2b"/><rect x="150" y="44" width="100" height="40" rx="6" fill="#bbf7d0"/><text x="240" y="72" font-family="monospace" font-size="18" font-weight="bold" fill="#143d2b" text-anchor="end">sin(x)</text><g fill="#ffffff" opacity="0.92"><rect x="152" y="98" width="20" height="18" rx="4"/><rect x="178" y="98" width="20" height="18" rx="4"/><rect x="204" y="98" width="20" height="18" rx="4"/><rect x="230" y="98" width="20" height="18" rx="4"/><rect x="152" y="124" width="20" height="18" rx="4"/><rect x="178" y="124" width="20" height="18" rx="4"/><rect x="204" y="124" width="20" height="18" rx="4"/><rect x="230" y="124" width="20" height="18" rx="4"/><rect x="152" y="150" width="20" height="18" rx="4"/><rect x="178" y="150" width="20" height="18" rx="4"/><rect x="204" y="150" width="20" height="18" rx="4"/><rect x="230" y="150" width="20" height="44" rx="4" fill="#22c55e"/><rect x="152" y="176" width="46" height="18" rx="4"/><rect x="204" y="176" width="20" height="18" rx="4"/></g></svg>`
    ),
  Books:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#fef3c7"/><rect x="95" y="140" width="210" height="34" rx="6" fill="#143d2b"/><rect x="110" y="102" width="180" height="34" rx="6" fill="#22c55e"/><rect x="125" y="64" width="150" height="34" rx="6" fill="#0d291e"/><rect x="145" y="74" width="90" height="10" rx="4" fill="#bbf7d0"/></svg>`
    ),
  Cycles:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#dbeafe"/><circle cx="120" cy="155" r="45" fill="none" stroke="#143d2b" stroke-width="10"/><circle cx="280" cy="155" r="45" fill="none" stroke="#143d2b" stroke-width="10"/><path d="M120 155 L185 155 L230 95 L155 95 Z M230 95 L280 155 M175 75 L200 75 M222 72 L248 72" fill="none" stroke="#22c55e" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    ),
  Electronics:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#ede9fe"/><rect x="105" y="50" width="190" height="120" rx="12" fill="#143d2b"/><rect x="118" y="63" width="164" height="94" rx="6" fill="#bbf7d0"/><path d="M85 178 L315 178 L330 194 L70 194 Z" fill="#143d2b"/></svg>`
    ),
  Furniture:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#ffedd5"/><rect x="90" y="95" width="220" height="20" rx="6" fill="#143d2b"/><rect x="110" y="115" width="16" height="80" rx="4" fill="#143d2b"/><rect x="274" y="115" width="16" height="80" rx="4" fill="#143d2b"/><rect x="145" y="55" width="110" height="40" rx="6" fill="#22c55e"/></svg>`
    ),
  'Lab Equipment':
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#d1fae5"/><path d="M175 45 L225 45 M185 45 L185 95 L140 178 C134 188 142 198 154 198 L246 198 C258 198 266 188 260 178 L215 95 L215 45" fill="#ffffff" stroke="#143d2b" stroke-width="8" stroke-linejoin="round"/><path d="M158 148 L242 148 L254 178 C256 183 252 188 246 188 L154 188 C148 188 144 183 146 178 Z" fill="#22c55e"/></svg>`
    ),
  Other:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><rect width="400" height="240" fill="#f1f5f9"/><rect x="125" y="65" width="150" height="120" rx="12" fill="#143d2b"/><path d="M125 105 L275 105 M200 65 L200 185" stroke="#22c55e" stroke-width="8"/></svg>`
    )
};

function resolveImageUrl(category, imageUrl) {
  if (imageUrl && String(imageUrl).trim()) {
    return String(imageUrl).trim();
  }
  return CATEGORY_THUMBNAILS[category] || CATEGORY_THUMBNAILS.Other;
}

function mapListingRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemName: row.itemName,
    category: row.category,
    condition: row.condition,
    ageInMonths: Number(row.ageInMonths),
    originalPrice: Number(row.originalPrice),
    suggestedPrice: row.suggestedPrice !== null && row.suggestedPrice !== undefined ? Number(row.suggestedPrice) : null,
    sellingPrice: Number(row.sellingPrice),
    description: row.description || '',
    sellerName: row.sellerName,
    contactInfo: row.contactInfo,
    imageUrl: resolveImageUrl(row.category, row.imageUrl),
    createdAt: row.createdAt
  };
}

const SELECT_LISTING_COLUMNS = `
  id,
  item_name AS itemName,
  category,
  condition_grade AS condition,
  age_in_months AS ageInMonths,
  original_price AS originalPrice,
  suggested_price AS suggestedPrice,
  selling_price AS sellingPrice,
  description,
  seller_name AS sellerName,
  contact_info AS contactInfo,
  image_url AS imageUrl,
  created_at AS createdAt
`;

function getAllListings(req, res, next) {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT ${SELECT_LISTING_COLUMNS} FROM listings ORDER BY datetime(created_at) DESC, id DESC`)
      .all();
    return res.json({
      success: true,
      count: rows.length,
      data: rows.map(mapListingRow)
    });
  } catch (err) {
    return next(err);
  }
}

function searchListings(req, res, next) {
  try {
    const db = getDb();
    const { category, condition, minPrice, maxPrice, keyword } = req.query;

    const conditions = [];
    const params = [];

    if (category && category !== 'All') {
      conditions.push('LOWER(category) = LOWER(?)');
      params.push(String(category).trim());
    }
    if (condition && condition !== 'All') {
      conditions.push('LOWER(condition_grade) = LOWER(?)');
      params.push(String(condition).trim());
    }
    if (minPrice !== undefined && minPrice !== '' && !Number.isNaN(Number(minPrice))) {
      conditions.push('selling_price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== '' && !Number.isNaN(Number(maxPrice))) {
      conditions.push('selling_price <= ?');
      params.push(Number(maxPrice));
    }
    if (keyword && String(keyword).trim()) {
      const pattern = `%${String(keyword).trim()}%`;
      conditions.push('(item_name LIKE ? OR description LIKE ? OR category LIKE ?)');
      params.push(pattern, pattern, pattern);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT ${SELECT_LISTING_COLUMNS} FROM listings ${whereClause} ORDER BY datetime(created_at) DESC, id DESC`
      )
      .all(...params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map(mapListingRow)
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
      .prepare(`SELECT ${SELECT_LISTING_COLUMNS} FROM listings WHERE id = ?`)
      .get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    return res.json({
      success: true,
      data: mapListingRow(row)
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

    const {
      itemName,
      category,
      condition,
      ageInMonths,
      originalPrice,
      suggestedPrice,
      sellingPrice,
      description,
      sellerName,
      contactInfo,
      imageUrl
    } = req.body;

    const db = getDb();
    const insertResult = db
      .prepare(
        `INSERT INTO listings
          (item_name, category, condition_grade, age_in_months, original_price, suggested_price, selling_price, description, seller_name, contact_info, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(itemName).trim(),
        String(category).trim(),
        String(condition).trim(),
        parseInt(ageInMonths, 10),
        parseFloat(originalPrice),
        suggestedPrice !== null && suggestedPrice !== undefined && suggestedPrice !== ''
          ? parseFloat(suggestedPrice)
          : null,
        parseFloat(sellingPrice),
        description ? String(description).trim() : '',
        sellerName && String(sellerName).trim() ? String(sellerName).trim() : 'Campus Senior',
        contactInfo && String(contactInfo).trim() ? String(contactInfo).trim() : 'senior@campus.example',
        imageUrl ? String(imageUrl).trim() : ''
      );

    const created = db
      .prepare(`SELECT ${SELECT_LISTING_COLUMNS} FROM listings WHERE id = ?`)
      .get(insertResult.lastInsertRowid);

    return res.status(201).json({
      success: true,
      data: mapListingRow(created)
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
    const result = db.prepare('DELETE FROM listings WHERE id = ?').run(id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

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
