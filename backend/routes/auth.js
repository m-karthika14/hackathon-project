const express = require('express');
const { login, register, guest } = require('../controller/authController.js');
const User = require('../models/User');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/guest', guest);

// GET /api/auth/session - Fetch current user's session data (supports token or query params)
router.get('/session', async (req, res) => {
  try {
    let user;
    
    // Try to get user from Authorization token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        user = await User.findById(decoded.userId || decoded.id);
      } catch (err) {
        console.log('Token verification failed:', err.message);
      }
    }
    
    // Fallback to query parameters if no token or token failed
    if (!user) {
      const { userId, guestId } = req.query;
      
      if (!userId && !guestId) {
        return res.status(400).json({ message: 'Authorization token or userId/guestId is required' });
      }

      const query = userId ? { _id: userId } : { guestId };
      user = await User.findOne(query);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get the specific session or return ALL sessions with analysisMetrics
    const { sessionId } = req.query;
    
    if (sessionId) {
      // Return specific session
      const session = user.sessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      return res.json({
        userId: user._id,
        guestId: user.guestId,
        email: user.email,
        gameField: user.game,
        session: {
          sessionId: session.sessionId,
          sessionNumber: session.sessionNumber,
          isStart: session.isStart,
          isEnd: session.isEnd,
          startTimeUTC: session.startTimeUTC,
          endTimeUTC: session.endTimeUTC,
          games: session.games // Includes analysisMetrics for ADHD game
        }
      });
    } else {
      // Return ALL sessions (for report page to find latest with analysisMetrics)
      return res.json({
        userId: user._id,
        guestId: user.guestId,
        email: user.email,
        gameField: user.game,
        sessions: user.sessions.map(s => ({
          sessionId: s.sessionId,
          sessionNumber: s.sessionNumber,
          isStart: s.isStart,
          isEnd: s.isEnd,
          startTimeUTC: s.startTimeUTC,
          endTimeUTC: s.endTimeUTC,
          games: s.games // Includes analysisMetrics for ADHD game
        }))
      });
    }
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/auth/adhd-analysis - Fetch ADHD analysis from adhdAnalysisReport collection OR User document
router.get('/adhd-analysis', async (req, res) => {
  try {
    let userId;
    
    // Try to get userId from Authorization token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId || decoded.id;
      } catch (err) {
        console.log('Token verification failed:', err.message);
      }
    }
    
    // Fallback to query parameter
    if (!userId) {
      userId = req.query.userId;
    }
    
    if (!userId) {
      return res.status(400).json({ message: 'Authorization token or userId is required' });
    }

    // STRATEGY 1: Try to get data from User document's adhdAnalysisReport field
    const User = require('../models/User');
    const user = await User.findById(userId).lean();
    
    if (user && user.adhdAnalysisReport && typeof user.adhdAnalysisReport === 'object') {
      // Data exists in User document
      console.log('✅ Found adhdAnalysisReport in User document for:', userId);
      
      // Extract metrics from adhdAnalysisReport
      let cognitivePerformance = null;
      let gamesAnalyzed = user.adhdAnalysisReport.gamesAnalyzed || [];
      
      if (gamesAnalyzed && gamesAnalyzed.length > 0) {
        const latestGame = gamesAnalyzed[gamesAnalyzed.length - 1];
        cognitivePerformance = latestGame.metrics?.cognitivePerformance || null;
      }
      
      return res.json({
        userId: user._id.toString(),
        generatedAt: user.adhdAnalysisReport.generatedAt || user.createdAt,
        cognitivePerformance: cognitivePerformance,
        gamesAnalyzed: gamesAnalyzed,
        fullReport: user.adhdAnalysisReport,
        source: 'user-document'
      });
    }

    // STRATEGY 2: Query the adhdanalysisreports collection directly
    const db = require('mongoose').connection.db;
    const adhdReports = await db.collection('adhdanalysisreports').find({ userId }).toArray();
    
    if (!adhdReports || adhdReports.length === 0) {
      return res.status(404).json({ message: 'No ADHD analysis found for this user' });
    }

    // Get the most recent report
    const latestReport = adhdReports[adhdReports.length - 1];
    
    // Extract cognitivePerformance from the latest game analyzed
    let cognitivePerformance = null;
    if (latestReport.gamesAnalyzed && latestReport.gamesAnalyzed.length > 0) {
      const latestGame = latestReport.gamesAnalyzed[latestReport.gamesAnalyzed.length - 1];
      cognitivePerformance = latestGame.metrics?.cognitivePerformance || null;
    }

    console.log('✅ ADHD Analysis fetched from collection for user:', userId, '| cognitivePerformance:', cognitivePerformance);

    res.json({
      userId: latestReport.userId,
      generatedAt: latestReport.generatedAt,
      cognitivePerformance: cognitivePerformance,
      gamesAnalyzed: latestReport.gamesAnalyzed,
      fullReport: latestReport,
      source: 'collection'
    });
  } catch (error) {
    console.error('Error fetching ADHD analysis:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
