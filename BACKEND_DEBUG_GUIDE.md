# Backend Debug - Finding Where Level 1 Disappears

## What We Know

**Frontend is correct:**
- Sends 2 log entries: level 1 (30 moves) and level 2 (0 moves)
- Payload shows: `📊 Final levelLogs array length: 2`

**Backend is wrong:**
- Only saves level 2 (0 moves)
- Response shows: `"logs": [{"level":2, ...}]` (only 1 entry)

## Expected Backend Console Output

### When Request Arrives:
```
[POST /api/logs] STARTING REQUEST
[POST /api/logs] Parsed values:
  - gameKey: maze
  - logs type: array[2]     ← Should be 2!
[POST /api/logs] Final filteredLogs count: 2   ← Should be 2!
[saveGameLogs] Prepared 2 enriched entries     ← Should be 2!
```

### When Appending Logs:
```
[saveGameLogs] ========================================
[saveGameLogs] ABOUT TO APPEND 2 ENTRIES      ← Should be 2!
[saveGameLogs] ========================================
[saveGameLogs] Entry 0: level=1, moves=30, collisions=24  ← Level 1 data!
[saveGameLogs] Entry 1: level=2, moves=0, collisions=0    ← Level 2 data!
```

### For EACH Entry (Should See This TWICE):
```
========================================
Processing entry 1/2
Entry level: 1, moves: 30               ← First iteration: Level 1
========================================
Found existing game with 0 logs         ← OR "No existing game found"
BEFORE push: game.logs.length = 0
AFTER push: game.logs.length = 1       ← Should increment!

========================================
Processing entry 2/2
Entry level: 2, moves: 0                ← Second iteration: Level 2
========================================
Found existing game with 1 logs         ← Should find game with 1 log!
BEFORE push: game.logs.length = 1
AFTER push: game.logs.length = 2       ← Should be 2 total!
```

### After Save:
```
[saveGameLogs] ✅ VERIFICATION: game.logs.length= 2   ← Should be 2!
[saveGameLogs] ✅ First log entry keys: [...]
[saveGameLogs] ✅ First log has level? true
```

## Possible Issues to Watch For

### Issue 1: Only 1 Entry in enriched
**Symptom:**
```
[saveGameLogs] Prepared 1 enriched entries
[saveGameLogs] Entry 0: level=2, moves=0
```
**Cause:** Filtering is removing level 1  
**Location:** Before enrichment, in normalization

### Issue 2: Loop Runs Twice but Logs Disappear
**Symptom:**
```
Processing entry 1/2 ... AFTER push: game.logs.length = 1
Processing entry 2/2 ... AFTER push: game.logs.length = 1  ← Still 1!
```
**Cause:** Each iteration finds/creates a NEW game object  
**Problem:** Not reusing the same game object reference

### Issue 3: Logs Pushed but Not Saved
**Symptom:**
```
AFTER push: game.logs.length = 2
[saveGameLogs] ✅ VERIFICATION: game.logs.length= 1  ← Different!
```
**Cause:** Mongoose isn't detecting changes to nested arrays  
**Solution:** Need `markModified('sessions')`

### Issue 4: Multiple Game Objects Created
**Symptom:**
```
Processing entry 1/2 ... Created new game, sess.games.length now: 1
Processing entry 2/2 ... Created new game, sess.games.length now: 2
```
**Cause:** Each entry creates a separate game instead of appending to same one  
**Problem:** Logic finds game incorrectly or game isn't properly added to sess

## What to Check in Console

1. ✅ `Prepared 2 enriched entries` (not 1)
2. ✅ Loop runs TWICE (entry 1/2, then 2/2)
3. ✅ Both entries show correct level and moves
4. ✅ Second iteration finds existing game (not creates new)
5. ✅ `AFTER push` shows incrementing count (1, then 2)
6. ✅ Verification shows `game.logs.length= 2`

## Test Command

Restart backend:
```powershell
cd backend
node server.js
```

Play game and watch backend terminal for the logging above.

## Expected Success

Both in backend console AND in response:
```
✅ VERIFICATION: game.logs.length= 2
```

Response body:
```json
"logs": [
  {"level": 1, "moves": 30, ...},
  {"level": 2, "moves": 0, ...}
]
```
