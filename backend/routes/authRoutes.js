const express = require('express');
const { body } = require('express-validator');
const {
  listDemoPersonas,
  demoLogin,
  getCurrentUser,
  getPublicUserProfile,
  verifyCampusAccount,
  updateProfile,
  logout
} = require('../controllers/authController');
const { attachSessionUser, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/personas', listDemoPersonas);
router.post('/demo-login', demoLogin);
router.get('/me', requireAuth, getCurrentUser);
router.get('/users/:id/profile', getPublicUserProfile);
router.post('/verify-campus', requireAuth, verifyCampusAccount);

router.patch(
  '/profile',
  requireAuth,
  [
    body('handle')
      .optional()
      .trim()
      .isLength({ min: 3, max: 24 })
      .matches(/^[A-Za-z0-9_]+$/)
      .withMessage('Handle must be 3-24 letters, numbers, or underscores'),
    body('avatarEmoji').optional().isString().withMessage('Invalid avatar emoji')
  ],
  updateProfile
);

router.post('/logout', attachSessionUser, logout);

module.exports = router;

