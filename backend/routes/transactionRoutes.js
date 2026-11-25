const express = require('express');
const { body } = require('express-validator');
const {
  getMyTransactions,
  createTransactionRequest,
  updateTransactionStatus
} = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, getMyTransactions);

router.post(
  '/',
  requireAuth,
  [
    body('listingId').isInt({ min: 1 }).withMessage('Valid listingId is required'),
    body('proposedPrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Invalid proposedPrice'),
    body('swapOffer').optional().isString().isLength({ max: 200 }),
    body('note').optional().isString().isLength({ max: 300 })
  ],
  createTransactionRequest
);

router.patch('/:id/status', requireAuth, updateTransactionStatus);

module.exports = router;
