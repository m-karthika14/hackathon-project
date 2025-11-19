require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkLatestUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the most recently updated user
    const user = await User.findOne().sort({ updatedAt: -1 });
    if (!user) {
      console.log('❌ No user found');
      process.exit(1);
    }

    console.log('📊 Most Recent User:');
    console.log('   GuestId:', user.guestId);
    console.log('   game:', user.game === null ? 'null' : `"${user.game}"`);
    console.log('   updatedAt:', user.updatedAt);
    console.log('   Sessions:', user.sessions.length);
    
    if (user.sessions.length > 0) {
      const lastSession = user.sessions[user.sessions.length - 1];
      console.log('\n📋 Last Session:');
      console.log('   sessionId:', lastSession.sessionId);
      console.log('   isStart:', lastSession.isStart);
      console.log('   isEnd:', lastSession.isEnd);
      console.log('   games:', lastSession.games.length);
      
      if (lastSession.games.length > 0) {
        console.log('\n🎮 Games in last session:');
        lastSession.games.forEach((game, idx) => {
          console.log(`   ${idx + 1}. ${game.type}:`);
          console.log(`      - start: ${game.start || false}`);
          console.log(`      - end: ${game.end || false}`);
          console.log(`      - logs: ${game.logs ? game.logs.length : 0} entries`);
        });
      }
    }

    console.log('\n🔍 Checking if Mario game has end=true...');
    const lastSession = user.sessions[user.sessions.length - 1];
    const marioGame = lastSession.games.find(g => g.type === 'mario');
    
    if (marioGame) {
      console.log('   ✅ Mario game found');
      console.log('   mario.end:', marioGame.end);
      
      if (marioGame.end === true && user.game !== 'end') {
        console.log('\n❌ PROBLEM FOUND:');
        console.log('   Mario game has end=true, but user.game is not "end"');
        console.log('   This means the backend logic is not updating user.game correctly');
      } else if (marioGame.end === true && user.game === 'end') {
        console.log('\n✅ Everything is correct!');
        console.log('   Mario game has end=true AND user.game="end"');
      } else {
        console.log('\n⚠️ Mario game end flag is:', marioGame.end);
        console.log('   The game may not have sent end=true to the backend');
      }
    } else {
      console.log('   ❌ No Mario game found in last session');
      console.log('   The Mario game may not have saved its data to the backend');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkLatestUser();
