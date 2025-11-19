# Game Sequence Update - Mario Game Integration

## Changes Made

### 1. Frontend: GameSequence.tsx
**File**: `src/components/games/GameSequence.tsx`

#### Changes:
- **Added Mario game import**: `import MarioGame from './mario';`
- **Updated game state type**: Changed from `'maze' | 'adhd'` to `'maze' | 'adhd' | 'mario'`
- **Updated ADHD completion handler**: Now transitions to Mario instead of report
- **Added Mario completion handler**: Navigates to report after Mario completes
- **Added Mario game component**: Renders `<MarioGame onGameComplete={handleMarioComplete} />`

#### Game Flow:
```
Maze → ADHD → Mario → Report
```

### 2. Frontend: mario.tsx
**File**: `src/components/games/mario.tsx`

#### Changes:
- **Added interface**: `MarioGameProps` with `onGameComplete?: () => void`
- **Updated component signature**: `const VoidJumper: React.FC<MarioGameProps> = ({ onGameComplete }) => {`
- **Added backend session end call**: In `handleGameOver` callback, sends end signal to backend
  ```typescript
  await fetch('http://localhost:5000/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      end: true,
      gameKey: 'mario',
      sessionId,
      userId,
      guestId
    })
  });
  ```
- **Call onGameComplete**: Triggers navigation to report after backend call

### 3. Backend: logController.js
**File**: `backend/controller/logController.js`

#### Changes (2 locations):

**Location 1 (Lines ~193-198)**:
- Changed condition from `gameKey === 'adhd'` to `gameKey === 'mario'`
- Session now ends when Mario game completes instead of ADHD
- Sets `sess.isEnd = true`, `sess.endTimeUTC`, `sess.endTimeIST`
- Sets `doc.game = 'end'` when Mario completes

**Location 2 (Lines ~324-329)**:
- Changed condition from `gameKey === 'adhd'` to `gameKey === 'mario'`
- Same session end logic for log append flow

#### Session Management:
```javascript
if (gameKey === 'mario' || req.body.forceEnd === true || req.body.forceEnd === 'true') {
  sess.isEnd = true; 
  sess.endTimeUTC = sess.endTimeUTC || new Date(); 
  sess.endTimeIST = sess.endTimeIST || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
  doc.game = 'end';
  console.log('[saveGameLogs] Marked session as ended and set user.game = "end"');
}
```

## Database State Management

### User Schema Fields Updated:
1. **`user.game`**: 
   - `null` → User not started
   - `'start'` → User started assessment (Maze begins)
   - `'end'` → User completed assessment (Mario ends)

2. **`session.isStart`**: 
   - `true` when session begins (Maze starts)
   - `false` by default

3. **`session.isEnd`**: 
   - `true` when Mario completes
   - `false` during gameplay

4. **`session.endTimeUTC`**: Set when Mario ends
5. **`session.endTimeIST`**: Set when Mario ends (IST timezone)

## Complete Flow

### Game Sequence:
1. **User starts** → Maze game begins
2. **Maze completes** → Transitions to ADHD game
3. **ADHD completes** → Transitions to Mario game
4. **Mario completes** → 
   - Sends end signal to backend (`gameKey: 'mario', end: true`)
   - Backend sets `session.isEnd = true`, `user.game = 'end'`
   - Frontend navigates to `/report`

### Backend Session Tracking:
- **Session Start**: Created when Maze begins (handled in existing code)
- **Game Progress**: Maze → ADHD → Mario (all logged under same session)
- **Session End**: Marked complete when Mario sends end signal

## Testing Checklist

- [x] Backend server restarted with changes
- [x] GameSequence imports Mario component
- [x] Mario game accepts onGameComplete prop
- [x] Mario sends backend end signal
- [x] Backend marks session complete on Mario end
- [x] Frontend navigates to report after Mario

## Notes

- **NO OTHER FILES MODIFIED**: Only GameSequence.tsx, mario.tsx, and logController.js were changed
- **Existing functionality preserved**: Maze and ADHD games continue to work as before
- **Session integrity maintained**: All three games share the same sessionId from localStorage
- **Report shows after Mario**: User sees report page after completing all three games

## Deployment

Backend is running on port 5000 with the updated logic. Frontend will compile with the new game sequence when `npm run dev` is executed.
