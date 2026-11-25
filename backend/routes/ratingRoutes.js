const express = require('express');
const { body } = require('express-validator');
const { submitRating, getUserRatings } = require('../controllers/ratingController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/user/:userId', getUserRatings);

router.post(
  '/',
  requireAuth,
  [
    body('transactionId').isInt({ min: 1 }).withMessage('Valid transactionId is required'),
    body('score').isInt({ min: 1, max: 5 }).withMessage('Rating score must be an integer between 1 and 5'),
    body('feedback').optional().isString().isLength({ max: 300 }).withMessage('Feedback must be 300 characters or less')
  ],
  submitRating
);

module.exports = router;
