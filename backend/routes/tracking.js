const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Start a new tracking session
router.post('/start', trackingController.startTracking);

// Get tracking results
router.get('/results/:sessionId', trackingController.getResults);

// Get all sessions
router.get('/sessions', trackingController.getSessions);

// Get trend data
router.get('/trends', trackingController.getTrends);

module.exports = router;

