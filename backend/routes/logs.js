const express = require('express');
const router = express.Router();
const logController = require('../controller/logController');

// POST /api/logs - save raw game logs under a user or guest document
router.post('/', logController.saveGameLogs);

// GET /api/logs/:userId - fetch user's stored game logs (useful for debugging)
router.get('/:userId', logController.getUserGameLogs);

module.exports = router;
