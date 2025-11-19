require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserState() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find your current user
    const user = await User.findOne({ guestId: /^guest_/ }).sort({ createdAt: -1 });
    if (!user) {
      console.log('❌ No guest user found');
      process.exit(1);
    }

    console.log('📊 Current User State:');
    console.log('   GuestId:', user.guestId);
    console.log('   game:', user.game === null ? 'null' : `"${user.game}"`);
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
          console.log(`   ${idx + 1}. ${game.type}: end=${game.end || false}`);
        });
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Expected behavior:');
    console.log('  - Before starting: game = null');
    console.log('  - After clicking "Start Assessment": game = "start"');
    console.log('  - After Mario completes: game = "end"');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserState();
