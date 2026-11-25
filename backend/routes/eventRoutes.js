const express = require('express');
const {
  listCampusEvents,
  listApproachingCampusEvents,
  getCampusEventById
} = require('../controllers/eventController');

const router = express.Router();

router.get('/', listCampusEvents);
router.get('/approaching', listApproachingCampusEvents);
router.get('/:id', getCampusEventById);

module.exports = router;
