const express = require('express');
const router = express.Router();
const { generateInsights } = require('../services/insightService');
const Report = require('../models/Report');

// @route   POST api/insights/generate
// @desc    Generate insights from session data
// @access  Public
router.post('/generate', async (req, res) => {
  try {
    const sessionData = req.body;
    if (!sessionData) {
      return res.status(400).json({ msg: 'Session data is required' });
    }

    const insights = await generateInsights(sessionData);
    res.json(insights);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/insights/generate-from-report/:reportId
// @desc    Generate new insights from a stored report's session data
// @access  Public
router.post('/generate-from-report/:reportId', async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }

    const sessionData = report.sessionData;
    if (!sessionData) {
      return res.status(400).json({ msg: 'Session data not found in the report' });
    }

    const insights = await generateInsights(sessionData);
    res.json(insights);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
