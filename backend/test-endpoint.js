// Simple test to verify backend is receiving requests
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/logs', (req, res) => {
  console.log('✅ POST /api/logs received!');
  console.log('Body keys:', Object.keys(req.body));
  console.log('gameKey:', req.body.gameKey);
  console.log('logs:', Array.isArray(req.body.logs) ? `array[${req.body.logs.length}]` : typeof req.body.logs);
  
  if (req.body.logs && Array.isArray(req.body.logs)) {
    req.body.logs.forEach((log, idx) => {
      console.log(`  Log ${idx}: level=${log.level}, moves=${log.moves}`);
    });
  }
  
  res.json({ ok: true, message: 'Test successful', logsReceived: req.body.logs?.length || 0 });
});

app.listen(5000, () => {
  console.log('Test server running on port 5000');
});
