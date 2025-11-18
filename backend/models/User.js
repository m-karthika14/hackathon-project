const mongoose = require('mongoose');

const { Schema } = mongoose;

// Unified user / guest schema. For guests, only guestId will be set.
const userSchema = new Schema({
  guestId: { type: String, index: true }, // e.g. "guest_1234"
  email: { type: String, lowercase: true, trim: true },
  passwordHash: { type: String },
  createdAt: { type: Date, default: () => new Date() },
  // Store per-game raw logs under games.<gameKey>.logs
  games: { type: Schema.Types.Mixed, default: {} },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
