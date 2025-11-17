const express = require('express');
const router = express.Router();
const reportController = require('../controller/reportController');

// POST /api/reports - Save a report
router.post('/', async (req, res) => {
  try {
    const { sessionId, userId, durationSec, sessionData } = req.body;

    // Check if a report with the same sessionId already exists
    let report = await Report.findOne({ sessionId });

    if (report) {
      // If report exists, update it
      report.userId = userId;
      report.durationSec = durationSec;
      report.sessionData = sessionData;
      await report.save();
      return res.json(report);
    }

    // If report does not exist, create a new one
    report = new Report({
      sessionId,
      userId,
      durationSec,
      sessionData,
    });

    await report.save();
    res.json(report);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/reports - Fetch all reports (with optional userId query)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/reports/user/:userId - Fetch reports for specific user
router.get('/user/:userId', reportController.getUserReports);

// GET /api/reports/user/:userId/grouped - Fetch reports grouped by game type
router.get('/user/:userId/grouped', reportController.getUserReportsGrouped);

// GET /api/reports/user/:userId/ptsd-logs - Fetch detailed PTSD game logs for a user
router.get('/user/:userId/ptsd-logs', reportController.getPTSDGameLogs);

// GET /api/reports/test - Test database connection
router.get('/test', reportController.testConnection);

// POST /api/reports/features - Save per-game features/logs
router.post('/features', reportController.saveGameFeature);

// @route   POST api/reports/:id/generate-insights
// @desc    Generate and save AI insights for a report
// @access  Public
router.post('/:id/generate-insights', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    // Generate insights using the session data from the report
    const { jsonReport, textReport } = await generateInsights(report.sessionData);

    // Save the generated insights back to the report
    report.aiJsonReport = jsonReport;
    report.aiTextReport = textReport;

    await report.save();

    res.json(report);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
