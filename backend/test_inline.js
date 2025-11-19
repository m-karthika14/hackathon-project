const fetch = require('node-fetch');

async function runTest() {
  console.log('🧪 === MAZE LOG SUBMISSION TEST ===\n');
  
  try {
    // Step 1: Create guest
    console.log('📝 Creating guest...');
    const guestResp = await fetch('http://localhost:5000/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: `test_${Date.now()}` })
    });
    const guestData = await guestResp.json();
    console.log('✅ Guest created:', guestData.userId);
    
    const { userId, guestId } = guestData;
    const sessionId = `session_${Date.now()}`;
    
    // Step 2: Start session
    console.log('\n📝 Starting session...');
    await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: true, userId, gameKey: 'maze', sessionId })
    });
    console.log('✅ Session started');
    
    // Step 3: Send maze logs (Level 1 and Level 2)
    console.log('\n📝 Sending maze logs...');
    const logs = [
      {
        level: 1,
        startTime: Date.now() - 30000,
        decisionLatencyMs: 500,
        completionTimeMs: 25000,
        moves: 75,
        wallCollisions: 65,
        sharpTurns: 40,
        microMovements: 35,
        path: Array.from({length: 75}, (_, i) => ({x: i % 15, y: Math.floor(i / 15)})),
        shortestPath: 50,
        pathDeviationRatio: 1.5,
        completionTimestamp: new Date().toISOString(),
        errorLog: [{ time: new Date().toISOString(), level: 1, event: "Wall collision" }],
        collisionSpikes: [],
        errorClusters: [],
        idleEvents: [],
        jitter: { sharpTurns: 40, microMovements: 35 },
        decisionLatency: 500,
        moveTimestamps: [],
        inputMethod: "keyboard"
      },
      {
        level: 2,
        startTime: Date.now() - 5000,
        decisionLatencyMs: null,
        completionTimeMs: 1,
        moves: 0,
        wallCollisions: 0,
        sharpTurns: 0,
        microMovements: 0,
        path: [{x: 0, y: 0}],
        shortestPath: 36,
        pathDeviationRatio: 0.027,
        completionTimestamp: new Date().toISOString(),
        errorLog: [],
        collisionSpikes: [],
        errorClusters: [],
        idleEvents: [],
        jitter: { sharpTurns: 0, microMovements: 0 },
        decisionLatency: null,
        moveTimestamps: [],
        inputMethod: "keyboard"
      }
    ];
    
    console.log('📤 Sending 2 logs: Level 1 (moves=75) and Level 2 (moves=0)');
    const logsResp = await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameKey: 'maze', logs, sessionId, guestId, userId })
    });
    
    if (!logsResp.ok) {
      console.error('❌ Failed:', logsResp.status);
      console.error(await logsResp.text());
      return;
    }
    
    const logsData = await logsResp.json();
    console.log('✅ Logs saved successfully!');
    
    // Step 4: Verify in database
    console.log('\n📝 Verifying database...');
    const mongoose = require('mongoose');
    require('dotenv').config();
    
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    const User = require('./models/User');
    const user = await User.findById(userId);
    
    if (!user || !user.sessions || user.sessions.length === 0) {
      console.error('❌ No sessions found!');
      await mongoose.disconnect();
      return;
    }
    
    const session = user.sessions[user.sessions.length - 1];
    const mazeGame = session.games.find(g => g.type === 'maze');
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    
    if (!mazeGame) {
      console.log('❌ FAIL: No maze game found!');
    } else {
      console.log(`✅ Maze game found with ${mazeGame.logs.length} log(s)`);
      
      const hasLevel1 = mazeGame.logs.some(l => l.level === 1);
      const hasLevel2 = mazeGame.logs.some(l => l.level === 2);
      
      console.log(`   Level 1 present: ${hasLevel1 ? '✅ YES' : '❌ NO'}`);
      console.log(`   Level 2 present: ${hasLevel2 ? '❌ YES (should be filtered!)' : '✅ NO (correct!)'}`);
      
      if (mazeGame.logs.length > 0) {
        console.log('\n📝 Log details:');
        mazeGame.logs.forEach((log, idx) => {
          console.log(`   Log ${idx + 1}: level=${log.level}, moves=${log.moves}, collisions=${log.wallCollisions}`);
        });
      }
      
      console.log('\n' + '='.repeat(60));
      if (hasLevel1 && !hasLevel2) {
        console.log('🎉 SUCCESS! Level 1 saved, Level 2 filtered out correctly!');
      } else if (!hasLevel1 && hasLevel2) {
        console.log('❌ FAILURE! Level 2 saved instead of Level 1!');
      } else if (hasLevel1 && hasLevel2) {
        console.log('⚠️  PARTIAL: Both levels saved (filter not working)');
      } else {
        console.log('❌ FAILURE! No logs saved at all!');
      }
      console.log('='.repeat(60));
    }
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runTest();
