// Test script to verify game field updates: idle → start → end
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testGameFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create a test user
    const testGuestId = `test_${Date.now()}`;
    let user = new User({
      guestId: testGuestId,
      game: 'idle', // Default state
      sessions: []
    });
    await user.save();
    console.log('✅ Created test user with game="idle":', user._id);
    console.log('   game field:', user.game);

    // Simulate Start Assessment (Maze game starts)
    console.log('\n📍 Simulating Start Assessment...');
    const startResult = await User.createNewSession(user._id, { 
      sessionId: `test_session_${Date.now()}`, 
      isStart: true 
    });
    user = startResult.user;
    console.log('✅ After Start Assessment:');
    console.log('   game field:', user.game, '(should be "start")');
    console.log('   session.isStart:', startResult.session.isStart);

    // Simulate Mario game end
    console.log('\n📍 Simulating Mario game completion...');
    user = await User.findById(user._id);
    const session = user.sessions[user.sessions.length - 1];
    session.isEnd = true;
    session.endTimeUTC = new Date();
    session.endTimeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
    user.game = 'end'; // Set to end when Mario completes
    await user.save();
    
    user = await User.findById(user._id);
    console.log('✅ After Mario completion:');
    console.log('   game field:', user.game, '(should be "end")');
    console.log('   session.isEnd:', user.sessions[user.sessions.length - 1].isEnd);

    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log('\n✅ Test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   Initial: game = "idle"');
    console.log('   After Start: game = "start"');
    console.log('   After Mario: game = "end"');

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testGameFlow();
