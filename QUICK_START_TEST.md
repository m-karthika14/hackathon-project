# Quick Start - Testing Maze Logs Fix

## 1. Start Backend
```powershell
cd backend
node server.js
```

Expected output:
```
MongoDB connected
Server running on port 5000
```

## 2. Start Frontend (New Terminal)
```powershell
npm run dev
```

Expected output:
```
VITE ready
Local: http://localhost:5173/
```

## 3. Play the Game

1. Open browser: `http://localhost:5173`
2. Open Developer Console (F12) - **Keep this open!**
3. Click "Start Assessment"
4. Play through **both maze levels**
5. Watch the console output

## 4. What to Look For

### In Browser Console:
```
📤 Sending raw maze logs to /api/logs
📤 Payload structure: { gameKey: "maze", logsCount: 2, ... }
📥 Backend response status: 200
✅ Raw maze logs saved successfully!
✅ Game 0: type=maze, logs=2
```

### In Backend Terminal:
```
========================================
[POST /api/logs] STARTING REQUEST
========================================
[POST /api/logs] Parsed values:
  - gameKey: maze
  - logs type: array[2]
[POST /api/logs] Final filteredLogs count: 2
[saveGameLogs] Game now has 2 logs
[saveGameLogs] ✅ VERIFICATION: game.logs.length= 2
========================================
```

## 5. Verify in Database

### Get Your User ID
From browser console:
```javascript
localStorage.getItem('userId')
// or
localStorage.getItem('guestId')
```

### Run Verification Script
```powershell
cd backend
node verify-maze-logs.js YOUR_USER_ID_HERE
```

Expected output:
```
✅ Connected to MongoDB
✅ User found
📊 Total sessions: 1

Session 1:
  Games in session: 1
  
  Game 1:
    Type: maze
    Logs: 2
    ✅ Maze logs found: 2 entries
    First log entry:
      Level: 1
      Moves: 42
      Wall Collisions: 3
    ✅ All expected fields present

========================================
SUMMARY
========================================
Total Maze Games Found: 1
Total Maze Log Entries: 2

✅ MAZE LOGS ARE WORKING!
```

## If It Doesn't Work

### Problem: logsCount: 0 in browser
**Cause:** Gameplay metrics not collected  
**Fix:** Check event handlers are working during gameplay

### Problem: Backend shows "logs type: undefined"
**Cause:** Payload not reaching backend  
**Fix:** Check network tab for errors

### Problem: Verification shows 0 logs
**Cause:** Database save issue  
**Fix:** Check backend logs for errors during save

## Full Debugging

If issues persist, see: **`MAZE_LOGS_DEBUG_GUIDE.md`**

## Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Browser console open
- [ ] Played through both maze levels
- [ ] Browser shows: `✅ Game 0: type=maze, logs=2`
- [ ] Backend shows: `✅ VERIFICATION: game.logs.length= 2`
- [ ] Verification script shows: `✅ MAZE LOGS ARE WORKING!`
- [ ] MongoDB contains maze logs with all expected fields

## Quick MongoDB Check

Using MongoDB Compass:
1. Connect to `mongodb://localhost:27017`
2. Open `hackathon` database
3. Open `users` collection
4. Find your user document
5. Expand: `sessions` → `games` → `logs`
6. Verify logs array has entries

Done! 🎉
