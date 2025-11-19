const mongoose = require('mongoose');
const { Schema } = mongoose;

// Single game entry schema (stored inside session.games[])
const GameSchema = new Schema({
  type: { type: String, enum: ['maze', 'adhd'], required: true },
  day: { type: Number, default: 1 },
  startTime: { type: Date, default: null },
  start: { type: Boolean, default: false },
  logs: { type: [Schema.Types.Mixed], default: [] },
  endTime: { type: Date, default: null },
  end: { type: Boolean, default: false }
}, { _id: false, strict: true });

// Session schema: games is an array of GameSchema
const SessionSchema = new Schema({
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

// Top-level user schema
const userSchema = new Schema({
  guestId: { type: String, index: true, sparse: true },
  email: { type: String, lowercase: true, trim: true, index: true, sparse: true },
  passwordHash: { type: String },
  createdAt: { type: Date, default: () => new Date() },
  sessions: { type: [SessionSchema], default: [] }
}, { strict: true });

// Utility: format IST string
function istStringFor(date) {
  if (!date) return null;
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
}

/**
 * Create a new top-level session for the user.
 * sessionNumber = existing sessions length + 1
 * If opts.isStart is true, populate startTime fields immediately.
 */
userSchema.statics.createNewSession = async function (userId, opts = {}) {
  const User = this;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (!Array.isArray(user.sessions)) user.sessions = [];

  const now = new Date();
  const sessionNumber = (user.sessions.length || 0) + 1;
  const session = {
    sessionNumber,
    sessionId: opts.sessionId || null,
    startTimeUTC: opts.isStart ? now : (opts.startTimeUTC || null),
    startTimeIST: opts.isStart ? istStringFor(now) : (opts.startTimeIST || null),
    isStart: !!opts.isStart,
    games: [],
    endTimeUTC: null,
    endTimeIST: null,
    isEnd: false
  };

  user.sessions.push(session);
  if (typeof user.markModified === 'function') user.markModified('sessions');
  await user.save();
  return { user, session };
};

/**
 * Find session by sessionId/sessionNumber, or most recent active session.
 * If createIfMissing is true, create a new session.
 */
userSchema.statics.findOrCreateSession = async function (userId, { sessionId = null, sessionNumber = null, createIfMissing = true, isStart = false } = {}) {
  const User = this;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (!Array.isArray(user.sessions)) user.sessions = [];

  let session = null;
  if (sessionId) session = user.sessions.find(s => s.sessionId === sessionId);
  if (!session && (sessionNumber !== null && sessionNumber !== undefined)) session = user.sessions.find(s => s.sessionNumber === sessionNumber);
  if (!session) {
    // pick last active (not ended)
    session = (user.sessions || []).slice().reverse().find(s => !s.isEnd) || null;
  }

  if (!session && createIfMissing) {
    const now = new Date();
    const sn = (user.sessions.length || 0) + 1;
    session = {
      sessionNumber: sn,
      sessionId: sessionId || null,
      startTimeUTC: isStart ? now : null,
      startTimeIST: isStart ? istStringFor(now) : null,
      isStart: !!isStart,
      games: [],
      endTimeUTC: null,
      endTimeIST: null,
      isEnd: false
    };
    user.sessions.push(session);
    if (typeof user.markModified === 'function') user.markModified('sessions');
    await user.save();
  }

  return { user, session };
};

// Convenience wrappers for maze / adhd
userSchema.statics.appendMazeLog = async function (userId, dayNumber = 1, sessionNumber = null, logObj = {}) {
  return this.appendGameLog(userId, 'maze', dayNumber, sessionNumber, logObj);
};

userSchema.statics.appendAdhdLog = async function (userId, dayNumber = 1, sessionNumber = null, logObj = {}) {
  return this.appendGameLog(userId, 'adhd', dayNumber, sessionNumber, logObj);
};

/**
 * Append a log entry into a specific game inside a session. If sessionNumber is null,
 * it will try to find an active session or create one.
 * Behavior:
 *  - If no game entry exists for (type, day) create it.
 *  - If game.start is false, set startTime and start=true on first appended log.
 */
userSchema.statics.appendGameLog = async function (userId, gameType, dayNumber = 1, sessionNumber = null, logObj = {}) {
  const res = await this.findOrCreateSession(userId, { sessionNumber, createIfMissing: true });
  const { user, session } = res;

  session.games = session.games || [];

  // Find game entry of same type & day that isn't ended
  let game = session.games.slice().reverse().find(g => g.type === gameType && g.day === dayNumber && !g.end) || null;
  if (!game) {
    game = { type: gameType, day: dayNumber, startTime: null, start: false, logs: [], endTime: null, end: false };
    session.games.push(game);
  }

  // Start on first interaction
  if (!game.start) {
    const now = new Date();
    game.startTime = now;
    game.start = true;
  }

  game.logs = Array.isArray(game.logs) ? game.logs.concat([logObj]) : [logObj];

  if (typeof user.markModified === 'function') user.markModified('sessions');
  await user.save();
  return { ok: true, userId: user._id.toString(), gameType, day: dayNumber, session: session.sessionNumber };
};

/**
 * Start session helper (called when "Start Assessment" clicked on home page)
 * Creates session if missing and marks isStart and start times.
 */
userSchema.statics.startSessionGeneric = async function (userId, sessionNumber = null) {
  const res = await this.findOrCreateSession(userId, { sessionNumber, createIfMissing: true, isStart: true });
  const { user, session } = res;
  const now = new Date();
  session.startTimeUTC = now;
  session.startTimeIST = istStringFor(now);
  session.isStart = true;
  if (typeof user.markModified === 'function') user.markModified('sessions');
  await user.save();
  return { ok: true, startTimeUTC: now.toISOString(), userId: user._id.toString(), session: session.sessionNumber };
};

/**
 * End session helper (called when final ADHD 2-back last click happens)
 */
userSchema.statics.endSessionGeneric = async function (userId, sessionNumber = null) {
  const res = await this.findOrCreateSession(userId, { sessionNumber, createIfMissing: false });
  const { user, session } = res;
  if (!session) throw new Error('No session found to end');
  const now = new Date();
  session.endTimeUTC = now;
  session.endTimeIST = istStringFor(now);
  session.isEnd = true;
  if (typeof user.markModified === 'function') user.markModified('sessions');
  await user.save();
  return { ok: true, endTimeUTC: now.toISOString(), userId: user._id.toString(), session: session.sessionNumber };
};

/**
 * End a specific game inside a session
 */
userSchema.statics.endGameInSession = async function (userId, sessionNumber, gameType, dayNumber = 1) {
  const User = this;
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const sess = (user.sessions || []).find(s => s.sessionNumber === sessionNumber);
  if (!sess) throw new Error('Session not found');
  if (!Array.isArray(sess.games)) return { ok: false, message: 'No games for session' };
  const g = sess.games.slice().reverse().find(entry => entry.type === gameType && entry.day === dayNumber && !entry.end);
  if (g) { g.end = true; g.endTime = new Date(); }
  if (typeof user.markModified === 'function') user.markModified('sessions');
  await user.save();
  return { ok: true };
};

// Ensure schema is strict
userSchema.set('strict', true);

const User = mongoose.model('User', userSchema);

module.exports = User;
