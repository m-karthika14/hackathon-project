import React, { useState, useEffect, useRef } from 'react';

// --- Global Configs & Constants ---
const GRAVITY = 0.5;
const JUMP_VELOCITY = -12;
const MOVE_SPEED = 5;
const STAR_COUNT = 150;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const LEVEL_TIME_LIMIT = 30000; // 30 seconds per level

// Centralized Level Configuration
const INITIAL_LEVEL_CONFIG = {
  1: {
    start: {x: 50, y: 300},
    platforms: [
      { id: 'p1', x: 0, y: 380, w: CANVAS_WIDTH, h: 20, visual: true, active: true }
    ],
    goal: { x: 700, y: 340, w: 50, h: 40 },
    hazards: [],
    invisiblePit: { x: 250, y: 380, w: 150, h: 20 },
    trick: 'invisible_pit',
    hint: 'Welcome! Jump across safely. Watch for invisible traps in the floor!'
  },
  2: {
    start: {x: 50, y: 300},
    platforms: [
      { id: 'p1', x: 0, y: 380, w: 200, h: 20, visual: true, active: true },
      { id: 'p2', x: 300, y: 300, w: 120, h: 20, visual: true, active: true },
      { id: 'p3', x: 520, y: 240, w: 120, h: 20, visual: true, active: true },
      { id: 'p4', x: 680, y: 350, w: 120, h: 20, visual: true, active: true }
    ],
    goal: { x: 710, y: 310, w: 50, h: 40, type: 'real' },
    hazards: [
      { x: 330, y: 260, w: 50, h: 40, type: 'fake_goal' },
      { x: 540, y: 200, w: 50, h: 40, type: 'fake_goal' }
    ],
    trick: 'fake_goal_hazard',
    hint: 'Watch out! TWO fake yellow goals and ONE real cyan goal. Choose wisely!'
  },
  3: {
    start: {x: 50, y: 200},
    platforms: [
      { id: 'p1', x: 0, y: 380, w: 200, h: 20, visual: true, active: true },
      { id: 'p2', x: 280, y: 280, w: 120, h: 20, type: 'disappearing', visual: true, active: true },
      { id: 'p3', x: 500, y: 200, w: 150, h: 20, visual: true, active: true },
      { id: 'p4', x: 700, y: 300, w: 100, h: 20, visual: true, active: true }
    ],
    goal: { x: 730, y: 260, w: 40, h: 40 },
    hazards: [],
    trick: 'disappearing_platform',
    hint: 'Middle platform VANISHES after 1 second! Move FAST or fall!'
  },
  4: {
    start: {x: 50, y: 200},
    platforms: [
      { id: 'p1', x: 0, y: 380, w: 150, h: 20, visual: true, active: true },
      { id: 'p2', x: 200, y: 300, w: 100, h: 20, type: 'moving', initialX: 200, visual: true, active: true },
      { id: 'p3', x: 350, y: 220, w: 100, h: 20, visual: true, active: true },
      { id: 'p4', x: 500, y: 300, w: 100, h: 20, visual: true, active: true },
      { id: 'p5', x: 650, y: 380, w: 150, h: 20, visual: true, active: true }
    ],
    goal: { x: 730, y: 340, w: 50, h: 40 },
    hazards: [],
    appearingHazard: { x: 375, y: 200, w: 50, h: 20 },
    trick: 'moving_platform_appearing_hazard',
    hint: 'Moving platform! RED spikes appear when you move. Time it right!'
  },
  5: {
    start: {x: 50, y: 300},
    platforms: [
      { id: 'p1', x: 0, y: 380, w: 300, h: 20, visual: true, active: true },
      { id: 'p2', x: 400, y: 260, w: 180, h: 20, visual: true, active: true },
      { id: 'p3', x: 650, y: 350, w: 150, h: 20, visual: true, active: true }
    ],
    goal: { x: 440, y: 220, w: 50, h: 40, type: 'delayed_flip', isReal: true },
    fakeGoal: { x: 680, y: 310, w: 50, h: 40, isReal: false },
    hazards: [],
    trick: 'goal_flip_delayed',
    hint: 'FINAL LEVEL! Goals switch every 3s. Stand STILL on CYAN goal for 1.5s!'
  }
};

interface MarioGameProps {
  onGameComplete?: () => void;
}

const VoidJumper: React.FC<MarioGameProps> = ({ onGameComplete }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('intro');
  const [countdown, setCountdown] = useState(3);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelResets, setLevelResets] = useState(0);
  const [totalResets, setTotalResets] = useState(0);
  const [messageData, setMessageData] = useState(null);
  const [reportHTML, setReportHTML] = useState('');
  const [floatingFeedback, setFloatingFeedback] = useState(null);
  const [dynamicLevelConfig, setDynamicLevelConfig] = useState(INITIAL_LEVEL_CONFIG[1]);
  const [levelTimeRemaining, setLevelTimeRemaining] = useState(30);

  const gameRunning = useRef(false);
  const playerRef = useRef({
    x: 50, y: 300, width: 40, height: 40,
    vx: 0, vy: 0, grounded: false
  });
  const keysRef = useRef({});
  const moveLogRef = useRef([]);
  const performanceDataRef = useRef([]);
  const startTimeRef = useRef(0);
  const lastInputRef = useRef('None');
  const winWaitTimeRef = useRef(0);
  const groundWarningVisibleRef = useRef(false);
  const starsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const disappearingPlatformTimerRef = useRef(0);
  const appearingHazardRef = useRef({ visible: false, activeTime: 0 });
  const movingPlatformRef = useRef({ direction: 1, speed: 2 });
  const goalFlipTimerRef = useRef(0);
  const platformTouchedRef = useRef(false);
  const levelTimerRef = useRef(0);

  const playSound = (type) => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      if (!context) return;
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      let freq = 0;
      let vol = 0.3;
      if (type === 'jump') freq = 440;
      else if (type === 'hit') freq = 100;
      else if (type === 'win') freq = 880;
      else if (type === 'gameover') freq = 50;
      else if (type === 'trick') { freq = 200; vol = 0.5; }
      else if (type === 'countdown') { freq = 600; vol = 0.2; }

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, context.currentTime);
      gainNode.gain.setValueAtTime(vol, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.2);
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const logEvent = (event, detail = {}) => {
    const player = playerRef.current;
    const entry = {
      timestamp: performance.now(),
      isoTimestamp: new Date().toISOString(),
      level: currentLevel,
      playerX: parseFloat(player.x.toFixed(1)),
      playerY: parseFloat(player.y.toFixed(1)),
      velocityX: parseFloat(player.vx.toFixed(2)),
      velocityY: parseFloat(player.vy.toFixed(2)),
      grounded: player.grounded,
      input: lastInputRef.current,
      event: event,
      detail: detail
    };
    moveLogRef.current.push(entry);
  };

  const initStars = () => {
    starsRef.current = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      starsRef.current.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        radius: Math.random() * 1.5,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  };

  const showFloatingFeedbackMsg = (message, color) => {
    setFloatingFeedback({ message, color });
    setTimeout(() => setFloatingFeedback(null), 1000);
  };

  const initializeLevelConfig = (level) => {
    setDynamicLevelConfig(JSON.parse(JSON.stringify(INITIAL_LEVEL_CONFIG[level])));
  };

  const resetPlayerPosition = () => {
    const config = INITIAL_LEVEL_CONFIG[currentLevel];
    playerRef.current = {
      x: config.start.x, y: config.start.y,
      width: 40, height: 40,
      vx: 0, vy: 0, grounded: true
    };
    disappearingPlatformTimerRef.current = 0;
    appearingHazardRef.current = { visible: false, activeTime: 0 };
    winWaitTimeRef.current = 0;
    groundWarningVisibleRef.current = false;
    movingPlatformRef.current = { direction: 1, speed: 2 };
    goalFlipTimerRef.current = 0;
    platformTouchedRef.current = false;
    initializeLevelConfig(currentLevel);
  };

  const resetLevel = (reason) => {
    // DON'T stop the game, DON'T reset timer, just respawn player
    playSound('trick');

    const newLevelResets = levelResets + 1;
    const newTotalResets = totalResets + 1;
    setLevelResets(newLevelResets);
    setTotalResets(newTotalResets);

    logEvent('Level_Reset', {
      reason: reason,
      totalResets: newLevelResets,
      levelTime: performance.now() - startTimeRef.current
    });

    showFloatingFeedbackMsg('RESET: ' + reason, '#ff0000');

    // Immediately respawn without stopping the game or timer
    resetPlayerPosition();
    // Game continues running, timer keeps counting
  };

  const handleLevelWin = () => {
    playSound('win');
    cancelAnimationFrame(animationFrameRef.current);
    gameRunning.current = false;

    const timeTaken = performance.now() - startTimeRef.current;
    const timeRemaining = LEVEL_TIME_LIMIT - timeTaken;
    
    performanceDataRef.current.push({
      level: currentLevel,
      time_ms: timeTaken,
      resets: levelResets,
      completed: true,
      timeRemaining: Math.max(0, timeRemaining)
    });

    logEvent('Level_Complete', { time_ms: timeTaken, resets: levelResets, completed: true });

    if (currentLevel < 5) {
      const nextLevel = currentLevel + 1;
      setMessageData({
        title: 'LEVEL ' + currentLevel + ' COMPLETE!',
        body: 'Completed! Resets: ' + levelResets + ' | Time: ' + (timeTaken/1000).toFixed(1) + 's. Next: ' + INITIAL_LEVEL_CONFIG[nextLevel].hint,
        buttonText: "NEXT LEVEL",
        callback: () => {
          setMessageData(null);
          setCurrentLevel(nextLevel);
          setLevelResets(0);
          setGameState('countdown');
          setCountdown(3);
        }
      });
    } else {
      handleGameOver();
    }
  };

  const handleLevelTimeout = () => {
    playSound('hit');
    cancelAnimationFrame(animationFrameRef.current);
    gameRunning.current = false;

    const timeTaken = performance.now() - startTimeRef.current;
    
    performanceDataRef.current.push({
      level: currentLevel,
      time_ms: timeTaken,
      resets: levelResets,
      completed: false,
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
          setMessageData(null);
          setCurrentLevel(nextLevel);
          setLevelResets(0);
          setGameState('countdown');
          setCountdown(3);
        }
      });
    } else {
      handleGameOver();
    }
  };

  const handleGameOver = async () => {
    playSound('gameover');
    logEvent('Game_Over', { totalResets: totalResets });
    gameRunning.current = false;

    // Send end signal to backend to mark session complete
    try {
      const userId = localStorage.getItem('userId');
      const guestId = localStorage.getItem('guestId');
      const sessionId = localStorage.getItem('gameSessionId');
      
      await fetch('http://localhost:5000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end: true,
          gameKey: 'mario',
          sessionId,
          userId: userId || undefined,
          guestId: guestId || undefined
        })
      });
      console.log('✅ Mario game session ended in backend');
    } catch (error) {
      console.error('❌ Error ending Mario session:', error);
    }

    // Show completion message briefly, then navigate
    setMessageData({
      title: "ALL GAMES COMPLETE!",
      body: 'Total Resets: ' + totalResets + '. Generating your cognitive assessment report...',
      buttonText: "VIEW REPORT",
      callback: () => {
        setMessageData(null);
        // Call onGameComplete to trigger navigation to report
        if (onGameComplete) {
          onGameComplete();
        }
      }
    });
  };

  const generateCognitiveReport = () => {
    const totalTimeMs = performanceDataRef.current.reduce((sum, data) => sum + data.time_ms, 0);
    const totalTimeSeconds = totalTimeMs / 1000;
    const avgResetsPerLevel = totalResets / 5;
    
    // Calculate completion stats
    const completedLevels = performanceDataRef.current.filter(d => d.completed).length;
    const timedOutLevels = performanceDataRef.current.filter(d => !d.completed).length;
    const completionRate = (completedLevels / 5) * 100;

    const mistakeTypes = moveLogRef.current.filter(e => e.event === 'Level_Reset').map(e => e.detail.reason);
    const trickResets = mistakeTypes.filter(r => r.includes('Pit') || r.includes('Trap') || r.includes('Fake')).length;
    const motorResets = mistakeTypes.filter(r => r.includes('Void') || r.includes('Fell')).length;
    const hazardResets = mistakeTypes.filter(r => r.includes('Spike') || r.includes('Hazard') || r.includes('Moving')).length;
    const disappearingResets = mistakeTypes.filter(r => r.includes('Disappearing') || r.includes('Vanish')).length;

    // Penalize for timed-out levels
    const timeoutPenalty = timedOutLevels * 10;
    
    const attentionScore = Math.max(0, 100 - (trickResets * 15) - timeoutPenalty);
    const motorControlScore = Math.max(0, 100 - (motorResets * 12) - (timeoutPenalty * 0.5));
    const cognitiveLoadScore = Math.max(0, 100 - (disappearingResets * 10) - (avgResetsPerLevel * 5) - timeoutPenalty);
    const environmentalStressScore = Math.max(0, 100 - (hazardResets * 15) - (timeoutPenalty * 0.5));
    const behavioralStabilityScore = Math.max(0, 100 - (totalResets * 3) - timeoutPenalty);
    const neuroBalanceScore = (attentionScore + motorControlScore + cognitiveLoadScore + environmentalStressScore + behavioralStabilityScore) / 5;

    let riskLevel = "LOW RISK";
    let riskColor = "#00ff00";
    let riskDescription = "Your performance suggests strong executive function and impulse control. No significant attention concerns detected. Keep maintaining healthy habits!";
    let recommendation = "You're performing well! Continue with regular exercise, good sleep, and balanced nutrition.";

    if (neuroBalanceScore < 70) {
      riskLevel = "MODERATE RISK";
      riskColor = "#ffaa00";
      riskDescription = "Some executive function challenges detected. You may experience occasional difficulties with focus, impulse control, or task completion.";
      recommendation = "Consider consulting a healthcare professional if you experience daily difficulties with attention, organization, or impulse control. Lifestyle modifications like structured routines and mindfulness may help.";
    }

    if (neuroBalanceScore < 50) {
      riskLevel = "HIGH RISK";
      riskColor = "#ff0000";
      riskDescription = "Significant executive function challenges detected. Your performance patterns suggest difficulties consistent with attention regulation issues.";
      recommendation = "⚠️ STRONGLY RECOMMENDED: Consult a psychiatrist or psychologist for comprehensive ADHD evaluation. Early intervention can significantly improve quality of life.";
    }

    const radarPoints = [
      { angle: 0, value: attentionScore, label: 'Attention' },
      { angle: 72, value: motorControlScore, label: 'Motor' },
      { angle: 144, value: cognitiveLoadScore, label: 'Cognitive' },
      { angle: 216, value: environmentalStressScore, label: 'Stress' },
      { angle: 288, value: behavioralStabilityScore, label: 'Stability' }
    ];

    const htmlReport = `
      <div style="font-family: 'Press Start 2P', monospace; color: #00eaff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 1.5rem; margin-bottom: 10px;">VOID JUMPER</h1>
          <h2 style="font-size: 1rem; color: #ff4081;">NEURO-COGNITIVE ASSESSMENT</h2>
        </div>

        <div style="background: rgba(255, 64, 129, 0.1); border: 2px solid ${riskColor}; padding: 20px; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 0 20px ${riskColor};">
          <h3 style="color: ${riskColor}; font-size: 1.2rem; margin-bottom: 10px;">RISK ASSESSMENT: ${riskLevel}</h3>
          <p style="font-size: 0.7rem; line-height: 1.8; color: #ffffff;">NeuroBalance Score: ${neuroBalanceScore.toFixed(1)}/100</p>
          <p style="font-size: 0.6rem; line-height: 1.8; color: #cccccc;">Total Resets: ${totalResets} | Time: ${totalTimeSeconds.toFixed(1)}s | Completed: ${completedLevels}/5</p>
          <p style="font-size: 0.6rem; line-height: 1.8; margin-top: 15px; color: #ffffff;">${riskDescription}</p>
          <p style="font-size: 0.6rem; line-height: 1.8; margin-top: 10px; color: #ffaa00; background: rgba(255, 170, 0, 0.1); padding: 10px; border-radius: 5px;">${recommendation}</p>
        </div>

        <div style="background: rgba(0, 234, 255, 0.05); padding: 20px; margin-bottom: 20px; border-radius: 10px; border: 1px solid #00eaff;">
          <h3 style="font-size: 0.9rem; margin-bottom: 15px; text-align: center;">PERFORMANCE RADAR</h3>
          <div style="position: relative; width: 300px; height: 300px; margin: 0 auto;">
            <svg width="300" height="300" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r="120" fill="none" stroke="rgba(0, 234, 255, 0.1)" stroke-width="1"/>
              <circle cx="150" cy="150" r="90" fill="none" stroke="rgba(0, 234, 255, 0.1)" stroke-width="1"/>
              <circle cx="150" cy="150" r="60" fill="none" stroke="rgba(0, 234, 255, 0.1)" stroke-width="1"/>
              <circle cx="150" cy="150" r="30" fill="none" stroke="rgba(0, 234, 255, 0.1)" stroke-width="1"/>
              
              ${radarPoints.map(p => {
                const rad = (p.angle - 90) * Math.PI / 180;
                const x2 = 150 + 120 * Math.cos(rad);
                const y2 = 150 + 120 * Math.sin(rad);
                return `<line x1="150" y1="150" x2="${x2}" y2="${y2}" stroke="rgba(0, 234, 255, 0.2)" stroke-width="1"/>`;
              }).join('')}
              
              <polygon points="${radarPoints.map(p => {
                const rad = (p.angle - 90) * Math.PI / 180;
                const distance = (p.value / 100) * 120;
                const x = 150 + distance * Math.cos(rad);
                const y = 150 + distance * Math.sin(rad);
                return `${x},${y}`;
              }).join(' ')}" fill="rgba(255, 64, 129, 0.3)" stroke="#ff4081" stroke-width="2"/>
              
              ${radarPoints.map(p => {
                const rad = (p.angle - 90) * Math.PI / 180;
                const distance = (p.value / 100) * 120;
                const x = 150 + distance * Math.cos(rad);
                const y = 150 + distance * Math.sin(rad);
                return `<circle cx="${x}" cy="${y}" r="4" fill="#ff4081"/>`;
              }).join('')}
              
              ${radarPoints.map(p => {
                const rad = (p.angle - 90) * Math.PI / 180;
                const x = 150 + 140 * Math.cos(rad);
                const y = 150 + 140 * Math.sin(rad);
                return `<text x="${x}" y="${y}" fill="#00eaff" font-size="10" text-anchor="middle">${p.label}</text>`;
              }).join('')}
            </svg>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #00eaff;">
            <h4 style="font-size: 0.7rem; margin-bottom: 8px; color: #00eaff;">ATTENTION</h4>
            <p style="font-size: 0.6rem; color: #ffffff;">Score: ${attentionScore.toFixed(1)}/100</p>
            <p style="font-size: 0.5rem; color: #cccccc; margin-top: 5px;">Trick resets: ${trickResets}. ${attentionScore > 70 ? 'Strong attention to detail' : 'Attention challenges detected'}</p>
          </div>

          <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #ff4081;">
            <h4 style="font-size: 0.7rem; margin-bottom: 8px; color: #ff4081;">MOTOR CONTROL</h4>
            <p style="font-size: 0.6rem; color: #ffffff;">Score: ${motorControlScore.toFixed(1)}/100</p>
            <p style="font-size: 0.5rem; color: #cccccc; margin-top: 5px;">Falls: ${motorResets}. ${motorControlScore > 70 ? 'Excellent motor timing' : 'Motor timing challenges'}</p>
          </div>

          <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #ffaa00;">
            <h4 style="font-size: 0.7rem; margin-bottom: 8px; color: #ffaa00;">COGNITIVE LOAD</h4>
            <p style="font-size: 0.6rem; color: #ffffff;">Score: ${cognitiveLoadScore.toFixed(1)}/100</p>
            <p style="font-size: 0.5rem; color: #cccccc; margin-top: 5px;">Avg resets: ${avgResetsPerLevel.toFixed(1)}. ${cognitiveLoadScore > 70 ? 'Strong working memory' : 'Working memory challenges'}</p>
          </div>

          <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #ff0000;">
            <h4 style="font-size: 0.7rem; margin-bottom: 8px; color: #ff0000;">ENVIRONMENTAL STRESS</h4>
            <p style="font-size: 0.6rem; color: #ffffff;">Score: ${environmentalStressScore.toFixed(1)}/100</p>
            <p style="font-size: 0.5rem; color: #cccccc; margin-top: 5px;">Hazard hits: ${hazardResets}. ${environmentalStressScore > 70 ? 'Quick threat response' : 'Delayed threat response'}</p>
          </div>

          <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; border-left: 3px solid #00ff00;">
            <h4 style="font-size: 0.7rem; margin-bottom: 8px; color: #00ff00;">BEHAVIORAL STABILITY</h4>
            <p style="font-size: 0.6rem; color: #ffffff;">Score: ${behavioralStabilityScore.toFixed(1)}/100</p>
            <p style="font-size: 0.5rem; color: #cccccc; margin-top: 5px;">Total resets: ${totalResets}. ${behavioralStabilityScore > 70 ? 'Strong impulse control' : 'Impulse control challenges'}</p>
          </div>
        </div>

        <div style="background: rgba(0, 234, 255, 0.05); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="font-size: 0.8rem; margin-bottom: 10px; color: #00eaff;">Level Performance (30s each)</h4>
          ${performanceDataRef.current.map(perf => `
            <div style="font-size: 0.6rem; color: #cccccc; margin-bottom: 5px; padding: 5px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; border-left: 3px solid ${perf.completed ? '#00ff00' : '#ff0000'};">
              Level ${perf.level}: ${(perf.time_ms/1000).toFixed(1)}s | ${perf.resets} resets | ${perf.completed ? '✓ COMPLETED' : '✗ TIME OUT'}
            </div>
          `).join('')}
          <div style="font-size: 0.6rem; color: #00eaff; margin-top: 10px; padding: 5px;">
            Completion Rate: ${completionRate.toFixed(0)}% (${completedLevels}/5 completed)
          </div>
        </div>

        <div style="background: rgba(255, 255, 0, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #ffaa00;">
          <p style="font-size: 0.5rem; color: #ffaa00; line-height: 1.6;">
            ⚠️ DISCLAIMER: This is a screening tool, NOT a clinical diagnosis. Results should not replace professional medical evaluation. Consult licensed healthcare providers for accurate ADHD assessment.
          </p>
        </div>
      </div>
    `;

    return {
      html: htmlReport,
      rawLog: {
        assessmentDate: new Date().toISOString(),
        totalResets: totalResets,
        totalTimeSeconds: totalTimeSeconds,
        completionStats: {
          completedLevels: completedLevels,
          timedOutLevels: timedOutLevels,
          completionRate: completionRate
        },
        scores: {
          attention: attentionScore,
          motorControl: motorControlScore,
          cognitiveLoad: cognitiveLoadScore,
          environmentalStress: environmentalStressScore,
          behavioralStability: behavioralStabilityScore,
          neuroBalance: neuroBalanceScore
        },
        riskLevel: riskLevel,
        riskDescription: riskDescription,
        recommendation: recommendation,
        metrics: {
          trickResets: trickResets,
          motorResets: motorResets,
          hazardResets: hazardResets,
          disappearingResets: disappearingResets,
          avgResetsPerLevel: avgResetsPerLevel,
          timeoutPenalty: timeoutPenalty
        },
        performanceSummary: performanceDataRef.current,
        detailedEventLog: moveLogRef.current
      },
      totalTimeSeconds: totalTimeSeconds
    };
  };

  const downloadJSON = (data, filename) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checkCollision = (obj1, obj2) => {
    return obj1.x < obj2.x + obj2.w &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.h &&
           obj1.y + obj1.height > obj2.y;
  };

  const updatePhysics = () => {
    if (!gameRunning.current) return;

    const player = playerRef.current;
    player.vy += GRAVITY;
    player.x += player.vx;

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;

    let nextY = player.y + player.vy;
    player.grounded = false;

    const config = dynamicLevelConfig;

    // Level 1: Invisible Pit
    if (currentLevel === 1 && config.invisiblePit) {
      const pit = config.invisiblePit;
      if (player.x + player.width > pit.x && 
          player.x < pit.x + pit.w &&
          nextY + player.height >= pit.y &&
          player.y + player.height <= pit.y + 10) {
        if (levelResets === 0) {
          resetLevel('Invisible Pit (Initial Trap)');
          return;
        } else {
          groundWarningVisibleRef.current = true;
        }
      } else {
        groundWarningVisibleRef.current = false;
      }
    }

    // Level 3: Disappearing Platform
    if (currentLevel === 3) {
      const disappearingPlat = config.platforms.find(p => p.type === 'disappearing');
      if (disappearingPlat && disappearingPlat.active) {
        const isOnPlatform = player.x + player.width > disappearingPlat.x &&
                            player.x < disappearingPlat.x + disappearingPlat.w &&
                            nextY + player.height >= disappearingPlat.y - 5 &&
                            nextY + player.height <= disappearingPlat.y + 5 &&
                            player.vy >= 0;

        if (isOnPlatform && disappearingPlatformTimerRef.current === 0) {
          disappearingPlatformTimerRef.current = performance.now();
          platformTouchedRef.current = true;
          logEvent('Platform_Contact');
        }

        if (platformTouchedRef.current && disappearingPlatformTimerRef.current > 0 &&
            performance.now() - disappearingPlatformTimerRef.current > 1000) {
          const updatedPlatforms = config.platforms.map(p =>
            p.id === disappearingPlat.id ? { ...p, active: false, visual: false } : p
          );
          setDynamicLevelConfig(prev => ({...prev, platforms: updatedPlatforms}));
          disappearingPlatformTimerRef.current = -1;
          logEvent('Platform_Vanished');
        }
      }
    }

    // Level 4: Moving Platform & Appearing Hazard
    if (currentLevel === 4) {
      const movingPlat = config.platforms.find(p => p.type === 'moving');
      if (movingPlat) {
        movingPlat.x += movingPlatformRef.current.direction * movingPlatformRef.current.speed;
        if (movingPlat.x <= movingPlat.initialX - 50 || movingPlat.x >= movingPlat.initialX + 50) {
          movingPlatformRef.current.direction *= -1;
        }
      }

      if (config.appearingHazard) {
        const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;
        const inDangerZone = player.x > 300 && player.x < 500;
        if (isMoving && inDangerZone) {
          if (!appearingHazardRef.current.visible) {
            logEvent('Hazard_Appeared');
          }
          appearingHazardRef.current.visible = true;
          appearingHazardRef.current.activeTime = performance.now();
        } else if (appearingHazardRef.current.visible &&
                   performance.now() - appearingHazardRef.current.activeTime > 500) {
          appearingHazardRef.current.visible = false;
          logEvent('Hazard_Vanished');
        }
      }
    }

    // Level 5: Goal Flip
    if (currentLevel === 5) {
      if (goalFlipTimerRef.current === 0) {
        goalFlipTimerRef.current = performance.now();
      }

      if (performance.now() - goalFlipTimerRef.current > 30000) {
        const tempX = config.goal.x;
        const tempY = config.goal.y;
        config.goal.x = config.fakeGoal.x;
        config.goal.y = config.fakeGoal.y;
        config.fakeGoal.x = tempX;
        config.fakeGoal.y = tempY;
        goalFlipTimerRef.current = performance.now();
        logEvent('Goals_Flipped');
        showFloatingFeedbackMsg('GOALS SWITCHED!', '#ff00ff');
      }
    }

    // Platform Collision
    for (const platform of config.platforms) {
      if (!platform.active || !platform.visual) continue;

      const platX = platform.x;
      const platObj = { x: platX, y: platform.y, w: platform.w, h: platform.h };

      if (player.vy >= 0 && player.y + player.height <= platform.y + 10 &&
          nextY + player.height >= platform.y &&
          player.x + player.width > platX &&
          player.x < platX + platform.w) {
        player.y = platform.y - player.height;
        player.vy = 0;
        player.grounded = true;
        nextY = player.y;

        if (platform.type === 'moving') {
          player.x += movingPlatformRef.current.direction * movingPlatformRef.current.speed;
        }
        break;
      }
    }

    player.y = nextY;

    // Hazard Collision
    for (const hazard of config.hazards) {
      if (hazard.type === 'fake_goal' && checkCollision(player, hazard)) {
        resetLevel('Fake Goal Trap (Attention Failure)');
        return;
      }
      if (hazard.type === 'spike' && checkCollision(player, hazard)) {
        resetLevel('Spike Hit (Motor Control Failure)');
        return;
      }
    }

    if (currentLevel === 4 && appearingHazardRef.current.visible && config.appearingHazard) {
      if (checkCollision(player, config.appearingHazard)) {
        resetLevel('Moving Hazard (Inhibitory Control Failure)');
        return;
      }
    }

    if (currentLevel === 5 && config.fakeGoal && checkCollision(player, config.fakeGoal)) {
      resetLevel('Fake Goal (Attention Failure)');
      return;
    }

    // Fall Check
    if (player.y > CANVAS_HEIGHT + 50) {
      resetLevel('Fell Into Void (Motor Control Failure)');
      return;
    }

    // Goal Check
    if (checkCollision(player, config.goal)) {
      if (currentLevel === 5 && config.goal.type === 'delayed_flip') {
        const isStill = Math.abs(player.vx) < 0.1 && Math.abs(player.vy) < 0.1 && player.grounded;
        if (isStill) {
          if (winWaitTimeRef.current === 0) {
            logEvent('Goal_Wait_Start');
            winWaitTimeRef.current = performance.now();
            showFloatingFeedbackMsg('STAY STILL... 1.5s', '#00eaff');
          } else if (performance.now() - winWaitTimeRef.current >= 1500) {
            handleLevelWin();
            return;
          }
        } else {
          if (winWaitTimeRef.current > 0) {
            showFloatingFeedbackMsg('STOP MOVING!', '#ff0000');
            logEvent('Goal_Wait_Failed');
          }
          winWaitTimeRef.current = 0;
        }
      } else {
        handleLevelWin();
        return;
      }
    } else {
      if (winWaitTimeRef.current > 0 && currentLevel === 5) {
        winWaitTimeRef.current = 0;
        logEvent('Goal_Wait_Cancelled');
      }
    }
  };

  const handleInput = () => {
    if (!gameRunning.current) return;

    const player = playerRef.current;
    player.vx = 0;
    let currentInput = 'None';

    if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) {
      player.vx = -MOVE_SPEED;
      currentInput = 'Move_Left';
    }
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) {
      player.vx = MOVE_SPEED;
      currentInput = 'Move_Right';
    }
    if (keysRef.current['Space'] || keysRef.current['KeyW'] || keysRef.current['ArrowUp']) {
      if (player.grounded) {
        player.vy = JUMP_VELOCITY;
        player.grounded = false;
        playSound('jump');
        currentInput = 'Jump';
      }
      keysRef.current['Space'] = false;
      keysRef.current['KeyW'] = false;
      keysRef.current['ArrowUp'] = false;
    }

    if (currentInput !== lastInputRef.current) {
      lastInputRef.current = currentInput;
      logEvent('Input_' + currentInput);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#00000a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#00eaff';
    starsRef.current.forEach(star => {
      ctx.globalAlpha = star.opacity;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const config = dynamicLevelConfig;

    ctx.fillStyle = '#00eaff';
    ctx.shadowColor = '#00eaff';
    ctx.shadowBlur = 10;

    config.platforms.forEach(p => {
      if (p.active && p.visual) {
        const platX = p.x;
        ctx.fillRect(platX, p.y, p.w, p.h);

        if (p.type === 'disappearing' && disappearingPlatformTimerRef.current > 0 && disappearingPlatformTimerRef.current !== -1) {
          const elapsed = performance.now() - disappearingPlatformTimerRef.current;
          if (elapsed > 700) {
            ctx.fillStyle = 'rgba(255, 64, 129, 0.8)';
            ctx.fillRect(platX, p.y, p.w, p.h);
            ctx.fillStyle = '#00eaff';
          }
        }
      }
    });

    if (currentLevel === 1 && groundWarningVisibleRef.current && config.invisiblePit) {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
      ctx.fillRect(config.invisiblePit.x, config.invisiblePit.y, config.invisiblePit.w, config.invisiblePit.h);
    }

    ctx.shadowBlur = 0;

    config.hazards.forEach(h => {
      if (h.type === 'fake_goal') {
        ctx.fillStyle = '#FFFF00';
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 15;
        ctx.fillRect(h.x, h.y, h.w, h.h);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'black';
        ctx.font = "14px Arial";
        ctx.textAlign = 'center';
        ctx.fillText("TRAP", h.x + h.w / 2, h.y + h.h / 2 + 5);
      } else if (h.type === 'spike') {
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(h.x, h.y + h.h);
        ctx.lineTo(h.x + h.w / 2, h.y);
        ctx.lineTo(h.x + h.w, h.y + h.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    if (currentLevel === 4 && config.appearingHazard && appearingHazardRef.current.visible) {
      const h = config.appearingHazard;
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(h.x, h.y + h.h);
      ctx.lineTo(h.x + h.w / 2, h.y);
      ctx.lineTo(h.x + h.w, h.y + h.h);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    if (currentLevel === 5 && config.fakeGoal) {
      ctx.fillStyle = '#FFFF00';
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 12;
      ctx.fillRect(config.fakeGoal.x, config.fakeGoal.y, config.fakeGoal.w, config.fakeGoal.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#000000';
      ctx.font = "bold 12px Arial";
      ctx.textAlign = 'center';
      ctx.fillText("FAKE", config.fakeGoal.x + config.fakeGoal.w / 2, config.fakeGoal.y + config.fakeGoal.h / 2 + 4);
    }

    const goalColor = (currentLevel === 5 && winWaitTimeRef.current > 0) ? '#FFFFFF' : '#00eaff';
    const goalPulse = (currentLevel === 5 && winWaitTimeRef.current > 0) ? 20 + Math.sin(performance.now() / 100) * 10 : 15;
    ctx.fillStyle = goalColor;
    ctx.shadowColor = goalColor;
    ctx.shadowBlur = goalPulse;
    ctx.fillRect(config.goal.x, config.goal.y, config.goal.w, config.goal.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00000a';
    ctx.font = "bold 16px Arial";
    ctx.textAlign = 'center';
    ctx.fillText("GOAL", config.goal.x + config.goal.w / 2, config.goal.y + config.goal.h / 2 + 5);

    const player = playerRef.current;
    ctx.fillStyle = '#ff4081';
    ctx.shadowColor = '#ff4081';
    ctx.shadowBlur = 25;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.shadowBlur = 0;
  };

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

  const startGame = () => {
    setCurrentLevel(1);
    setLevelResets(0);
    setTotalResets(0);
    performanceDataRef.current = [];
    moveLogRef.current = [];
    setReportHTML('');
    setGameState('countdown');
    setCountdown(3);
    initStars();
  };

  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        playSound('countdown');
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState('playing');
        initializeLevelConfig(currentLevel);
        resetPlayerPosition();
        gameRunning.current = true;
        startTimeRef.current = performance.now();
        logEvent('Game_Start');
        requestAnimationFrame(gameLoop);
      }
    }
  }, [gameState, countdown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'Space', 'KeyW'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    initStars();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      draw();
    }
  }, [currentLevel, levelResets, gameState, dynamicLevelConfig]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #00000a 0%, #0a0a2e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: "'Press Start 2P', monospace"
    }}>
      {gameState === 'intro' && (
        <div style={{
          textAlign: 'center',
          color: '#00eaff',
          padding: '40px',
          maxWidth: '700px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '20px',
            textShadow: '0 0 20px #00eaff',
            animation: 'pulse 2s infinite'
          }}>VOID JUMPER</h1>
          <h2 style={{
            fontSize: '1rem',
            color: '#ff4081',
            marginBottom: '30px',
            textShadow: '0 0 15px #ff4081'
          }}>ADHD Assessment Game</h2>
          
          <div style={{
            background: 'rgba(0, 234, 255, 0.1)',
            border: '2px solid #00eaff',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '15px', color: '#00eaff' }}>GAME RULES:</h3>
            <ul style={{ fontSize: '0.6rem', lineHeight: '1.8', color: '#ffffff', listStyle: 'none', padding: 0 }}>
              <li>✓ Navigate through 5 challenging levels</li>
              <li>✓ Each level tests different cognitive abilities</li>
              <li>✓ ⏱️ 30 SECONDS per level - complete fast or auto-advance!</li>
              <li>✓ Beware of invisible traps, fake goals, and disappearing platforms</li>
              <li>✓ Complete all levels to receive your assessment</li>
            </ul>
          </div>

          <div style={{
            background: 'rgba(255, 64, 129, 0.1)',
            border: '2px solid #ff4081',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '15px', color: '#ff4081' }}>CONTROLS:</h3>
            <p style={{ fontSize: '0.6rem', lineHeight: '1.8', color: '#ffffff' }}>
              • A/D or Arrow Keys = Move Left/Right<br/>
              • W/Up/Space = Jump<br/>
              • Goal: Reach the CYAN glowing goal in each level
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 170, 0, 0.1)',
            border: '2px solid #ffaa00',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.8rem', marginBottom: '15px', color: '#ffaa00' }}>ASSESSMENT AREAS:</h3>
            <p style={{ fontSize: '0.6rem', lineHeight: '1.8', color: '#ffffff' }}>
              This game evaluates:<br/>
              • Attention & Focus<br/>
              • Motor Control & Timing<br/>
              • Cognitive Load Management<br/>
              • Environmental Stress Response<br/>
              • Behavioral Stability & Impulse Control
            </p>
          </div>

          <button
            onClick={startGame}
            style={{
              fontSize: '1rem',
              padding: '20px 40px',
              background: '#00eaff',
              color: '#00000a',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 30px #00eaff',
              transition: 'all 0.3s',
              fontFamily: "'Press Start 2P', monospace"
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            START TEST
          </button>
        </div>
      )}

      {gameState === 'countdown' && (
        <div style={{
          textAlign: 'center',
          color: '#00eaff'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            marginBottom: '30px',
            color: '#ff4081'
          }}>LEVEL {currentLevel}</h2>
          <div style={{
            fontSize: '5rem',
            textShadow: '0 0 50px #00eaff',
            animation: 'pulse 1s infinite'
          }}>
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p style={{
            fontSize: '0.7rem',
            marginTop: '30px',
            color: '#ffffff',
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            {INITIAL_LEVEL_CONFIG[currentLevel].hint}
          </p>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: levelTimeRemaining <= 10 ? '#ff0000' : '#00eaff',
            fontSize: '0.8rem',
            textShadow: levelTimeRemaining <= 10 ? '0 0 20px #ff0000' : '0 0 10px #00eaff',
            textAlign: 'center',
            animation: levelTimeRemaining <= 5 ? 'pulse 0.5s infinite' : 'none'
          }}>
            LEVEL: {currentLevel} / 5 | RESETS: {levelResets} | TIME: {levelTimeRemaining}s
          </div>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              border: '3px solid #00eaff',
              boxShadow: '0 0 30px #00eaff',
              borderRadius: '10px'
            }}
          />

          {messageData && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(0, 0, 0, 0.95)',
              border: '3px solid #ff4081',
              borderRadius: '15px',
              padding: '30px',
              textAlign: 'center',
              maxWidth: '500px',
              boxShadow: '0 0 40px #ff4081',
              zIndex: 1000
            }}>
              <h2 style={{
                color: '#ff4081',
                fontSize: '1.2rem',
                marginBottom: '20px',
                textShadow: '0 0 15px #ff4081'
              }}>{messageData.title}</h2>
              <p style={{
                color: '#ffffff',
                fontSize: '0.7rem',
                marginBottom: '25px',
                lineHeight: '1.6'
              }}>{messageData.body}</p>
              <button
                onClick={messageData.callback}
                style={{
                  fontSize: '0.8rem',
                  padding: '15px 30px',
                  background: '#00eaff',
                  color: '#00000a',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 0 20px #00eaff',
                  fontFamily: "'Press Start 2P', monospace"
                }}
              >
                {messageData.buttonText}
              </button>
            </div>
          )}

          {floatingFeedback && (
            <div style={{
              position: 'absolute',
              top: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: floatingFeedback.color,
              fontSize: '1rem',
              textShadow: `0 0 20px ${floatingFeedback.color}`,
              animation: 'fadeOut 1s',
              pointerEvents: 'none'
            }}>
              {floatingFeedback.message}
            </div>
          )}
        </>
      )}

      {gameState === 'report' && (
        <div style={{
          maxWidth: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.9)',
          border: '3px solid #00eaff',
          borderRadius: '15px',
          padding: '30px',
          boxShadow: '0 0 50px #00eaff'
        }}>
          <div dangerouslySetInnerHTML={{ __html: reportHTML }} />
          
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '30px'
          }}>
            <button
              onClick={() => {
                const report = generateCognitiveReport();
                downloadJSON(report.rawLog, 'void_jumper_assessment_' + Date.now() + '.json');
              }}
              style={{
                padding: '15px 30px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: "'Press Start 2P', monospace",
                background: '#00eaff',
                color: '#00000a',
                boxShadow: '0 0 20px #00eaff',
                fontSize: '0.7rem',
                border: 'none'
              }}
            >
              📥 DOWNLOAD JSON
            </button>
            <button
              onClick={() => {
                setGameState('intro');
                setReportHTML('');
              }}
              style={{
                padding: '15px 30px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: "'Press Start 2P', monospace",
                background: '#ff4081',
                color: '#00000a',
                boxShadow: '0 0 20px #ff4081',
                fontSize: '0.7rem',
                border: 'none'
              }}
            >
              🔄 RESTART TEST
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px); }
        }
      `}</style>
    </div>
  );
};

export default VoidJumper;
          