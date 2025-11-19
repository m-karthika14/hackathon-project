const express = require('express');
const router = express.Router();
const logController = require('../controller/logController');

// POST /api/logs - save raw game logs under a user or guest document
router.post('/', logController.saveGameLogs);

// GET /api/logs/:userId - fetch user's stored game logs (useful for debugging)
router.get('/:userId', logController.getUserGameLogs);

// ADMIN dev endpoints (protected by ADMIN_KEY env var via x-admin-key header)
router.post('/admin/clear-maze', logController.adminClearMaze);
router.post('/admin/replace-maze', logController.adminReplaceMaze);

module.exports = router;
