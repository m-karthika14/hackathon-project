const Report = require('../models/Report');

exports.createReport = async (req, res) => {
  try {
    console.log('=== RECEIVED REPORT DATA ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, gameType, scores, performanceLog, gameMetrics, summary, aiAnalysis } = req.body;
    
    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    const reportData = {
      userId,
      gameType: gameType || 'neurobalance',
      performanceLog,
      gameMetrics,
      summary,
      aiAnalysis
    };

    // Handle different game types with different data structures
    if (gameType === 'NeuroMatrix-ADHD') {
      // For ADHD game, use provided scores or convert from gameMetrics if needed
      if (scores) {
        reportData.scores = scores;
      } else {
        // Fallback conversion if scores are not provided
        reportData.scores = {
          motorControl: req.body.gameMetrics?.overallAccuracy || 0,
          cognitiveLoad: req.body.gameMetrics?.averageReactionTime ? Math.max(0, 100 - req.body.gameMetrics.averageReactionTime / 10) : 0,
          stressManagement: req.body.gameMetrics?.reactionTimeStd ? Math.max(0, 100 - req.body.gameMetrics.reactionTimeStd / 5) : 0,
          behavioralStability: req.body.gameMetrics?.twoBackAccuracy || 0,
          neuroBalance: req.body.gameMetrics?.adhdIndicator || 0,
          // ADHD-specific scores
          accuracy: Math.round((req.body.gameMetrics?.overallAccuracy || 0) * 100),
          speed: req.body.gameMetrics?.averageReactionTime ? Math.max(0, 100 - Math.round(req.body.gameMetrics.averageReactionTime / 10)) : 0,
          consistency: req.body.gameMetrics?.reactionTimeStd ? Math.max(0, 100 - Math.round(req.body.gameMetrics.reactionTimeStd / 10)) : 0,
          flexibility: Math.round((req.body.gameMetrics?.twoBackAccuracy || 0) * 100),
          memory: Math.round((req.body.gameMetrics?.twoBackAccuracy || 0) * 100)
        };
      }
      // Keep the original gameMetrics for ADHD
      reportData.gameMetrics = req.body.gameMetrics;
    } else if (gameType === 'typing') {
      // For typing game, use provided scores or convert from results
      if (scores) {
        reportData.scores = scores;
      } else {
        // Convert typing results to cognitive scores
        const wpm = req.body.results?.wpm || 0;
        const accuracy = req.body.results?.accuracy || 0;
        const consistency = req.body.results?.consistency || 0;
        const neuroBalance = req.body.results?.neuroBalance || 0;
        
        reportData.scores = {
          motorControl: Math.min(100, wpm / 1.5), // WPM reflects motor control
          cognitiveLoad: accuracy, // Accuracy reflects cognitive processing
          stressManagement: consistency, // Consistency reflects stress management
          behavioralStability: Math.min(100, wpm * 0.8), // Sustained speed reflects stability
          neuroBalance: neuroBalance,
          // Typing-specific scores
          wpm: wpm,
          accuracy: accuracy,
          consistency: consistency,
          rawWpm: req.body.results?.rawWpm || 0,
          errors: req.body.results?.errors || 0
        };
      }
      // Keep the original results as gameMetrics for typing
      reportData.gameMetrics = req.body.results || req.body.gameMetrics;
    } else if (gameType === 'ptsd') {
      // For PTSD game, use provided scores or convert from results
      if (scores) {
        reportData.scores = scores;
      } else {
        // Convert PTSD results to cognitive scores
        reportData.scores = {
          motorControl: req.body.gameMetrics?.processingSpeed || 0,
          cognitiveLoad: req.body.gameMetrics?.stressorImpact || 0,
          stressManagement: req.body.gameMetrics?.responseConsistency ? Math.max(0, 100 - req.body.gameMetrics.responseConsistency) : 0,
          behavioralStability: req.body.gameMetrics?.attentionScore || 0,
          neuroBalance: req.body.gameMetrics?.inhibitoryErrors ? Math.max(0, 100 - req.body.gameMetrics.inhibitoryErrors * 10) : 0,
          // PTSD-specific scores
          attention: req.body.gameMetrics?.attentionScore || 0,
          inhibitoryControl: req.body.gameMetrics?.inhibitoryErrors ? Math.max(0, 100 - req.body.gameMetrics.inhibitoryErrors * 10) : 0,
          processingSpeed: req.body.gameMetrics?.processingSpeed || 0,
          stressorImpact: req.body.gameMetrics?.stressorImpact || 0
        };
      }
      // Keep the original gameMetrics for PTSD
      reportData.gameMetrics = req.body.gameMetrics;
    } else {
      // For maze game, use the provided scores
      reportData.scores = scores;
    }

    const report = new Report(reportData);

    console.log('💾 Saving report to MongoDB...');
    console.log('📋 Final report data structure:');
    console.log(`   - User ID: ${reportData.userId}`);
    console.log(`   - Game Type: ${reportData.gameType}`);
    console.log(`   - Scores:`, reportData.scores);
    console.log(`   - Game Metrics:`, reportData.gameMetrics);
    console.log(`   - Performance Log Length: ${reportData.performanceLog?.length || 0}`);
    
    // Validate before saving
    console.log('🔍 Validating data before save...');
    const validationResult = report.validateSync();
    if (validationResult) {
      console.error('❌ Validation failed before save:', validationResult.message);
      throw validationResult;
    }
    console.log('✅ Pre-save validation passed');
    
    const savedReport = await report.save();
    console.log('✅ Report saved successfully!');
    console.log('Report ID:', savedReport._id);
    console.log('🎮 This', reportData.gameType, 'game data is now stored under user:', reportData.userId);

    res.status(201).json({ 
      message: 'Report saved successfully', 
      reportId: savedReport._id,
      report: savedReport 
    });
  } catch (err) {
    console.error('❌ Error saving report:', err);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    
    if (err.name === 'ValidationError') {
      console.error('🔍 Validation errors:');
      for (let field in err.errors) {
        console.error(`   - ${field}: ${err.errors[field].message}`);
      }
    }
    
    res.status(400).json({ 
      error: err.message,
      name: err.name,
      details: err.errors || 'No additional details'
    });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    console.log('📊 Fetching reports with filter:', filter);
    const reports = await Report.find(filter).sort({ createdAt: -1 });
    console.log('✅ Found', reports.length, 'reports');
    res.json(reports);
  } catch (err) {
    console.error('❌ Error fetching reports:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('👤 Fetching reports for user:', userId);
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    console.log('✅ Found', reports.length, 'reports for user');
    res.json(reports);
  } catch (err) {
    console.error('❌ Error fetching user reports:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.saveGameFeature = async (req, res) => {
  // Save per-game features/logs, e.g. in a temp collection or just acknowledge receipt
  // You can expand this to actually store in a collection if you want to persist per-game data
  res.status(200).json({ message: 'Feature received' });
};

// Test endpoint to check database connection
exports.testConnection = async (req, res) => {
  try {
    const reportCount = await Report.countDocuments();
    res.json({ 
      message: 'Database connection successful', 
      totalReports: reportCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ Database test failed:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getUserReportsGrouped = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('👤📊 Fetching grouped reports for user:', userId);
    
    // Get all reports for the user
    const reports = await Report.find({ userId }).sort({ createdAt: -1 });
    
    // Group by game type
    const groupedReports = {
      neurobalance: reports.filter(report => report.gameType === 'neurobalance'),
      adhd: reports.filter(report => report.gameType === 'NeuroMatrix-ADHD'),
      ptsd: reports.filter(report => report.gameType === 'ptsd'),
      total: reports.length
    };
    
    console.log('✅ Found reports for user:');
    console.log(`   - Maze Games (neurobalance): ${groupedReports.neurobalance.length}`);
    console.log(`   - ADHD Games (NeuroMatrix-ADHD): ${groupedReports.adhd.length}`);
    console.log(`   - PTSD Games: ${groupedReports.ptsd.length}`);
    console.log(`   - Total Games: ${groupedReports.total}`);
    
    res.json({
      userId,
      reports: groupedReports,
      summary: {
        mazeGames: groupedReports.neurobalance.length,
        adhdGames: groupedReports.adhd.length,
        ptsdGames: groupedReports.ptsd.length,
        totalGames: groupedReports.total
      }
    });
  } catch (err) {
    console.error('❌ Error fetching grouped user reports:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get detailed PTSD game logs for a user
exports.getPTSDGameLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🧠 Fetching PTSD game logs for user:', userId);
    
    // Get all PTSD reports for the user
    const ptsdReports = await Report.find({ 
      userId, 
      gameType: 'ptsd' 
    }).sort({ createdAt: -1 });
    
    console.log('✅ Found', ptsdReports.length, 'PTSD reports for user');
    
    // Extract detailed logs from each report
    const detailedLogs = ptsdReports.map(report => ({
      reportId: report._id,
      gameDate: report.createdAt,
      scores: report.scores,
      gameMetrics: report.gameMetrics,
      performanceLog: report.performanceLog || [],
      summary: {
        totalTrials: report.performanceLog?.length || 0,
        correctTrials: report.performanceLog?.filter(log => log.correct).length || 0,
        averageReactionTime: report.gameMetrics?.averageReactionTime || 0,
        stressorImpact: report.gameMetrics?.stressorImpact || 0,
        attentionScore: report.gameMetrics?.attentionScore || 0,
        inhibitoryErrors: report.gameMetrics?.inhibitoryErrors || 0
      }
    }));
    
    // Calculate overall statistics
    const allLogs = ptsdReports.flatMap(report => report.performanceLog || []);
    const overallStats = {
      totalGamesPlayed: ptsdReports.length,
      totalTrials: allLogs.length,
      totalCorrect: allLogs.filter(log => log.correct).length,
      overallAccuracy: allLogs.length > 0 ? (allLogs.filter(log => log.correct).length / allLogs.length) * 100 : 0,
      averageReactionTime: allLogs.length > 0 ? allLogs.reduce((sum, log) => sum + (log.rt || 0), 0) / allLogs.length : 0,
      calmImagePerformance: allLogs.filter(log => log.type === 'Calm'),
      suddenImagePerformance: allLogs.filter(log => log.type === 'Sudden')
    };
    
    res.json({
      userId,
      overallStats,
      detailedLogs,
      message: `Found ${ptsdReports.length} PTSD game sessions with ${allLogs.length} total trials`
    });
  } catch (err) {
    console.error('❌ Error fetching PTSD game logs:', err);
    res.status(500).json({ error: err.message });
  }
};
