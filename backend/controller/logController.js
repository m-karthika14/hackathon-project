const User = require('../models/User');

// Save raw game logs under the user's document. Supports guestId or userId.
exports.saveGameLogs = async (req, res) => {
  try {
    // Quick debug log to inspect incoming requests when diagnosing 4xx/5xx
    console.log('[POST /api/logs] incoming body:', JSON.stringify(req.body).slice(0, 2000));
    const { gameKey, logs, guestId, userId, sessionId, checkOnly } = req.body;

    // If client is only checking availability, allow play (no limits enforced)
    if (checkOnly) {
      if (!userId && !guestId) return res.status(400).json({ ok: false, message: 'checkOnly requires userId or guestId' });
      return res.status(200).json({ ok: true, message: 'Allowed' });
    }

    // For actual saves, require gameKey and logs
    if (!gameKey || !logs) {
      return res.status(400).json({ message: 'gameKey and logs are required' });
    }

    let query = {};
    if (userId) query._id = userId;
    else if (guestId) query.guestId = guestId;
    else return res.status(400).json({ message: 'Either userId or guestId must be provided' });

    let user = await User.findOne(query);

    if (!user) {
      // Create a guest document if not found
      user = new User({
        guestId: guestId || undefined,
        createdAt: new Date(),
        games: {}
      });
    }

    if (!user.games) user.games = {};

  // Play-limit enforcement
    // Helper: scan all existing sessions for this user
    const allSessions = [];
    Object.keys(user.games || {}).forEach(k => {
      const g = user.games[k];
      if (g && Array.isArray(g.logs)) {
        g.logs.forEach(s => allSessions.push({ ...s, gameKey: k }));
      }
    });

    // If sessionId provided and we've already stored this session, allow idempotent save
    const hasSameSession = sessionId && allSessions.some(s => s.sessionId === sessionId);

    // Play limits disabled by request: guests and users may play unlimited times.

    // Filter incoming logs to level 1 only for specified games (frontend should also do this)
    let filteredLogs = logs;
    try {
      if (gameKey === 'maze') {
        filteredLogs = Array.isArray(logs) ? logs.filter(l => l && l.level === 1) : [];
      } else if (gameKey === 'adhd') {
        filteredLogs = Array.isArray(logs) ? logs.filter(l => l && l.level === 1) : [];
      }
    } catch (e) {
      filteredLogs = [];
    }

    // Ensure gameKey subfield exists and is an array of log entries
    const existing = user.games[gameKey] || { logs: [] };

    // Enrich each incoming log with sessionId and createdAt so we can later query/deduplicate
    const enriched = Array.isArray(filteredLogs) ? filteredLogs.map(l => ({ ...(l || {}), sessionId: sessionId || null, createdAt: new Date() })) : [];

    console.log(`[saveGameLogs] appending ${enriched.length} entries to user ${user._id} for gameKey=${gameKey}`);
    if (enriched.length > 0) console.log('[saveGameLogs] sample entry:', JSON.stringify(enriched[0]).slice(0, 1000));

  // Append enriched entries to existing logs array (preserve history)
  existing.logs = Array.isArray(existing.logs) ? [...existing.logs, ...enriched] : [...enriched];
  user.games[gameKey] = existing;
  // Because `games` is a Mixed type, Mongoose may not detect nested changes automatically.
  // Mark the path as modified so Mongoose will persist our updates.
  if (typeof user.markModified === 'function') user.markModified('games');

    try {
      await user.save();
      // Read back the saved document to verify persistence and help debugging
      try {
        const fresh = await User.findById(user._id).lean();
        console.log('[saveGameLogs] post-save games keys:', Object.keys(fresh.games || {}));
        const savedLogs = fresh.games && fresh.games[gameKey] && Array.isArray(fresh.games[gameKey].logs) ? fresh.games[gameKey].logs : [];
        console.log(`[saveGameLogs] saved ${savedLogs.length} total entries for gameKey=${gameKey} (user ${user._id})`);
        if (savedLogs.length > 0) console.log('[saveGameLogs] last entry sample:', JSON.stringify(savedLogs[savedLogs.length - 1]).slice(0, 1000));
      } catch (readErr) {
        console.error('Error reading back saved user for verification:', readErr);
      }

      return res.status(200).json({ ok: true, userId: user._id.toString(), guestId: user.guestId, sessionId: sessionId || null });
    } catch (saveErr) {
      console.error('Error saving user document:', saveErr);
      return res.status(500).json({ ok: false, message: 'Error saving logs', error: saveErr.message });
    }
  } catch (err) {
    console.error('Error saving game logs:', err);
    return res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
};

// Simple helper to fetch user's game logs (not requested but useful for testing)
exports.getUserGameLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ games: user.games || {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
