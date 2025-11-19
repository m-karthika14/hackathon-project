const mongoose = require('mongoose');
require('dotenv').config();

async function testMazeLogs() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI or MONGO_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Define User schema inline
    const GameSchema = new mongoose.Schema({
      type: { type: String, enum: ['maze', 'adhd'], required: true },
      day: { type: Number, default: 1 },
      startTime: { type: Date, default: null },
      start: { type: Boolean, default: false },
      logs: { type: [mongoose.Schema.Types.Mixed], default: [] },
      endTime: { type: Date, default: null },
      end: { type: Boolean, default: false }
    }, { _id: false, strict: true });

    const SessionSchema = new mongoose.Schema({
      sessionNumber: { type: Number, required: true },
      sessionId: { type: String, default: null },
      startTimeUTC: { type: Date, default: null },
      startTimeIST: { type: String, default: null },
      isStart: { type: Boolean, default: false },
      games: { type: [GameSchema], default: [] },
      endTimeUTC: { type: Date, default: null },
      endTimeIST: { type: String, default: null },
      isEnd: { type: Boolean, default: false }
    }, { _id: false, strict: true });

    const userSchema = new mongoose.Schema({
      guestId: { type: String, index: true, sparse: true },
      email: { type: String, lowercase: true, trim: true, index: true, sparse: true },
      game: { type: String, enum: ['start', 'end', null], default: null },
      passwordHash: { type: String },
      createdAt: { type: Date, default: () => new Date() },
      sessions: { type: [SessionSchema], default: [] }
    }, { strict: true });

    const User = mongoose.model('User', userSchema);

    // Find a user to test with
    const users = await User.find({}).limit(5);
    console.log(`📊 Found ${users.length} users in database\n`);

    if (users.length === 0) {
      console.log('❌ No users found in database');
      process.exit(0);
    }

    // Check each user's sessions and games
    users.forEach((user, idx) => {
      console.log(`\n============ USER ${idx + 1} ============`);
      console.log(`User ID: ${user._id}`);
      console.log(`Email: ${user.email || 'N/A'}`);
      console.log(`Guest ID: ${user.guestId || 'N/A'}`);
      console.log(`Game Status: ${user.game || 'null'}`);
      console.log(`Sessions: ${user.sessions ? user.sessions.length : 0}`);

      if (user.sessions && user.sessions.length > 0) {
        user.sessions.forEach((session, sIdx) => {
          console.log(`\n  📅 Session ${sIdx + 1} (Number: ${session.sessionNumber})`);
          console.log(`     Session ID: ${session.sessionId}`);
          console.log(`     Started: ${session.isStart ? 'Yes' : 'No'}`);
          console.log(`     Ended: ${session.isEnd ? 'Yes' : 'No'}`);
          console.log(`     Games: ${session.games ? session.games.length : 0}`);

          if (session.games && session.games.length > 0) {
            session.games.forEach((game, gIdx) => {
              console.log(`\n     🎮 Game ${gIdx + 1}:`);
              console.log(`        Type: ${game.type}`);
              console.log(`        Day: ${game.day}`);
              console.log(`        Started: ${game.start ? 'Yes' : 'No'}`);
              console.log(`        Ended: ${game.end ? 'Yes' : 'No'}`);
              console.log(`        Logs: ${game.logs ? game.logs.length : 0}`);

              if (game.logs && game.logs.length > 0) {
                console.log(`\n        📝 Log Entries:`);
                game.logs.forEach((log, lIdx) => {
                  console.log(`           Log ${lIdx + 1}:`);
                  console.log(`             - Level: ${log.level || 'N/A'}`);
                  console.log(`             - Moves: ${log.moves || 0}`);
                  console.log(`             - Collisions: ${log.wallCollisions || 0}`);
                  console.log(`             - Completion Time: ${log.completionTimeMs || 0}ms`);
                  console.log(`             - Path Length: ${log.path ? log.path.length : 0}`);
                  console.log(`             - Shortest Path: ${log.shortestPath || 'N/A'}`);
                });
              } else {
                console.log(`        ⚠️  No logs found for this game`);
              }
            });
          } else {
            console.log(`     ⚠️  No games found in this session`);
          }
        });
      } else {
        console.log(`  ⚠️  No sessions found for this user`);
      }
    });

    console.log('\n\n============ SUMMARY ============');
    let totalSessions = 0;
    let totalGames = 0;
    let totalMazeLogs = 0;
    let totalAdhdLogs = 0;

    users.forEach(user => {
      if (user.sessions) {
        totalSessions += user.sessions.length;
        user.sessions.forEach(session => {
          if (session.games) {
            totalGames += session.games.length;
            session.games.forEach(game => {
              if (game.type === 'maze' && game.logs) {
                totalMazeLogs += game.logs.length;
              }
              if (game.type === 'adhd' && game.logs) {
                totalAdhdLogs += game.logs.length;
              }
            });
          }
        });
      }
    });

    console.log(`Total Users: ${users.length}`);
    console.log(`Total Sessions: ${totalSessions}`);
    console.log(`Total Games: ${totalGames}`);
    console.log(`Total Maze Logs: ${totalMazeLogs}`);
    console.log(`Total ADHD Logs: ${totalAdhdLogs}`);

    if (totalMazeLogs === 0) {
      console.log('\n❌ WARNING: No maze logs found in database!');
      console.log('   This means either:');
      console.log('   1. No maze game has been played yet');
      console.log('   2. Logs are being filtered out by backend');
      console.log('   3. Frontend is not sending the data correctly');
    } else {
      console.log('\n✅ Maze logs found successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testMazeLogs();
