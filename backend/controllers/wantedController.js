const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');

const SELECT_WANTED_COLUMNS = `
  id,
  item_name AS itemName,
  category,
  max_budget AS maxBudget,
  description,
  requested_by AS requestedBy,
  contact_info AS contactInfo,
  created_at AS createdAt
`;

function getAllWanted(req, res, next) {
  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT ${SELECT_WANTED_COLUMNS} FROM wanted_requests ORDER BY datetime(created_at) DESC, id DESC`)
      .all();

    return res.json({
      success: true,
      count: rows.length,
      data: rows.map((r) => ({
        ...r,
        maxBudget: Number(r.maxBudget)
      }))
    });
  } catch (err) {
    return next(err);
  }
}

function createWanted(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const { itemName, category, maxBudget, description, requestedBy, contactInfo } = req.body;
    const db = getDb();

    const result = db
      .prepare(
        `INSERT INTO wanted_requests
          (item_name, category, max_budget, description, requested_by, contact_info)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(itemName).trim(),
        String(category).trim(),
        parseFloat(maxBudget),
        description ? String(description).trim() : '',
        String(requestedBy).trim(),
        String(contactInfo).trim()
      );

    const created = db
      .prepare(`SELECT ${SELECT_WANTED_COLUMNS} FROM wanted_requests WHERE id = ?`)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      data: {
        ...created,
        maxBudget: Number(created.maxBudget)
      }
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllWanted,
  createWanted
};
