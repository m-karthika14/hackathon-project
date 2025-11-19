const User = require('../models/User');

// Save raw game logs under the user's document. Supports guestId or userId.
exports.saveGameLogs = async (req, res) => {
  try {
    console.log('[POST /api/logs] incoming body:', JSON.stringify(req.body).slice(0, 3000));
    const { gameKey, logs, guestId, userId, sessionId, checkOnly, start, end } = req.body;

    // Quick availability check
    if (checkOnly) {
      if (!userId && !guestId) return res.status(400).json({ ok: false, message: 'checkOnly requires userId or guestId' });
      return res.status(200).json({ ok: true, message: 'Allowed' });
    }

    // For actual saves (not a Start Assessment request), require gameKey and logs
    if (!start && !gameKey && !checkOnly) {
      return res.status(400).json({ message: 'gameKey is required for non-start requests' });
    }

    let query = {};
    if (userId) query._id = userId;
    else if (guestId) query.guestId = guestId;
    else return res.status(400).json({ message: 'Either userId or guestId must be provided' });

    let user = await User.findOne(query);
    if (!user) {
      // Create guest user with empty sessions
      user = new User({ guestId: guestId || undefined, createdAt: new Date(), sessions: [] });
      await user.save();
    }

    // Normalize incoming logs similar to previous behavior
    let filteredLogs = [];
    try {
      if (gameKey === 'maze') {
        if (Array.isArray(logs)) filteredLogs = logs.filter(l => l && (l.level === 1 || typeof l.level === 'undefined'));
        else if (logs && typeof logs === 'object') filteredLogs = [logs];
      } else if (gameKey === 'adhd') {
        filteredLogs = Array.isArray(logs) ? logs.filter(l => l && (l.level === 1 || typeof l.level === 'undefined')) : [];
      } else {
        if (Array.isArray(logs)) filteredLogs = logs; else if (logs && typeof logs === 'object') filteredLogs = [logs];
      }
    } catch (e) { filteredLogs = []; }

    const enrichEntry = (entry) => {
      const now = new Date();
      const base = { ...(entry || {}), sessionId: sessionId || null, createdAtUTC: now.toISOString(), createdAtIST: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) };
      // enrich nested errorLog if present
      try {
        if (base.errorLog && Array.isArray(base.errorLog)) {
          base.errorLog = base.errorLog.map(ev => { const t = ev && ev.time ? new Date(ev.time) : new Date(); return { ...(ev || {}), createdAtUTC: t.toISOString(), createdAtIST: t.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) }; });
        }
      } catch (e) { }
      return base;
    };

    const enriched = Array.isArray(filteredLogs) ? filteredLogs.map(enrichEntry) : [];
    console.log(`[saveGameLogs] prepared ${enriched.length} enriched entries for user ${user._id} gameKey=${gameKey}`);

    // If client indicated Start Assessment (home page), create a new session and mark start
    let currentSession = null;
    if (start === true) {
      const created = await User.createNewSession(user._id, { sessionId: sessionId || null, isStart: true });
      currentSession = created.session;
      user = created.user;
    }

    // If sessionId provided try to locate it, otherwise use active session or create new one
    if (!currentSession) {
      const findRes = await User.findOrCreateSession(user._id, { sessionId: sessionId || null, createIfMissing: true });
      user = findRes.user;
      currentSession = findRes.session;
    }

    // Append logs into the appropriate game object inside the session
    try {
      const dayNumber = (req.body.dayNumber || 1);
      for (const entry of enriched) {
        // Use model helper to append into a game entry
        if (gameKey === 'maze') {
          await User.appendMazeLog(user._id, dayNumber, currentSession.sessionNumber, entry);
        } else if (gameKey === 'adhd') {
          await User.appendAdhdLog(user._id, dayNumber, currentSession.sessionNumber, entry);
        } else {
          // generic: just push into a fallback game object
          const g = { type: gameKey, day: dayNumber, startTime: new Date(), start: true, logs: [entry], endTime: null, end: false };
          const doc = await User.findById(user._id);
          doc.sessions = doc.sessions || [];
          const sess = doc.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
          sess.games = sess.games || [];
          sess.games.push(g);
          if (typeof doc.markModified === 'function') doc.markModified('sessions');
          await doc.save();
        }
      }

      // If client indicated end event, finalize current game / session
      if (end === true) {
        // End the game in session using helper
        try {
          await User.endGameInSession(user._id, currentSession.sessionNumber, gameKey, dayNumber);
        } catch (e) {
          console.warn('endGameInSession failed:', e && e.message ? e.message : e);
        }

        // If ADHD final click, mark session end as well (per requirement)
        if (gameKey === 'adhd') {
          try {
            // Use the model helper to set session end time and flag consistently
            await User.endSessionGeneric(user._id, currentSession.sessionNumber);
          } catch (e) {
            console.warn('endSessionGeneric failed:', e && e.message ? e.message : e);
          }
        }
      }
    } catch (appendErr) {
      console.error('[saveGameLogs] append error:', appendErr && appendErr.message ? appendErr.message : appendErr);
    }

    // Return success with session info
    const fresh = await User.findById(user._id).lean();
    return res.status(200).json({ ok: true, userId: user._id.toString(), guestId: user.guestId, sessionNumber: currentSession.sessionNumber, sessionId: currentSession.sessionId || null, sessions: fresh.sessions || [] });
  } catch (err) {
    console.error('Error saving game logs:', err);
    return res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
};

// Simple helper to fetch user's game logs (not requested but useful for testing)
exports.getUserGameLogs = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ sessions: user.sessions || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
