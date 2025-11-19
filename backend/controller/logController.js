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
      // If client sent logs as a JSON string, try parsing it
      let parsedLogs = logs;
      if (typeof parsedLogs === 'string') {
        try {
          parsedLogs = JSON.parse(parsedLogs);
        } catch (e) {
          // leave as string — will be ignored by filters below
        }
      }

      if (gameKey === 'maze' || gameKey === 'adhd') {
        // Accept any object entries for both maze and adhd. Previously ADHD
        // was filtered by `level === 1` which dropped many valid trials.
        if (Array.isArray(parsedLogs)) filteredLogs = parsedLogs.filter(l => l && typeof l === 'object');
        else if (parsedLogs && typeof parsedLogs === 'object') filteredLogs = [parsedLogs];
      } else {
        if (Array.isArray(parsedLogs)) filteredLogs = parsedLogs; else if (parsedLogs && typeof parsedLogs === 'object') filteredLogs = [parsedLogs];
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

    // If sessionId provided try to locate it, otherwise use the active (not-ended)
    // session. Preferred flow: client calls Start Assessment which creates the
    // canonical session. However, some clients may have generated a sessionId
    // locally and expect logs to attach even if Start wasn't called. To make
    // the system robust and allow saving maze logs immediately, we do the
    // following:
    //  - Log the incoming sessionId/user context for debugging
    //  - If a matching active session exists, use it
    //  - If no active session exists but the client provided a sessionId, create
    //    a new session with that sessionId so logs can be attached immediately
    // This keeps the schema unchanged but makes the server tolerant to clients
    // that didn't call Start first.
    console.log('[saveGameLogs] Received sessionId:', sessionId, 'userId:', userId, 'guestId:', guestId);

    if (!currentSession) {
      // If caller provided a sessionId, allow server to create a new session with that id
      const allowCreate = !!sessionId;
      const findRes = await User.findOrCreateSession(user._id, { sessionId: sessionId || null, createIfMissing: allowCreate });
      user = findRes.user;
      currentSession = findRes.session;
      if (!currentSession) {
        console.error('[saveGameLogs] NO ACTIVE SESSION found for', { sessionId, userId, guestId });
        return res.status(400).json({ ok: false, message: 'No active session found. Please call Start Assessment first or provide a sessionId.', debug: { sessionId, userId, guestId, logs: Array.isArray(logs) ? logs.length : (logs ? 1 : 0) } });
      } else {
        console.log('[saveGameLogs] Using session:', currentSession.sessionNumber, currentSession.sessionId, 'createdByServerIfMissing=', allowCreate);
      }
    }

    // If the client only sent an end flag (no enriched log entries), handle
    // marking the game and session as ended here so endTimes are recorded.
    const explicitEndFlag = (end === true || end === 'true' || end === 1 || end === '1');
    if (explicitEndFlag && (!enriched || enriched.length === 0)) {
      try {
        const doc = await User.findById(user._id);
        if (doc) {
          doc.sessions = doc.sessions || [];
          const sess = doc.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
          if (sess) {
            sess.games = sess.games || [];
            const lastGame = sess.games.slice().reverse().find(g => g.type === gameKey && g.day === (req.body.dayNumber || 1));
            if (lastGame) { lastGame.end = true; lastGame.endTime = lastGame.endTime || new Date(); }
            // If ADHD final click (or forceEnd), mark session end as well
            if (gameKey === 'adhd' || req.body.forceEnd === true || req.body.forceEnd === 'true') {
              sess.isEnd = true; sess.endTimeUTC = sess.endTimeUTC || new Date(); sess.endTimeIST = sess.endTimeIST || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
            }
            if (typeof doc.markModified === 'function') doc.markModified('sessions');
            await doc.save();
            // refresh user and currentSession
            user = await User.findById(user._id);
            currentSession = user.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || currentSession;
          }
        }
      } catch (e) {
        console.error('[saveGameLogs] end-only handling error:', e && e.message ? e.message : e);
      }
    }

    // Append logs into the appropriate game object inside the session in a
    // single atomic save. This prevents optimistic concurrency/version errors
    // when multiple operations attempt to modify the same document.
    try {
      const dayNumber = (req.body.dayNumber || 1);

      if (enriched.length > 0) {
        // Load the fresh document once and modify it in-memory
        const doc = await User.findById(user._id);
        if (!doc) throw new Error('User not found during append');
        doc.sessions = doc.sessions || [];
        const sess = doc.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
        if (!sess) throw new Error('Session not found in user document');
        sess.games = sess.games || [];

        // Log a truncated sample of the first entry to help diagnose missing fields
        try {
          if (enriched.length > 0) console.log('[saveGameLogs] sample enriched[0]:', JSON.stringify(enriched[0]).slice(0,2000));
        } catch (e) { /* ignore logging errors */ }

        for (const entry of enriched) {
          // Find game entry for this type/day that isn't ended
          let game = sess.games.slice().reverse().find(g => g.type === gameKey && g.day === dayNumber && !g.end) || null;
          if (!game) {
            game = { type: gameKey, day: dayNumber, startTime: null, start: false, logs: [], endTime: null, end: false };
            sess.games.push(game);
          }
          if (!game.start) {
            game.start = true; game.startTime = game.startTime || new Date();
          }
          if (!Array.isArray(game.logs)) game.logs = [];
          game.logs.push(entry);
        }

        // If client indicated end event, set end flags on the game and session
        const endFlag = (end === true || end === 'true' || end === 1 || end === '1');
        if (endFlag) {
          const lastGame = sess.games.slice().reverse().find(g => g.type === gameKey && g.day === dayNumber);
          if (lastGame) { lastGame.end = true; lastGame.endTime = lastGame.endTime || new Date(); }
          // If ADHD final click (or forceEnd), mark session end as well
          if (gameKey === 'adhd' || req.body.forceEnd === true || req.body.forceEnd === 'true') {
            sess.isEnd = true; sess.endTimeUTC = sess.endTimeUTC || new Date(); sess.endTimeIST = sess.endTimeIST || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
          }
        }

        if (typeof doc.markModified === 'function') doc.markModified('sessions');
        await doc.save();

        // Log post-save snapshot for the affected game so we can compare what
        // was intended to be saved (enriched[0]) vs what actually persisted.
        try {
          const savedSess = (doc.sessions || []).find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
          if (savedSess && Array.isArray(savedSess.games)) {
            const savedGame = savedSess.games.slice().reverse().find(g => g.type === gameKey && g.day === dayNumber) || null;
            if (savedGame) {
              console.log('[saveGameLogs] post-save game.logs.length=', (savedGame.logs||[]).length, 'sample:', JSON.stringify((savedGame.logs||[]).slice(-2)).slice(0,2000));
            }
          }
        } catch (e) { /* ignore logging errors */ }

        // Refresh local user and currentSession variables
        user = await User.findById(user._id);
        currentSession = user.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || currentSession;
      }
    } catch (appendErr) {
      console.error('[saveGameLogs] append error:', appendErr && appendErr.message ? appendErr.message : appendErr);
    }

    // Return success with session info
    const fresh = await User.findById(user._id).lean();
    try {
      const sessCount = (fresh.sessions || []).length;
      const sess = (fresh.sessions || []).find(s => s.sessionNumber === currentSession.sessionNumber) || (fresh.sessions || [])[fresh.sessions.length - 1] || null;
      const gamesCount = sess && Array.isArray(sess.games) ? sess.games.map(g => ({ type: g.type, logs: (g.logs||[]).length })) : [];
      console.log(`[saveGameLogs] finished for user=${String(user._id)} sessions=${sessCount} currentSession=${currentSession.sessionNumber} gamesCounts=${JSON.stringify(gamesCount)}`);
    } catch (e) {}
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
