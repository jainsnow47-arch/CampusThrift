const express = require('express');
const { body } = require('express-validator');
const { getAllWanted, createWanted } = require('../controllers/wantedController');

const router = express.Router();

router.get('/', getAllWanted);

router.post(
  '/',
  [
    body('itemName').trim().notEmpty().withMessage('Item name is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('maxBudget').isFloat({ gt: 0 }).withMessage('Max budget must be greater than 0'),
    body('requestedBy').trim().notEmpty().withMessage('Requester name is required'),
    body('contactInfo').trim().notEmpty().withMessage('Contact info is required')
  ],
  createWanted
);

module.exports = router;
