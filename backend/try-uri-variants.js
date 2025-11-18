const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const raw = process.env.MONGO_URI;
if (!raw) {
  console.error('MONGO_URI not found in environment. Please set backend/.env');
  process.exit(2);
}

// Helper to mask password in logs
function maskUri(uri) {
  try {
    const u = new URL(uri.replace('mongodb+srv://', 'http://'));
    if (u.username) u.password = '*****';
    return 'mongodb+srv://' + (u.username ? `${u.username}:*****@` : '') + u.host + u.pathname + u.search;
  } catch (e) {
    return uri.replace(/:(.*)@/, ':*****@');
  }
}

// Parse original URI using URL by replacing scheme
let parsed;
try {
  parsed = new URL(raw.replace('mongodb+srv://', 'http://'));
} catch (e) {
  console.error('Failed to parse MONGO_URI; aborting variant checks.');
  console.error(e.message || e);
  process.exit(3);
}

const username = parsed.username;
const password = parsed.password;
const hostAndPath = parsed.host + parsed.pathname + parsed.search;

const variants = [];

// 1) original
variants.push({ name: 'original', uri: raw });

// 2) URL-encoded password
if (password) {
  const enc = encodeURIComponent(password);
  const encUri = `mongodb+srv://${username}:${enc}@${hostAndPath}`;
  variants.push({ name: 'encoded-password', uri: encUri });
}

// 3) add explicit /admin path if none
if (!parsed.pathname || parsed.pathname === '/') {
  const adminUri = `mongodb+srv://${username}:${password}@${parsed.host}/admin${parsed.search}`;
  variants.push({ name: 'add-/admin', uri: adminUri });
}

// 4) add authSource=admin
{
  const hasQuery = !!parsed.search;
  const sep = hasQuery ? '&' : '?';
  const authUri = `mongodb+srv://${username}:${password}@${parsed.host}${parsed.pathname}${parsed.search}${sep}authSource=admin`;
  variants.push({ name: 'add-authSource=admin', uri: authUri });
}

// 5) encoded password + authSource
if (password) {
  const enc = encodeURIComponent(password);
  const hasQuery = !!parsed.search;
  const sep = hasQuery ? '&' : '?';
  const comb = `mongodb+srv://${username}:${enc}@${parsed.host}${parsed.pathname}${parsed.search}${sep}authSource=admin`;
  variants.push({ name: 'encoded+authSource', uri: comb });
}

async function tryConnect(name, uri) {
  console.log('\nTrying variant:', name, '->', maskUri(uri));
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('  SUCCESS: Connected using variant:', name);
    await mongoose.disconnect();
    return { name, ok: true };
  } catch (err) {
    console.error('  ERROR:', err.name + ':', err.message);
    return { name, ok: false, err };
  }
}

(async () => {
  const results = [];
  for (const v of variants) {
    // small delay between tries
    // eslint-disable-next-line no-await-in-loop
    const r = await tryConnect(v.name, v.uri);
    results.push(r);
    // if success, break early
    if (r.ok) break;
  }

  console.log('\nSummary:');
  results.forEach(r => console.log(` - ${r.name}: ${r.ok ? 'OK' : 'FAIL'}`));
  // exit code 0 if any succeeded
  process.exit(results.some(r => r.ok) ? 0 : 1);
})();
