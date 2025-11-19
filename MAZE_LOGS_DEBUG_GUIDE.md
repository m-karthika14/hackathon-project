# Maze Game Logs Debugging Guide

## Problem Summary
Maze game logs appear in console but are not being saved to MongoDB database.

## Changes Made

### 1. Frontend Logging (NeuroBalanceMaze.tsx)
Added comprehensive logging to track:
- Payload structure before sending
- Log count and type verification
- Backend response status and body
- Session and game information in response

### 2. Backend Logging (logController.js)
Added detailed logging at every step:
- Request receipt and body parsing
- Log normalization process
- Session and game finding/creation
- Each log entry append operation
- Post-save verification
- Final summary with counts

## How to Debug

### Step 1: Start Backend Server
```powershell
cd backend
node server.js
```

### Step 2: Start Frontend
```powershell
npm run dev
```

### Step 3: Play Through Maze Game
1. Open browser console (F12)
2. Navigate to the game
3. Click "Start Assessment"
4. Play through both maze levels
5. Complete the game

### Step 4: Check Console Logs

#### In Browser Console, Look For:
```
📤 Sending raw maze logs to /api/logs
📤 Payload structure: { gameKey, sessionId, logsCount, ... }
📤 First log entry sample: {...}
📥 Backend response status: 200
✅ Raw maze logs saved successfully!
✅ Sessions in response: N
✅ Game 0: type=maze, logs=N
```

#### In Backend Terminal, Look For:
```
========================================
[POST /api/logs] STARTING REQUEST
========================================
[POST /api/logs] Parsed values:
  - gameKey: maze
  - logs type: array[2]
  - sessionId: maze_xxxxx
[POST /api/logs] Final filteredLogs count: 2
[saveGameLogs] Processing entry for gameKey: maze day: 1
[saveGameLogs] Game now has 1 logs
[saveGameLogs] Document saved successfully
[saveGameLogs] ✅ VERIFICATION: game.logs.length= 2
[saveGameLogs] ✅ First log entry keys: [level, startTime, moves, ...]
========================================
[POST /api/logs] REQUEST COMPLETE
========================================
```

## Common Issues and Solutions

### Issue 1: Logs Array is Empty in Frontend
**Symptom:** `logsCount: 0` in browser console  
**Solution:** 
- Check that `metrics.current` is being populated during gameplay
- Verify `errorLog.current` is tracking collisions/events
- Ensure `diagnostics` object has `moveTimestamps` and `idleSegments`

**Where to Check:**
```typescript
// In NeuroBalanceMaze.tsx, look for these console logs:
console.log('Metrics before POST:', JSON.stringify(metrics.current));
console.log('ErrorLog before POST:', JSON.stringify(errorLog.current));
```

### Issue 2: Backend Not Receiving Logs
**Symptom:** Backend shows `logs type: undefined` or `array[0]`  
**Solution:**
- Verify frontend is calling the correct endpoint
- Check network tab in browser dev tools
- Ensure request body contains `logs` array

### Issue 3: Logs Not Persisting in Database
**Symptom:** Verification shows `game.logs.length= 0` after save  
**Solution:**
- Check if `filteredLogs` is empty after normalization
- Verify `enriched` array has entries
- Look for errors during the append loop

**Debug Points:**
```javascript
[POST /api/logs] Final filteredLogs count: X  // Should be > 0
[saveGameLogs] Prepared X enriched entries     // Should match above
[saveGameLogs] Game now has X logs            // Should increment
[saveGameLogs] ✅ VERIFICATION: game.logs.length= X  // Should be > 0
```

### Issue 4: Session Not Found
**Symptom:** `No active session found` error  
**Solution:**
- Ensure "Start Assessment" was clicked before playing
- Check that `localStorage.getItem('gameSessionId')` exists
- Verify sessionId is being passed to backend

## Verification Queries

### Check MongoDB Directly
```javascript
// In MongoDB Shell or Compass
db.users.findOne(
  { _id: ObjectId("YOUR_USER_ID") },
  { 
    "sessions.games.logs": 1,
    "sessions.sessionNumber": 1,
    "sessions.games.type": 1
  }
)
```

### Expected Structure:
```json
{
  "_id": "...",
  "sessions": [
    {
      "sessionNumber": 1,
      "games": [
        {
          "type": "maze",
          "logs": [
            {
              "level": 1,
              "moves": 42,
              "wallCollisions": 3,
              "errorLog": [...],
              "moveTimestamps": [...],
              ...
            },
            {
              "level": 2,
              ...
            }
          ]
        }
      ]
    }
  ]
}
```

## Next Steps

1. **Run the game** and collect all console logs from both browser and backend
2. **If logs are empty in frontend:** Add logging in event handlers (handleKeyDown, etc.)
3. **If logs reach backend but aren't saved:** Check the verification output
4. **If verification passes but DB is empty:** Check MongoDB connection and write permissions

## Testing Script

Save this as `test-maze-logs.js` and run with `node test-maze-logs.js`:

```javascript
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function testMazeLogs() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hackathon', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const userId = 'YOUR_USER_ID'; // Replace with actual user ID
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('Total sessions:', user.sessions.length);
    
    user.sessions.forEach((session, idx) => {
      console.log(`\nSession ${idx + 1}:`);
      console.log('  Session Number:', session.sessionNumber);
      console.log('  Session ID:', session.sessionId);
      console.log('  Games:', session.games.length);
      
      session.games.forEach((game, gameIdx) => {
        console.log(`    Game ${gameIdx + 1}:`);
        console.log('      Type:', game.type);
        console.log('      Day:', game.day);
        console.log('      Logs:', game.logs ? game.logs.length : 0);
        
        if (game.logs && game.logs.length > 0) {
          console.log('      First log keys:', Object.keys(game.logs[0]));
          console.log('      First log sample:', JSON.stringify(game.logs[0]).slice(0, 200));
        }
      });
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

testMazeLogs();
```

## Success Criteria

✅ Browser console shows: `✅ Game 0: type=maze, logs=2` (or more)  
✅ Backend console shows: `✅ VERIFICATION: game.logs.length= 2` (or more)  
✅ MongoDB query returns non-empty `logs` array for maze game  
✅ Each log entry has expected fields: `level`, `moves`, `errorLog`, `moveTimestamps`, etc.

## Contact/Support

If logs still don't appear after following this guide:
1. Capture ALL console output from both browser and backend
2. Run the MongoDB verification query
3. Check if other games (ADHD) are saving logs correctly
4. Verify MongoDB connection string and write permissions
