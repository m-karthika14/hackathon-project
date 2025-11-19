// Test script to verify the adhdAnalysisReport data fetching
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const USER_ID = '691e068b0c4975c081cec5eb';

async function testUserReport() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get User model
    const User = require('./backend/models/User');

    // Fetch user
    const user = await User.findById(USER_ID).lean();
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('📋 User Info:');
    console.log('   ID:', user._id);
    console.log('   Guest ID:', user.guestId);
    console.log('   Email:', user.email);
    console.log('   Created:', user.createdAt);
    console.log('');

    // Check if adhdAnalysisReport exists
    if (user.adhdAnalysisReport) {
      console.log('✅ adhdAnalysisReport found in User document!\n');
      
      const report = user.adhdAnalysisReport;
      console.log('📊 ADHD Analysis Report:');
      console.log('   Generated At:', report.generatedAt);
      console.log('   Games Analyzed:', report.gamesAnalyzed?.length || 0);
      console.log('');

      if (report.gamesAnalyzed && report.gamesAnalyzed.length > 0) {
        const latestGame = report.gamesAnalyzed[report.gamesAnalyzed.length - 1];
        const metrics = latestGame.metrics;

        console.log('🎮 Latest Game Metrics:');
        console.log('   Session Number:', latestGame.sessionNumber);
        console.log('   Game Index:', latestGame.gameIndex);
        console.log('');
        
        console.log('📈 Cognitive Metrics (what Report Page will display):');
        console.log('   ┌─────────────────────────────┬────────┐');
        console.log('   │ Metric                      │ Value  │');
        console.log('   ├─────────────────────────────┼────────┤');
        console.log(`   │ Cognitive Performance       │ ${(metrics.cognitivePerformance || 0).toFixed(2).padEnd(6)} │`);
        console.log(`   │ Final Attention             │ ${(metrics.finalAttention || 0).toFixed(2).padEnd(6)} │`);
        console.log(`   │ Motor Control               │ ${(metrics.motorControl || 0).toFixed(2).padEnd(6)} │`);
        console.log(`   │ Cognitive Load              │ ${(metrics.cognitiveLoad || 0).toFixed(2).padEnd(6)} │`);
        console.log(`   │ Behavioral Stability        │ ${(metrics.behavioralStability || 0).toFixed(2).padEnd(6)} │`);
        console.log(`   │ NeuroBalance                │ ${(metrics.neuroBalance || 0).toFixed(2).padEnd(6)} │`);
        console.log('   └─────────────────────────────┴────────┘');
        console.log('');

        // Determine zone
        const score = Math.round(metrics.cognitivePerformance || 0);
        const zoneIndex = Math.floor((score - 1) / 4);
        const zoneLevels = [
          'Critical Low', 'Critical Low', 'Critical Low', 'Critical Low', 'Critical Low',
          'Low', 'Low', 'Low', 'Low',
          'Average', 'Average', 'Average', 'Average',
          'Good', 'Good', 'Good', 'Good',
          'High', 'High', 'High', 'High',
          'Elite', 'Elite', 'Elite', 'Elite'
        ];
        const zoneLevel = zoneLevels[Math.min(24, Math.max(0, zoneIndex))];

        console.log('🎯 Insights Zone:');
        console.log(`   Score: ${score}/100 → Zone ${zoneIndex + 1} (${zoneLevel} Performance)`);
        console.log('');

        console.log('📊 30-Day Trend:');
        const startScore = Math.max(20, score - 15);
        console.log(`   Will generate progressive trend from ${startScore} to ${score}`);
        console.log('   Over 13 data points (Days: 1, 3, 5, 7, 10, 12, 15, 18, 20, 23, 25, 28, 30)');
        console.log('');

        console.log('✅ All data ready for Report Page display!');
      } else {
        console.log('⚠️  No games analyzed yet');
      }
    } else {
      console.log('❌ adhdAnalysisReport NOT found in User document');
      console.log('   Available fields:', Object.keys(user));
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testUserReport();
