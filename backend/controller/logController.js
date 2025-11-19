const User = require('../models/User');
const { analyzeADHDGame } = require('../services/adhdAnalysisService');

// Save raw game logs under the user's document. Supports guestId or userId.
exports.saveGameLogs = async (req, res) => {
  try {
    console.log('========================================');
    console.log('[POST /api/logs] STARTING REQUEST');
    console.log('========================================');
    console.log('[POST /api/logs] Request body keys:', Object.keys(req.body));
    console.log('[POST /api/logs] Full body (truncated):', JSON.stringify(req.body).slice(0, 3000));
    
    const { gameKey, logs, guestId, userId, sessionId, checkOnly, start, end } = req.body;
    
    console.log('[POST /api/logs] Parsed values:');
    console.log('  - gameKey:', gameKey);
    console.log('  - logs type:', Array.isArray(logs) ? `array[${logs.length}]` : typeof logs);
    console.log('  - guestId:', guestId);
    console.log('  - userId:', userId);
    console.log('  - sessionId:', sessionId);
    console.log('  - checkOnly:', checkOnly);
    console.log('  - start:', start);
    console.log('  - end:', end);

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
    console.log('[POST /api/logs] Starting log normalization...');
    console.log('[POST /api/logs] Raw logs:', typeof logs, Array.isArray(logs) ? `array[${logs.length}]` : logs);
    
    try {
      // If client sent logs as a JSON string, try parsing it
      let parsedLogs = logs;
      if (typeof parsedLogs === 'string') {
        console.log('[POST /api/logs] Logs is a string, attempting to parse...');
        try {
          parsedLogs = JSON.parse(parsedLogs);
          console.log('[POST /api/logs] Successfully parsed logs string');
        } catch (e) {
          console.log('[POST /api/logs] Failed to parse logs string:', e.message);
          // leave as string — will be ignored by filters below
        }
      }

      console.log('[POST /api/logs] After parsing - parsedLogs type:', typeof parsedLogs, Array.isArray(parsedLogs) ? `array[${parsedLogs.length}]` : '');

      // MAZE: Save ONLY level 1, SKIP level 2
      if (gameKey === 'maze') {
        console.log(`[POST /api/logs] 🎯 MAZE FILTER: ONLY LEVEL 1, REJECT LEVEL 2`);
        if (Array.isArray(parsedLogs)) {
          console.log(`[POST /api/logs] Raw array has ${parsedLogs.length} entries`);
          parsedLogs.forEach((entry, idx) => {
            console.log(`[POST /api/logs]   Entry ${idx}: level=${entry?.level}, moves=${entry?.moves}, collisions=${entry?.wallCollisions}`);
          });
          
          // Filter: ONLY level 1
          filteredLogs = parsedLogs.filter(l => {
            if (!l || typeof l !== 'object') return false;
            const lvl = l.level;
            const isLevel1 = (lvl === 1 || lvl === '1' || Number(lvl) === 1);
            const isLevel2 = (lvl === 2 || lvl === '2' || Number(lvl) === 2);
            console.log(`[POST /api/logs]   🔍 Checking: level=${lvl}, isLevel1=${isLevel1}, isLevel2=${isLevel2}, ACCEPT=${isLevel1}`);
            return isLevel1; // ONLY accept level 1
          });
          
          console.log(`[POST /api/logs] ✅ Filtered ${filteredLogs.length} level 1 entries from ${parsedLogs.length} total`);
          if (filteredLogs.length > 0) {
            console.log(`[POST /api/logs] ✅ Level 1 sample:`, JSON.stringify(filteredLogs[0]).slice(0, 500));
          } else {
            console.log(`[POST /api/logs] ❌ NO LEVEL 1 ENTRIES FOUND!`);
          }
        } else if (parsedLogs && typeof parsedLogs === 'object') {
          const lvl = parsedLogs.level;
          if (lvl === 1 || lvl === '1' || Number(lvl) === 1) {
            filteredLogs = [parsedLogs];
            console.log('[POST /api/logs] ✅ Wrapped single level 1 object');
          } else {
            console.log('[POST /api/logs] ❌ Skipping - not level 1, level is:', lvl);
          }
        }
      } else {
        // For ADHD and other games, accept all
        console.log(`[POST /api/logs] ⚠️ ${gameKey || 'unknown'}: ACCEPTING ALL DATA`);
        if (Array.isArray(parsedLogs)) {
          filteredLogs = parsedLogs.filter(l => l && typeof l === 'object');
          console.log(`[POST /api/logs] Accepted ${filteredLogs.length} entries`);
        } else if (parsedLogs && typeof parsedLogs === 'object') {
          filteredLogs = [parsedLogs];
        }
      }
    } catch (e) {
      console.error('[POST /api/logs] Error during log normalization:', e.message);
      filteredLogs = [];
    }
    
    console.log('[POST /api/logs] Final filteredLogs count:', filteredLogs.length);
    if (filteredLogs.length > 0) {
      console.log('[POST /api/logs] Sample first log entry:', JSON.stringify(filteredLogs[0]).slice(0, 1000));
    }

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
    console.log(`[saveGameLogs] Prepared ${enriched.length} enriched entries for user ${user._id} gameKey=${gameKey}`);
    
    // Log structure of first enriched entry
    if (enriched.length > 0) {
      console.log('[saveGameLogs] First enriched entry keys:', Object.keys(enriched[0]));
      console.log('[saveGameLogs] First enriched entry sample:', JSON.stringify(enriched[0]).slice(0, 1500));
    }

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
            // If Mario final click (or forceEnd), mark session end as well AND set user.game = "end"
            if (gameKey === 'mario' || req.body.forceEnd === true || req.body.forceEnd === 'true') {
              sess.isEnd = true; 
              sess.endTimeUTC = sess.endTimeUTC || new Date(); 
              sess.endTimeIST = sess.endTimeIST || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
              // Set user.game = "end" when Mario final click happens
              doc.game = 'end';
              
              // === AUTO-ANALYZE ADHD GAME ===
              console.log('[saveGameLogs] 🎯 All 3 games completed! Starting ADHD analysis (end-only path)...');
              try {
                // Find the ADHD game in this session
                const sessionIndex = doc.sessions.findIndex(s => s.sessionNumber === currentSession.sessionNumber);
                const adhdGameIndex = sess.games.findIndex(g => g.type && g.type.toLowerCase() === 'adhd');
                
                if (sessionIndex >= 0 && adhdGameIndex >= 0) {
                  console.log(`[saveGameLogs] Found ADHD game at session ${sessionIndex}, game ${adhdGameIndex}`);
                  
                  // Analyze the ADHD game
                  const analysisMetrics = await analyzeADHDGame(doc, sessionIndex, adhdGameIndex);
                  
                  if (analysisMetrics) {
                    // Save the analysis metrics to the game
                    sess.games[adhdGameIndex].analysisMetrics = analysisMetrics;
                    doc.markModified(`sessions.${sessionIndex}.games`);
                    console.log('[saveGameLogs] ✅ ADHD analysis metrics saved successfully!');
                  } else {
                    console.log('[saveGameLogs] ⚠️ ADHD analysis returned no metrics');
                  }
                } else {
                  console.log(`[saveGameLogs] ⚠️ ADHD game not found in session (sessionIdx=${sessionIndex}, gameIdx=${adhdGameIndex})`);
                }
              } catch (analysisError) {
                console.error('[saveGameLogs] ❌ Error during ADHD analysis:', analysisError.message);
                // Don't fail the entire request if analysis fails
              }
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
      console.log('[saveGameLogs] Starting append process...');
      console.log('[saveGameLogs] dayNumber:', dayNumber);
      console.log('[saveGameLogs] enriched.length:', enriched.length);

      if (enriched.length > 0) {
        console.log('[saveGameLogs] Loading fresh user document...');
        // Load the fresh document once and modify it in-memory
        const doc = await User.findById(user._id);
        if (!doc) throw new Error('User not found during append');
        
        console.log('[saveGameLogs] User document loaded. Sessions count:', (doc.sessions || []).length);
        
        doc.sessions = doc.sessions || [];
        const sess = doc.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
        if (!sess) throw new Error('Session not found in user document');
        
        console.log('[saveGameLogs] Session found:', sess.sessionNumber);
        console.log('[saveGameLogs] Session games before append:', (sess.games || []).length);
        
        sess.games = sess.games || [];

        // Log current state of games before processing
        console.log('[saveGameLogs] ========================================');
        console.log('[saveGameLogs] CURRENT STATE BEFORE PROCESSING:');
        console.log('[saveGameLogs] sess.games.length:', sess.games.length);
        sess.games.forEach((g, idx) => {
          console.log(`[saveGameLogs]   Game ${idx}: type=${g.type}, day=${g.day}, logs=${g.logs?.length || 0}, end=${g.end}`);
        });
        console.log('[saveGameLogs] ========================================');

        // Log a truncated sample of the first entry to help diagnose missing fields
        try {
          if (enriched.length > 0) {
            console.log('[saveGameLogs] ========================================');
            console.log('[saveGameLogs] ABOUT TO APPEND', enriched.length, 'ENTRIES');
            console.log('[saveGameLogs] ========================================');
            enriched.forEach((entry, idx) => {
              console.log(`[saveGameLogs] Entry ${idx}: level=${entry.level}, moves=${entry.moves}, collisions=${entry.wallCollisions}`);
            });
            console.log('[saveGameLogs] Sample enriched[0] keys:', Object.keys(enriched[0]));
            console.log('[saveGameLogs] Sample enriched[0] (truncated):', JSON.stringify(enriched[0]).slice(0,2000));
          }
        } catch (e) { /* ignore logging errors */ }

        for (const entry of enriched) {
          const entryLevel = entry.level || 'unknown';
          const entryMoves = entry.moves || 0;
          console.log(`[saveGameLogs] ========================================`);
          console.log(`[saveGameLogs] Processing entry ${enriched.indexOf(entry) + 1}/${enriched.length}`);
          console.log(`[saveGameLogs] Entry level: ${entryLevel}, moves: ${entryMoves}`);
          console.log(`[saveGameLogs] gameKey: ${gameKey}, day: ${dayNumber}`);
          console.log(`[saveGameLogs] ========================================`);
          
          // Find game entry for this type/day that isn't ended
          // CRITICAL FIX: Don't use .slice().reverse() - it creates a copy!
          // Find from the end of the array directly
          let game = null;
          for (let i = sess.games.length - 1; i >= 0; i--) {
            const g = sess.games[i];
            if (g.type === gameKey && g.day === dayNumber && !g.end) {
              game = g;
              break;
            }
          }
          
          if (!game) {
            console.log('[saveGameLogs] No existing game found, creating new one');
            // Create the game subdocument properly using Mongoose's create method
            const newGame = sess.games.create({ 
              type: gameKey, 
              day: dayNumber, 
              startTime: null, 
              start: false, 
              logs: [], 
              endTime: null, 
              end: false 
            });
            sess.games.push(newGame);
            game = newGame;
            console.log('[saveGameLogs] Created new game subdocument, sess.games.length now:', sess.games.length);
          } else {
            console.log('[saveGameLogs] Found existing game with', (game.logs || []).length, 'logs');
          }
          if (!game.start) {
            game.start = true; game.startTime = game.startTime || new Date();
            console.log('[saveGameLogs] Marked game as started');
          }
          if (!Array.isArray(game.logs)) game.logs = [];
          
          console.log('[saveGameLogs] BEFORE push: game.logs.length =', game.logs.length);
          console.log('[saveGameLogs] Appending entry to game.logs. Entry keys:', Object.keys(entry));
          // Use Mongoose's push method to ensure tracking
          game.logs.push(entry);
          console.log('[saveGameLogs] AFTER push: game.logs.length =', game.logs.length);
        }

        // If client indicated end event, set end flags on the game and session
        const endFlag = (end === true || end === 'true' || end === 1 || end === '1');
        console.log('[saveGameLogs] End flag:', endFlag);
        if (endFlag) {
          const lastGame = sess.games.slice().reverse().find(g => g.type === gameKey && g.day === dayNumber);
          if (lastGame) {
            lastGame.end = true;
            lastGame.endTime = lastGame.endTime || new Date();
            console.log('[saveGameLogs] Marked game as ended');
          }
          // If Mario final click (or forceEnd), mark session end as well AND set user.game = "end"
          if (gameKey === 'mario' || req.body.forceEnd === true || req.body.forceEnd === 'true') {
            sess.isEnd = true; 
            sess.endTimeUTC = sess.endTimeUTC || new Date(); 
            sess.endTimeIST = sess.endTimeIST || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
            // Set user.game = "end" when Mario final click happens
            doc.game = 'end';
            console.log('[saveGameLogs] Marked session as ended and set user.game = "end"');
            
            // === AUTO-ANALYZE ADHD GAME ===
            console.log('[saveGameLogs] 🎯 All 3 games completed! Starting ADHD analysis...');
            try {
              // Find the ADHD game in this session
              const sessionIndex = doc.sessions.findIndex(s => s.sessionNumber === currentSession.sessionNumber);
              const adhdGameIndex = sess.games.findIndex(g => g.type && g.type.toLowerCase() === 'adhd');
              
              if (sessionIndex >= 0 && adhdGameIndex >= 0) {
                console.log('[saveGameLogs] Found ADHD game at session ${sessionIndex}, game ${adhdGameIndex}');
                
                // Analyze the ADHD game
                const analysisMetrics = await analyzeADHDGame(doc, sessionIndex, adhdGameIndex);
                
                if (analysisMetrics) {
                  // Save the analysis metrics to the game
                  sess.games[adhdGameIndex].analysisMetrics = analysisMetrics;
                  doc.markModified(`sessions.${sessionIndex}.games`);
                  console.log('[saveGameLogs] ✅ ADHD analysis metrics saved successfully!');
                } else {
                  console.log('[saveGameLogs] ⚠️ ADHD analysis returned no metrics');
                }
              } else {
                console.log('[saveGameLogs] ⚠️ ADHD game not found in session (sessionIdx=${sessionIndex}, gameIdx=${adhdGameIndex})');
              }
            } catch (analysisError) {
              console.error('[saveGameLogs] ❌ Error during ADHD analysis:', analysisError.message);
              // Don't fail the entire request if analysis fails
            }
          }
        }

        console.log('[saveGameLogs] Marking document as modified and saving...');
        // CRITICAL: Mark the specific session and games array as modified for Mongoose to detect changes
        if (typeof doc.markModified === 'function') {
          doc.markModified('sessions');
          // Also mark the specific session path to ensure nested changes are detected
          const sessionIndex = doc.sessions.findIndex(s => s.sessionNumber === currentSession.sessionNumber);
          if (sessionIndex >= 0) {
            doc.markModified(`sessions.${sessionIndex}.games`);
          }
        }
        await doc.save();
        console.log('[saveGameLogs] Document saved successfully');

        // Log post-save snapshot for the affected game so we can compare what
        // was intended to be saved (enriched[0]) vs what actually persisted.
        try {
          console.log('[saveGameLogs] Verifying saved data...');
          const savedSess = (doc.sessions || []).find(s => s.sessionNumber === currentSession.sessionNumber) || doc.sessions[doc.sessions.length - 1];
          if (savedSess && Array.isArray(savedSess.games)) {
            const savedGame = savedSess.games.slice().reverse().find(g => g.type === gameKey && g.day === dayNumber) || null;
            if (savedGame) {
              console.log('[saveGameLogs] ✅ VERIFICATION: game.logs.length=', (savedGame.logs||[]).length);
              console.log('[saveGameLogs] ✅ VERIFICATION: Last 2 log entries:', JSON.stringify((savedGame.logs||[]).slice(-2)).slice(0,2000));
              
              // Extra verification: check if logs have expected fields
              if (savedGame.logs && savedGame.logs.length > 0) {
                const firstLog = savedGame.logs[0];
                console.log('[saveGameLogs] ✅ First log entry keys:', Object.keys(firstLog));
                console.log('[saveGameLogs] ✅ First log has level?', 'level' in firstLog);
                console.log('[saveGameLogs] ✅ First log has moves?', 'moves' in firstLog);
                console.log('[saveGameLogs] ✅ First log has errorLog?', 'errorLog' in firstLog);
              }
            } else {
              console.error('[saveGameLogs] ❌ VERIFICATION FAILED: Could not find saved game!');
            }
          }
        } catch (e) {
          console.error('[saveGameLogs] Error during verification:', e.message);
        }

        // Refresh local user and currentSession variables
        user = await User.findById(user._id);
        currentSession = user.sessions.find(s => s.sessionNumber === currentSession.sessionNumber) || currentSession;
        console.log('[saveGameLogs] User and session refreshed');
      }
    } catch (appendErr) {
      console.error('[saveGameLogs] ❌ CRITICAL ERROR during append:', appendErr && appendErr.message ? appendErr.message : appendErr);
      console.error('[saveGameLogs] Stack trace:', appendErr.stack);
    }

    // Return success with session info
    const fresh = await User.findById(user._id).lean();
    try {
      const sessCount = (fresh.sessions || []).length;
      const sess = (fresh.sessions || []).find(s => s.sessionNumber === currentSession.sessionNumber) || (fresh.sessions || [])[fresh.sessions.length - 1] || null;
      const gamesCount = sess && Array.isArray(sess.games) ? sess.games.map(g => ({ type: g.type, logs: (g.logs||[]).length })) : [];
      console.log(`[saveGameLogs] ✅ FINAL SUMMARY: user=${String(user._id)} sessions=${sessCount} currentSession=${currentSession.sessionNumber} gamesCounts=${JSON.stringify(gamesCount)}`);
      console.log('========================================');
      console.log('[POST /api/logs] REQUEST COMPLETE');
      console.log('========================================');
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

// ADMIN: Clear maze logs for a given user/session (dev-only, requires ADMIN_KEY header)
exports.adminClearMaze = async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) return res.status(403).json({ ok: false, message: 'Forbidden' });
    const { userId, sessionId, dayNumber = 1 } = req.body;
    if (!userId || !sessionId) return res.status(400).json({ ok: false, message: 'userId and sessionId required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const sess = (user.sessions || []).find(s => s.sessionId === sessionId || s.sessionNumber === sessionId || s.sessionNumber === Number(sessionId));
    if (!sess) return res.status(404).json({ ok: false, message: 'Session not found' });
    sess.games = sess.games || [];
    const idx = sess.games.findIndex(g => g.type === 'maze' && g.day === Number(dayNumber));
    if (idx === -1) return res.status(404).json({ ok: false, message: 'Maze game not found in session' });
    sess.games[idx].logs = [];
    sess.games[idx].start = false;
    sess.games[idx].startTime = null;
    sess.games[idx].end = false;
    sess.games[idx].endTime = null;
    if (typeof user.markModified === 'function') user.markModified('sessions');
    await user.save();
    return res.json({ ok: true, message: 'Maze logs cleared', userId: user._id.toString(), sessionId });
  } catch (err) {
    console.error('adminClearMaze error:', err);
    return res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
};

// ADMIN: Replace maze logs for a given user/session with provided logs (dev-only, requires ADMIN_KEY header)
exports.adminReplaceMaze = async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) return res.status(403).json({ ok: false, message: 'Forbidden' });
    const { userId, sessionId, dayNumber = 1, logs } = req.body;
    if (!userId || !sessionId) return res.status(400).json({ ok: false, message: 'userId and sessionId required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });
    const sess = (user.sessions || []).find(s => s.sessionId === sessionId || s.sessionNumber === sessionId || s.sessionNumber === Number(sessionId));
    if (!sess) return res.status(404).json({ ok: false, message: 'Session not found' });
    sess.games = sess.games || [];

    // Normalize incoming logs
    let parsedLogs = logs;
    if (typeof parsedLogs === 'string') {
      try { parsedLogs = JSON.parse(parsedLogs); } catch (e) { parsedLogs = []; }
    }
    const enrichEntry = (entry) => {
      const now = new Date();
      const base = { ...(entry || {}), sessionId: sessionId || null, createdAtUTC: now.toISOString(), createdAtIST: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) };
      try {
        if (base.errorLog && Array.isArray(base.errorLog)) {
          base.errorLog = base.errorLog.map(ev => { const t = ev && ev.time ? new Date(ev.time) : new Date(); return { ...(ev || {}), createdAtUTC: t.toISOString(), createdAtIST: t.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) }; });
        }
      } catch (e) {}
      return base;
    };

    const newLogs = Array.isArray(parsedLogs) ? parsedLogs.map(enrichEntry) : [];

    // Replace (or create) maze game entry
    let game = sess.games.slice().reverse().find(g => g.type === 'maze' && g.day === Number(dayNumber)) || null;
    if (!game) {
      game = { type: 'maze', day: Number(dayNumber), startTime: null, start: false, logs: [], endTime: null, end: false };
      sess.games.push(game);
    }
    game.logs = newLogs;
    if (newLogs.length > 0) { game.start = true; game.startTime = game.startTime || new Date(); }
    if (req.body.end === true || req.body.end === 'true') { game.end = true; game.endTime = game.endTime || new Date(); }

    if (typeof user.markModified === 'function') user.markModified('sessions');
    await user.save();
    return res.json({ ok: true, message: 'Maze logs replaced', userId: user._id.toString(), sessionId, logsSaved: (newLogs||[]).length });
  } catch (err) {
    console.error('adminReplaceMaze error:', err);
    return res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
};
