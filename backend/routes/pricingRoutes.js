const express = require('express');
const { body } = require('express-validator');
const { suggestPricing, fetchPricingInsights } = require('../controllers/pricingController');

const router = express.Router();

router.post(
  '/suggest',
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('condition').trim().notEmpty().withMessage('Condition is required'),
    body('ageInMonths').isInt({ min: 0, max: 240 }).withMessage('Age in months must be a non-negative integer'),
    body('originalPrice').isFloat({ gt: 0 }).withMessage('Original price must be greater than 0')
  ],
  suggestPricing
);

router.get('/insights', fetchPricingInsights);

module.exports = router;
