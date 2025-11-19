# FINAL TEST - Run This Now

## Quick Test Instructions

1. **Start backend** (if not running):
   ```powershell
   cd backend
   node server.js
   ```

2. **Start frontend** (if not running):
   ```powershell
   npm run dev
   ```

3. **Open browser**: http://localhost:5173

4. **Open Console** (F12) - **CRITICAL!**

5. **Play the game**:
   - Click "Start Assessment"
   - Complete Level 1
   - Complete Level 2

## What to Look For in Console

### Stage 1: Level 1 Complete
```
📊 Level 1 completed. Metrics: {...}
📊 All metrics before onGameComplete: {...}
⬆️ Moving to next level (2)
```
**Check:** Level 1 should show moves > 0

### Stage 2: Level 2 Complete  
```
📊 Level 2 completed. Metrics: {...}
📊 All metrics before onGameComplete: {...}
📊 Passing metrics.current to onGameComplete: ["1", "2"]
```
**Check:** Should see BOTH "1" and "2" in keys array

### Stage 3: handleGameComplete
```
📊 Full metrics keys: ["1", "2"]
📊 Level 1 metrics: {moves: 54, ...}
📊 Level 2 metrics: {moves: XX, ...}
📊 After deep copy - fullMetricsCopy keys: ["1", "2"]
```
**Check:** BOTH levels should be present with data

### Stage 4: Building Logs
```
🔍 Processing metrics for level 1: {...}
✅ Built log entry for level 1: {...}
🔍 Processing metrics for level 2: {...}
✅ Built log entry for level 2: {...}
📊 Final levelLogs array length: 2
```
**Check:** Should process BOTH levels

### Stage 5: POST
```
📤 Payload structure: { logsCount: 2, ... }
📥 Backend response status: 200
✅ Game 0: type=maze, logs=2
```
**Check:** `logsCount: 2` (not 1!)

## If Issue Persists

### Scenario A: Only Level 2 in metrics.current
**Console shows:**
```
📊 Passing metrics.current to onGameComplete: ["2"]
```

**Problem:** Level 1 data is being lost when transitioning to level 2

**Check:** Look for any error between level 1 completion and level 2 start

### Scenario B: Both Levels in metrics but only Level 2 sent
**Console shows:**
```
📊 Full metrics keys: ["1", "2"]
...
📊 Final levelLogs array length: 1
🔍 Processing metrics for level 2: {...}
```

**Problem:** Level 1 is filtered out or not iterated

**Check:** The `Object.keys(fullMetricsCopy)` iteration

### Scenario C: Both Sent but Backend Only Saves One
**Console shows:**
```
📤 Payload structure: { logsCount: 2, ... }
...
✅ Game 0: type=maze, logs=1
```

**Problem:** Backend is not saving level 1 log

**Check:** Backend terminal for filtering issues

## Success Criteria

✅ Level 1 metrics appear with moves > 0  
✅ Level 2 metrics appear with moves > 0  
✅ `Full metrics keys: ["1", "2"]`  
✅ `Final levelLogs array length: 2`  
✅ `logsCount: 2` in payload  
✅ `✅ Game 0: type=maze, logs=2` in response  

## Copy-Paste This to Check

After running the game, paste this in browser console:

```javascript
// Get the last saved data
const userId = localStorage.getItem('userId');
console.log('User ID:', userId);

// This will show you what's in localStorage
console.log('Session ID:', localStorage.getItem('gameSessionId'));
```

Then run the verification script:

```powershell
cd backend
node verify-maze-logs.js YOUR_USER_ID_HERE
```

Should show:
```
✅ Maze logs found: 2 entries
```

Not:
```
❌ Maze logs found: 1 entries
```

---

**RUN THE GAME NOW AND POST THE CONSOLE OUTPUT!**
