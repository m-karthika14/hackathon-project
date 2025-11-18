const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('MONGO_URI not found in environment. Please set backend/.env or export MONGO_URI');
  process.exit(2);
}

console.log('Attempting to connect to MongoDB...');

(async () => {
  try {
    // short timeout to fail fast for diagnostics
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB successfully (check-mongo)');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\nFailed to connect to MongoDB (check-mongo). Detailed error:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    if (err.reason) console.error('Error reason:', err.reason);
    if (err.stack) console.error('Stack:', err.stack);
    // Some drivers embed inner errors
    if (err.cause) console.error('Cause:', err.cause);
    process.exit(1);
  }
})();
