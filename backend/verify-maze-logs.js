#!/usr/bin/env node
/**
 * Quick verification script for maze logs
 * Usage: node verify-maze-logs.js <userId>
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon';

async function verifyMazeLogs() {
  try {
    const userId = process.argv[2];
    
    if (!userId) {
      console.log('❌ Usage: node verify-maze-logs.js <userId>');
      console.log('   You can find userId in browser localStorage or MongoDB');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log(`🔍 Looking up user: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.log('❌ User not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ User found');
    console.log(`📊 Total sessions: ${user.sessions.length}\n`);

    if (user.sessions.length === 0) {
      console.log('⚠️  No sessions found. User needs to play the game first.');
      await mongoose.disconnect();
      return;
    }

    let mazeGamesFound = 0;
    let totalMazeLogs = 0;

    user.sessions.forEach((session, sessionIdx) => {
      console.log(`Session ${sessionIdx + 1}:`);
      console.log(`  Session Number: ${session.sessionNumber}`);
      console.log(`  Session ID: ${session.sessionId || 'N/A'}`);
      console.log(`  Started: ${session.startTimeUTC || 'N/A'}`);
      console.log(`  Games in session: ${session.games.length}`);

      if (session.games.length === 0) {
        console.log('  ⚠️  No games in this session\n');
        return;
      }

      session.games.forEach((game, gameIdx) => {
        const logsCount = game.logs ? game.logs.length : 0;
        console.log(`\n  Game ${gameIdx + 1}:`);
        console.log(`    Type: ${game.type}`);
        console.log(`    Day: ${game.day}`);
        console.log(`    Started: ${game.start}`);
        console.log(`    Logs: ${logsCount}`);

        if (game.type === 'maze') {
          mazeGamesFound++;
          totalMazeLogs += logsCount;

          if (logsCount === 0) {
            console.log('    ❌ PROBLEM: Maze game has NO logs!');
          } else {
            console.log(`    ✅ Maze logs found: ${logsCount} entries`);
            
            // Show details of first log entry
            const firstLog = game.logs[0];
            console.log('    First log entry:');
            console.log(`      Level: ${firstLog.level || 'N/A'}`);
            console.log(`      Moves: ${firstLog.moves || 'N/A'}`);
            console.log(`      Wall Collisions: ${firstLog.wallCollisions || 'N/A'}`);
            console.log(`      Error Log Events: ${firstLog.errorLog ? firstLog.errorLog.length : 'N/A'}`);
            console.log(`      Move Timestamps: ${firstLog.moveTimestamps ? firstLog.moveTimestamps.length : 'N/A'}`);
            
            // Check for all expected fields
            const expectedFields = ['level', 'moves', 'wallCollisions', 'errorLog', 'moveTimestamps', 'path'];
            const missingFields = expectedFields.filter(field => !(field in firstLog));
            
            if (missingFields.length > 0) {
              console.log(`    ⚠️  Missing fields: ${missingFields.join(', ')}`);
            } else {
              console.log('    ✅ All expected fields present');
            }
          }
        }
      });
      console.log('');
    });

    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Total Maze Games Found: ${mazeGamesFound}`);
    console.log(`Total Maze Log Entries: ${totalMazeLogs}`);
    
    if (mazeGamesFound === 0) {
      console.log('\n❌ NO MAZE GAMES FOUND');
      console.log('   Action: Play through the maze game and check logs');
    } else if (totalMazeLogs === 0) {
      console.log('\n❌ MAZE GAMES FOUND BUT NO LOGS');
      console.log('   Action: Check the debugging guide (MAZE_LOGS_DEBUG_GUIDE.md)');
      console.log('   This indicates logs are not being saved properly');
    } else {
      console.log('\n✅ MAZE LOGS ARE WORKING!');
      console.log(`   ${totalMazeLogs} log entries saved across ${mazeGamesFound} game(s)`);
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  verifyMazeLogs();
}

module.exports = verifyMazeLogs;
