# Debugging Empty Maze Logs - Issue Found

## Current Problem

Only **level 2 data with 0 moves** is being saved. Level 1 data (54 moves, 50 collisions) is missing.

## What to Check

Run the game again and look for these console logs:

### 1. When Level 1 Completes:
```
📊 Level 1 completed. Metrics: {...}
📊 All metrics before onGameComplete: {...}
```
**Check:** Does this show level 1 data with moves and collisions?

### 2. When Level 2 Completes (Final):
```
📊 Level 2 completed. Metrics: {...}
📊 All metrics before onGameComplete: {...}
📊 Passing metrics.current to onGameComplete: [keys]
```
**Check:** Does `metrics.current` contain BOTH level 1 AND level 2?

### 3. In handleGameComplete:
```
📊 Full metrics keys: [...]
📊 Level 1 metrics: {...}
📊 Level 2 metrics: {...}
```
**Check:** Are BOTH levels present?

### 4. When Building Logs:
```
📤 Payload structure: { logsCount: 2, ... }
```
**Check:** Should be `logsCount: 2`, not `logsCount: 1`

## Suspected Causes

### Theory 1: metrics.current is overwritten between levels
When moving from level 1 to level 2, `startLevel()` might be reinitializing `metrics.current`.

**Check in `startLevel` function:**
```typescript
metrics.current[currentLevel] = { ... }
```
This should ADD to metrics, not REPLACE the entire object.

### Theory 2: Only current level metrics are passed
When `onGameComplete` is called, only the current level (2) metrics might be in the object.

**Solution:** Verify `metrics.current` is a persistent ref that accumulates data.

### Theory 3: Race condition or async issue
The transition to ADHD game happens immediately, potentially clearing metrics before they're saved.

## Quick Test

Add this before the `onGameComplete` call:
```typescript
console.log('🔍 CRITICAL: metrics.current contents:', JSON.stringify(metrics.current, null, 2));
```

Look for:
```json
{
  "1": {
    "moves": 54,
    "wallCollisions": 50,
    ...
  },
  "2": {
    "moves": XX,
    "wallCollisions": XX,
    ...
  }
}
```

If only level 2 appears, the problem is in how metrics are stored between levels.

## Next Steps

1. Run game with new logging
2. Check if `metrics.current` has both levels before `onGameComplete`
3. If not, check `startLevel()` function for initialization issues
4. If yes, check if data is lost during deep copy in `handleGameComplete`

## Expected vs Actual

**Expected:**
- `logsCount: 2` (one for each level)
- Both logs have moves > 0

**Actual:**
- `logsCount: 1` (only level 2)
- Level 2 has moves: 0

This suggests level 1 data never makes it to the POST payload.
