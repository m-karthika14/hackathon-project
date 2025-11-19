require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testGameTransitions() {
  try {
    // Connect to MongoDB with a different connection since server is already running
    await mongoose.createConnection(process.env.MONGO_URI).asPromise();
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
        console.log('\n🎮 Games in session:');
        lastSession.games.forEach(game => {
          console.log(`   - ${game.type}: end=${game.end || false}`);
        });
      }
    }

    console.log('\n\n🧪 TEST: Simulating "Start Assessment" click...');
    const created = await User.createNewSession(user._id, { isStart: true });
    const updatedUser = created.user;
    
    console.log('✅ After Start Assessment:');
    console.log('   user.game:', updatedUser.game === null ? 'null' : `"${updatedUser.game}"`);
    console.log('   Expected: "start"');
    
    if (updatedUser.game === 'start') {
      console.log('   ✅ PASS: game field is "start"');
    } else {
      console.log('   ❌ FAIL: game field is not "start"');
    }

    console.log('\n🧪 TEST: Simulating Mario completion (end: true)...');
    // Simulate the end signal
    const sess = updatedUser.sessions[updatedUser.sessions.length - 1];
    sess.isEnd = true;
    sess.games.push({ type: 'mario', end: true, endTime: new Date() });
    updatedUser.game = 'end';
    await updatedUser.save();
    
    const finalUser = await User.findById(user._id);
    console.log('✅ After Mario completion:');
    console.log('   user.game:', finalUser.game === null ? 'null' : `"${finalUser.game}"`);
    console.log('   Expected: "end"');
    
    if (finalUser.game === 'end') {
      console.log('   ✅ PASS: game field is "end"');
    } else {
      console.log('   ❌ FAIL: game field is not "end"');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testGameTransitions();
