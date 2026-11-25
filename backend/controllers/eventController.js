const { getDb } = require('../config/db');
const {
  getAllEventsWithRecommendations,
  getApproachingEvents,
  getEventByIdWithRecommendations
} = require('../services/eventService');

function listCampusEvents(req, res, next) {
  try {
    const db = getDb();
    const events = getAllEventsWithRecommendations(db);
    return res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    return next(err);
  }
}

function listApproachingCampusEvents(req, res, next) {
  try {
    const db = getDb();
    const events = getApproachingEvents(db);
    return res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    return next(err);
  }
}

function getCampusEventById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid event ID' });
    }
    const db = getDb();
    const ev = getEventByIdWithRecommendations(db, id);
    if (!ev) {
      return res.status(404).json({ success: false, message: 'Configured campus event not found' });
    }
    return res.json({
      success: true,
      data: ev
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listCampusEvents,
  listApproachingCampusEvents,
  getCampusEventById
};
