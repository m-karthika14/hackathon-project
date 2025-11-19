require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function fixIdleUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with game: "idle"
    const idleUsers = await User.find({ game: 'idle' });
    console.log(`\n📊 Found ${idleUsers.length} users with game="idle"`);

    if (idleUsers.length === 0) {
      console.log('✅ No users to update');
      process.exit(0);
    }

    // Update all idle users to have game: null
    const result = await User.updateMany(
      { game: 'idle' },
      { $set: { game: null } }
    );

    console.log(`\n✅ Updated ${result.modifiedCount} users`);
    console.log('   game: "idle" → game: null');

    // Verify the update
    const remainingIdle = await User.find({ game: 'idle' });
    console.log(`\n🔍 Verification: ${remainingIdle.length} users still have "idle"`);

    // Show current state of users
    const allUsers = await User.find({}).select('guestId game email');
    console.log('\n📋 Current state of all users:');
    allUsers.forEach(user => {
      console.log(`   ${user.guestId || user.email}: game = ${user.game === null ? 'null' : `"${user.game}"`}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIdleUsers();
