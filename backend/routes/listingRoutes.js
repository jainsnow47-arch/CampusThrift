const express = require('express');
const { body } = require('express-validator');
const {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  deleteListing
} = require('../controllers/listingController');

const router = express.Router();

router.get('/', getAllListings);
// Strictly place /search ahead of /:id so 'search' is never captured as an ID
router.get('/search', searchListings);
router.get('/:id', getListingById);

router.post(
  '/',
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('condition').trim().notEmpty().withMessage('Condition is required'),
    body('ageInMonths').isInt({ min: 0, max: 240 }).withMessage('Age in months must be a non-negative integer'),
    body('originalPrice').isFloat({ gt: 0 }).withMessage('Original price must be greater than 0'),
    body('sellingPrice').isFloat({ gt: 0 }).withMessage('Selling price must be greater than 0')
  ],
  createListing
);

router.delete('/:id', deleteListing);

module.exports = router;
