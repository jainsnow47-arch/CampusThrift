const { validationResult } = require('express-validator');
const { getDb } = require('../config/db');
const { suggestFairPrice, getPricingInsights } = require('../services/pricingService');

function suggestPricing(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map((e) => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const db = getDb();
    const result = suggestFairPrice(db, req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

function fetchPricingInsights(req, res, next) {
  try {
    const db = getDb();
    const insights = getPricingInsights(db);
    return res.json({
      success: true,
      data: insights
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  suggestPricing,
  fetchPricingInsights
};
