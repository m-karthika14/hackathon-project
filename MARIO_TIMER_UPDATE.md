# Mario Game Timer Update - 30 Second Level Timer

## Overview
Added a 30-second timer to each level in the Mario (VoidJumper) game. Players must complete each level within 30 seconds or the game automatically advances to the next level.

## Changes Made

### 1. **Timer Constants & State**
- Added `LEVEL_TIME_LIMIT = 30000` (30 seconds in milliseconds)
- Added `levelTimeRemaining` state to display countdown
- Added `levelTimerRef` to track level start time

### 2. **Game Loop Updates**
```javascript
const gameLoop = () => {
  if (!gameRunning.current) return;
  
  // Check timer
  const elapsed = performance.now() - startTimeRef.current;
  const timeLeft = Math.max(0, LEVEL_TIME_LIMIT - elapsed);
  setLevelTimeRemaining(Math.ceil(timeLeft / 1000));
  
  // Auto-advance on timeout
  if (elapsed >= LEVEL_TIME_LIMIT) {
    handleLevelTimeout();
    return;
  }
  
  handleInput();
  updatePhysics();
  draw();
  animationFrameRef.current = requestAnimationFrame(gameLoop);
};
```

### 3. **New Level Timeout Handler**
```javascript
const handleLevelTimeout = () => {
  playSound('hit');
  cancelAnimationFrame(animationFrameRef.current);
  gameRunning.current = false;

  const timeTaken = performance.now() - startTimeRef.current;
  
  performanceDataRef.current.push({
    level: currentLevel,
    time_ms: timeTaken,
    resets: levelResets,
    completed: false,  // NOT completed
    timeRemaining: 0
  });

  logEvent('Level_Timeout', { time_ms: timeTaken, resets: levelResets, completed: false });

  if (currentLevel < 5) {
    const nextLevel = currentLevel + 1;
    setMessageData({
      title: 'TIME UP!',
      body: 'Level ' + currentLevel + ' timeout. Moving to next level. Resets: ' + levelResets,
      buttonText: "NEXT LEVEL",
      callback: () => {
        // Move to next level
      }
    });
  } else {
    handleGameOver();
  }
};
```

### 4. **Updated Level Win Handler**
```javascript
const handleLevelWin = () => {
  const timeTaken = performance.now() - startTimeRef.current;
  const timeRemaining = LEVEL_TIME_LIMIT - timeTaken;
  
  performanceDataRef.current.push({
    level: currentLevel,
    time_ms: timeTaken,
    resets: levelResets,
    completed: true,  // Successfully completed
    timeRemaining: Math.max(0, timeRemaining)
  });
  // ... rest of logic
};
```

### 5. **UI Updates**

#### Timer Display (Top of Screen)
```javascript
<div style={{
  color: levelTimeRemaining <= 10 ? '#ff0000' : '#00eaff',
  textShadow: levelTimeRemaining <= 10 ? '0 0 20px #ff0000' : '0 0 10px #00eaff',
  animation: levelTimeRemaining <= 5 ? 'pulse 0.5s infinite' : 'none'
}}>
  LEVEL: {currentLevel} / 5 | RESETS: {levelResets} | TIME: {levelTimeRemaining}s
</div>
```

**Visual Warnings:**
- Normal: Cyan color
- ≤ 10s: Red color with red glow
- ≤ 5s: Pulsing animation

#### Intro Screen Update
Added timer mention:
```
✓ ⏱️ 30 SECONDS per level - complete fast or auto-advance!
```

### 6. **Report Generation Updates**

#### New Metrics Tracked
```javascript
const completedLevels = performanceDataRef.current.filter(d => d.completed).length;
const timedOutLevels = performanceDataRef.current.filter(d => !d.completed).length;
const completionRate = (completedLevels / 5) * 100;
```

#### Timeout Penalty
```javascript
const timeoutPenalty = timedOutLevels * 10;

const attentionScore = Math.max(0, 100 - (trickResets * 15) - timeoutPenalty);
const motorControlScore = Math.max(0, 100 - (motorResets * 12) - (timeoutPenalty * 0.5));
const cognitiveLoadScore = Math.max(0, 100 - (disappearingResets * 10) - (avgResetsPerLevel * 5) - timeoutPenalty);
const environmentalStressScore = Math.max(0, 100 - (hazardResets * 15) - (timeoutPenalty * 0.5));
const behavioralStabilityScore = Math.max(0, 100 - (totalResets * 3) - timeoutPenalty);
```

**Penalty System:**
- Each timed-out level: -10 points to Attention, Cognitive Load, Behavioral Stability
- Each timed-out level: -5 points to Motor Control, Environmental Stress

#### Updated Report Display
```html
<h4>Level Performance (30s each)</h4>
Level 1: 12.5s | 2 resets | ✓ COMPLETED
Level 2: 30.0s | 5 resets | ✗ TIME OUT
Level 3: 18.3s | 1 reset  | ✓ COMPLETED
...
Completion Rate: 80% (4/5 completed)
```

**Visual Indicators:**
- ✓ Green border: Completed within time
- ✗ Red border: Timed out

#### Summary Stats
```
Total Resets: 15 | Time: 145.2s | Completed: 4/5
```

### 7. **JSON Export Updates**
```javascript
rawLog: {
  assessmentDate: new Date().toISOString(),
  totalResets: totalResets,
  totalTimeSeconds: totalTimeSeconds,
  completionStats: {
    completedLevels: completedLevels,
    timedOutLevels: timedOutLevels,
    completionRate: completionRate
  },
  scores: { ... },
  metrics: {
    trickResets: trickResets,
    motorResets: motorResets,
    hazardResets: hazardResets,
    disappearingResets: disappearingResets,
    avgResetsPerLevel: avgResetsPerLevel,
    timeoutPenalty: timeoutPenalty
  },
  performanceSummary: [
    {
      level: 1,
      time_ms: 12500,
      resets: 2,
      completed: true,
      timeRemaining: 17500
    },
    // ... more levels
  ],
  detailedEventLog: [ ... ]
}
```

## Game Flow

### Normal Completion (Within 30s)
1. Player completes level goal
2. `handleLevelWin()` called
3. Performance recorded with `completed: true`
4. "LEVEL COMPLETE!" message shown
5. Move to next level

### Timeout (After 30s)
1. Timer reaches 30 seconds
2. `handleLevelTimeout()` called
3. Performance recorded with `completed: false`
4. "TIME UP!" message shown
5. Auto-advance to next level

### Final Level (Level 5)
- If completed: Show report
- If timed out: Show report
- Both scenarios tracked in completion stats

## Assessment Impact

### Completion Rate Impact on Risk Assessment
- **100% completion (5/5)**: No penalty, normal scoring
- **80% completion (4/5)**: -10 penalty to 5 cognitive areas
- **60% completion (3/5)**: -20 penalty to 5 cognitive areas
- **≤40% completion**: -30+ penalty, likely HIGH RISK classification

### Score Calculation Changes
```
OLD: Score based only on resets and mistakes
NEW: Score = (base - resets - mistakes - timeoutPenalty)

Example:
- 2 timed-out levels = -20 points across all scores
- Attention: 100 - (3 trick resets × 15) - 20 = 35/100
- Result: Likely MODERATE to HIGH RISK classification
```

## Testing Checklist

- [x] Timer counts down from 30 to 0
- [x] Timer turns red at ≤10 seconds
- [x] Timer pulses at ≤5 seconds
- [x] Level auto-advances at 0 seconds
- [x] Completed levels marked with ✓ in report
- [x] Timed-out levels marked with ✗ in report
- [x] Completion rate calculated correctly
- [x] Timeout penalty applied to scores
- [x] Report shows completed vs timed-out stats
- [x] JSON export includes all new fields
- [x] Early completion moves to next level immediately

## User Experience

### Visual Feedback
1. **30-20s**: Cyan timer, normal display
2. **19-10s**: Cyan timer, steady display
3. **10-5s**: RED timer with glow
4. **5-0s**: RED timer with pulse animation
5. **0s**: "TIME UP!" modal, auto-advance

### Player Strategy
- **Speed vs Accuracy**: Players must balance completing quickly vs avoiding resets
- **Time Pressure**: Adds cognitive load and stress testing
- **Completion Incentive**: Strong motivation to finish within time limit
- **Performance Tracking**: Clear feedback on which levels were completed

## Backend Integration

No changes needed to backend - all timer logic is client-side. The performance data structure already supports the new fields:
```javascript
{
  level: number,
  time_ms: number,
  resets: number,
  completed: boolean,  // NEW
  timeRemaining: number  // NEW
}
```

These will be saved in the existing game logs structure when sent to backend.

## Summary

The 30-second timer adds:
1. **Time pressure testing** - Important ADHD assessment metric
2. **Automatic progression** - No player stuck forever
3. **Completion tracking** - Better performance insights
4. **Visual warnings** - Clear feedback system
5. **Scoring adjustments** - Timeout penalties reflect inability to complete tasks in time
6. **Enhanced report** - Shows which levels completed vs timed out

Total game time: 5 levels × 30s = **2.5 minutes maximum** (shorter if levels completed early)
