const express = require('express');
const router = express.Router();
const faceMonitorService = require('../services/faceMonitorService');

// Start face monitoring
router.post('/start', async (req, res) => {
    console.log('🎥 POST /api/face-monitor/start');
    
    try {
        const { userId, gameType } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const result = await faceMonitorService.startMonitoring(userId, gameType || 'general');
        
        if (result.success) {
            res.json({
                success: true,
                sessionId: result.sessionId,
                message: result.message,
                status: faceMonitorService.getStatus()
            });
        } else {
            res.status(500).json(result);
        }

    } catch (error) {
        console.error('❌ Error in face monitor start endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Stop face monitoring
router.post('/stop', async (req, res) => {
    console.log('🛑 POST /api/face-monitor/stop');
    
    try {
        const result = await faceMonitorService.stopMonitoring();
        
        res.json(result);

    } catch (error) {
        console.error('❌ Error in face monitor stop endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get monitoring status
router.get('/status', (req, res) => {
    console.log('📊 GET /api/face-monitor/status');
    
    try {
        const status = faceMonitorService.getStatus();
        res.json({
            success: true,
            ...status
        });
    } catch (error) {
        console.error('❌ Error getting face monitor status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get session data
router.get('/session/:sessionId', async (req, res) => {
    console.log('📥 GET /api/face-monitor/session/:sessionId');
    
    try {
        const { sessionId } = req.params;
        const result = await faceMonitorService.getSessionData(sessionId);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }

    } catch (error) {
        console.error('❌ Error retrieving session data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Face monitor API is healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
