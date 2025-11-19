const mongoose = require('mongoose');
require('dotenv').config();

async function clearDatabase() {
  try {
    const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import User model
    const User = require('./models/User');
    
    // Delete all users
    const result = await User.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} users`);
    
    console.log('✅ Database cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

clearDatabase();
