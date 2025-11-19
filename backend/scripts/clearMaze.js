#!/usr/bin/env node
// Usage: ADMIN_KEY=secret node clearMaze.js <userId> <sessionId> [dayNumber]
const fetch = global.fetch || require('node-fetch');
const [,, userId, sessionId, dayNumber='1'] = process.argv;
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) { console.error('Please set ADMIN_KEY env var'); process.exit(1); }
if (!userId || !sessionId) { console.error('Usage: ADMIN_KEY=secret node clearMaze.js <userId> <sessionId> [dayNumber]'); process.exit(1); }
(async ()=>{
  try {
    const res = await fetch('http://localhost:5000/api/logs/admin/clear-maze', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ userId, sessionId, dayNumber })
    });
    const j = await res.json();
    console.log('Response:', res.status, j);
  } catch (e) { console.error('Error:', e); process.exit(1); }
})();
