const express = require('express');
const { body } = require('express-validator');
const {
  getAllListings,
  searchListings,
  getListingById,
  createListing,
  deleteListing
} = require('../controllers/listingController');
const { attachSessionUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllListings);
// Strictly place /search ahead of /:id
router.get('/search', searchListings);
router.get('/:id', getListingById);

router.post(
  '/',
  attachSessionUser,
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('condition').trim().notEmpty().withMessage('Condition is required'),
    body('ageInMonths').isInt({ min: 0, max: 240 }).withMessage('Age in months must be a non-negative integer'),
    body('originalPrice').isFloat({ gt: 0 }).withMessage('Original price must be greater than 0'),
    body('transactionType')
      .optional()
      .isIn(['SELL', 'SWAP', 'BORROW', 'RENT'])
      .withMessage('Transaction type must be SELL, SWAP, BORROW, or RENT')
  ],
  createListing
);

router.delete('/:id', attachSessionUser, deleteListing);

module.exports = router;
