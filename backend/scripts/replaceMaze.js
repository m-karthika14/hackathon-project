#!/usr/bin/env node
// Usage: ADMIN_KEY=secret node replaceMaze.js <userId> <sessionId> <logsFile.json> [--end]
// logsFile.json should contain an array of level entries (same shape the frontend posts under `logs`).
const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');

const argv = process.argv.slice(2);
const ADMIN_KEY = process.env.ADMIN_KEY;
if (!ADMIN_KEY) { console.error('Please set ADMIN_KEY env var'); process.exit(1); }
if (argv.length < 3) { console.error('Usage: ADMIN_KEY=secret node replaceMaze.js <userId> <sessionId> <logsFile.json> [--end]'); process.exit(1); }
const [userId, sessionId, logsFile, maybeEnd] = argv;
const endFlag = maybeEnd === '--end';
const abs = path.resolve(process.cwd(), logsFile);
if (!fs.existsSync(abs)) { console.error('logs file not found:', abs); process.exit(1); }
let parsed;
try { parsed = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { console.error('Failed to parse logs file:', e); process.exit(1); }
(async ()=>{
  try {
    const res = await fetch('http://localhost:5000/api/logs/admin/replace-maze', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ userId, sessionId, logs: parsed, end: endFlag })
    });
    const j = await res.json();
    console.log('Response:', res.status, j);
  } catch (e) { console.error('Error:', e); process.exit(1); }
})();
