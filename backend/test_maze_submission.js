const fetch = require('node-fetch');

async function testMazeLogs() {
  try {
    console.log('🧪 Testing Maze Logs Submission\n');

    // Step 1: Create a guest user
    console.log('📝 Step 1: Creating guest user...');
    const guestResp = await fetch('http://localhost:5000/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: `test_guest_${Date.now()}` })
    });
    const guestData = await guestResp.json();
    console.log('✅ Guest created:', guestData);
    const userId = guestData.userId;
    const guestId = guestData.guestId;

    // Step 2: Create session (Start Assessment)
    console.log('\n📝 Step 2: Starting assessment...');
    const sessionId = `test_session_${Date.now()}`;
    const startResp = await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: true,
        userId,
        gameKey: 'maze',
        sessionId
      })
    });
    const startData = await startResp.json();
    console.log('✅ Session started:', startData);

    // Step 3: Send maze logs (both level 1 and level 2)
    console.log('\n📝 Step 3: Sending maze logs...');
    
    const level1Log = {
      level: 1,
      startTime: Date.now() - 30000,
      decisionLatencyMs: 500,
      completionTimeMs: 25000,
      moves: 75,
      wallCollisions: 65,
      sharpTurns: 40,
      microMovements: 35,
      path: [
        {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0},
        {x: 4, y: 0}, {x: 5, y: 0}, {x: 6, y: 0}, {x: 7, y: 0}
      ],
      shortestPath: 50,
      pathDeviationRatio: 1.5,
      completionTimestamp: new Date().toISOString(),
      errorLog: [
        { time: new Date().toISOString(), level: 1, event: "Wall collision", position: {x: 5, y: 0} }
      ],
      collisionSpikes: [],
      errorClusters: [],
      idleEvents: [],
      jitter: { sharpTurns: 40, microMovements: 35 },
      decisionLatency: 500,
      moveTimestamps: [],
      inputMethod: "keyboard"
    };

    const level2Log = {
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
    };

    const logsPayload = {
      gameKey: 'maze',
      logs: [level1Log, level2Log],
      sessionId,
      guestId,
      userId
    };

    console.log('📤 Sending payload with 2 levels:');
    console.log('  - Level 1: moves=75, collisions=65');
    console.log('  - Level 2: moves=0, collisions=0');

    const logsResp = await fetch('http://localhost:5000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logsPayload)
    });

    if (!logsResp.ok) {
      const errorText = await logsResp.text();
      console.error('❌ Failed to save logs:', logsResp.status, errorText);
      return;
    }

    const logsData = await logsResp.json();
    console.log('✅ Logs saved! Response:', JSON.stringify(logsData, null, 2));

    // Step 4: Verify what was saved
    console.log('\n📝 Step 4: Verifying saved data...');
    const mongoose = require('mongoose');
    require('dotenv').config();
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    
    const User = require('./models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }

    console.log('\n✅ User found!');
    console.log('  - Game field:', user.game);
    console.log('  - Sessions:', user.sessions.length);

    if (user.sessions.length > 0) {
      const session = user.sessions[user.sessions.length - 1];
      console.log('\n📊 Last Session:');
      console.log('  - Session Number:', session.sessionNumber);
      console.log('  - Started:', session.isStart);
      console.log('  - Games:', session.games.length);

      session.games.forEach((game, idx) => {
        console.log(`\n🎮 Game ${idx + 1}:`);
        console.log('  - Type:', game.type);
        console.log('  - Day:', game.day);
        console.log('  - Logs:', game.logs.length);
        
        if (game.logs.length > 0) {
          game.logs.forEach((log, logIdx) => {
            console.log(`\n  📝 Log ${logIdx + 1}:`);
            console.log('    - Level:', log.level);
            console.log('    - Moves:', log.moves);
            console.log('    - Collisions:', log.wallCollisions);
            console.log('    - Path length:', log.path ? log.path.length : 0);
          });
        }
      });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const mazeGame = user.sessions[0]?.games.find(g => g.type === 'maze');
    if (mazeGame && mazeGame.logs.length > 0) {
      const hasLevel1 = mazeGame.logs.some(l => l.level === 1);
      const hasLevel2 = mazeGame.logs.some(l => l.level === 2);
      
      console.log('✅ Maze game found with', mazeGame.logs.length, 'log(s)');
      console.log('  - Has Level 1:', hasLevel1 ? '✅ YES' : '❌ NO');
      console.log('  - Has Level 2:', hasLevel2 ? '✅ YES (should be NO!)' : '✅ NO (correct!)');
      
      if (hasLevel1 && !hasLevel2) {
        console.log('\n🎉 SUCCESS! Level 1 saved, Level 2 filtered out!');
      } else if (!hasLevel1 && hasLevel2) {
        console.log('\n❌ FAILURE! Level 2 saved instead of Level 1!');
      } else if (hasLevel1 && hasLevel2) {
        console.log('\n⚠️  BOTH levels saved (filter not working)');
      } else {
        console.log('\n❌ FAILURE! No logs saved at all!');
      }
    } else {
      console.log('❌ FAILURE! No maze game found or no logs saved!');
    }

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testMazeLogs();
