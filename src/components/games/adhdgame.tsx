import React, { useState, useEffect, useRef, useCallback } from 'react';
import ADHDParticleBackground from './ADHDParticleBackground';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  BrainCircuit,
  Activity,
  Scaling,
  ShieldAlert,
  Target,
  GitCommitHorizontal,
  CheckCircle,
  XCircle,
  Download,
  RotateCcw,
} from 'lucide-react';
import * as Tone from 'tone';

// -----------------------------
// NeuroMatrix - Single File App
// -----------------------------

// ---------- CONFIG ----------
const STIMULI = {
  shapes: ['circle', 'square', 'triangle', 'star'],
  colors: ['red', 'blue', 'green', 'yellow'],
  colorMap: { red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#facc15' },
};

// --- MODIFICATION: Updated trial counts ---
// Removed the practice block so the ADHD game starts directly with the timed assessment blocks
const GAME_BLOCKS = [
  { key: 'shape', name: 'Sort by Shape', rule: 'shape', trials: 15, timed: true },
  { key: 'color', name: 'Sort by Color', rule: 'color', trials: 15, timed: true },
  { key: '2back', name: '2-Back Memory', rule: '2-back', trials: 15, timed: true }, // Changed from 20 to 15
];

// ---------- AUDIO ----------
const sfx = {
  synth: null,
  isInit: false,
  init() {
    if (this.isInit) return;
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
    }).toDestination();
    this.isInit = true;
  },
  play(note = 'C4', dur = '8n') {
    if (!this.isInit) return;
    this.synth.triggerAttackRelease(note, dur, Tone.now());
  },
  success() {
    this.play('C5', '16n');
    this.play('E5', '16n');
  },
  error() {
    this.play('G3', '8n');
  },
  sw() {
    this.play('A4', '8n');
  },
};

// ---------- HELPERS ----------
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Save game data to MongoDB
const saveGameData = async (eventLog) => {
  console.log('🎮 ===== STARTING ADHD GAME DATA SAVE =====');
  console.log('🔍 Event log received:', eventLog);
  console.log('📊 Event log length:', eventLog?.length || 0);
  console.log('🔍 Event log type:', typeof eventLog);
  console.log('🔍 Event log is array:', Array.isArray(eventLog));
  
  try {
    const userId = localStorage.getItem('userId');
    console.log('👤 Retrieved userId from localStorage:', userId);
    console.log('👤 userId type:', typeof userId);
    
    if (!userId) {
      console.warn('⚠️ No userId found in localStorage, cannot save ADHD game data');
      alert('❌ No user ID found! Cannot save ADHD game data.');
      return;
    }

    if (!eventLog || eventLog.length === 0) {
      console.warn('⚠️ No event log data to save');
      console.log('🔍 eventLog is:', eventLog);
      alert('❌ No event log data to save!');
      return;
    }

    console.log('📈 Analyzing performance...');
    const analysis = analyzePerformance(eventLog);
    console.log('✅ Analysis complete:', analysis);
    console.log('📊 Analysis type:', typeof analysis);

    const gameData = {
      userId,
      gameType: 'NeuroMatrix-ADHD',
      scores: {
        motorControl: 0,
        cognitiveLoad: Math.round(analysis.overallAccuracy * 100),
        stressManagement: Math.max(0, 100 - Math.round(analysis.rtStd / 10)),
        behavioralStability: Math.round(analysis.twoBackAccuracy * 100),
        neuroBalance: Math.round((analysis.overallAccuracy + analysis.twoBackAccuracy) * 50),
        // ADHD-specific scores
        accuracy: Math.round(analysis.overallAccuracy * 100),
        speed: Math.max(0, 100 - Math.round(analysis.avgRT / 10)),
        consistency: Math.max(0, 100 - Math.round(analysis.rtStd / 10)),
        flexibility: Math.round(analysis.twoBackAccuracy * 100),
        memory: Math.round(analysis.twoBackAccuracy * 100)
      },
      performanceLog: eventLog,
      gameMetrics: {
        totalTrials: eventLog.length,
        overallAccuracy: analysis.overallAccuracy,
        averageReactionTime: analysis.avgRT,
        reactionTimeStd: analysis.rtStd,
        twoBackAccuracy: analysis.twoBackAccuracy,
        adhdIndicator: analysis.adhdIndicator,
        totalTime: 60000 // 60 seconds in milliseconds
      },
      summary: [`ADHD Game completed with ${eventLog.length} trials`],
      aiAnalysis: 'ADHD game performance analysis pending'
    };

    console.log('📤 Sending ADHD game data to MongoDB:', gameData);
    console.log('📦 gameData structure check:');
    console.log('   - userId:', gameData.userId);
    console.log('   - gameType:', gameData.gameType);
    console.log('   - scores:', gameData.scores);
    console.log('   - performanceLog length:', gameData.performanceLog.length);
    console.log('   - gameMetrics:', gameData.gameMetrics);
    console.log('🌐 Making request to: http://localhost:5000/api/reports');

    // Add additional network debugging
    console.log('🌐 Attempting fetch request...');
    
    const response = await fetch('http://localhost:5000/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gameData)
    });

    console.log('📡 Response received!');
    console.log('📡 Response status:', response.status);
    console.log('📡 Response status text:', response.statusText);
    console.log('📡 Response ok:', response.ok);
    console.log('📡 Response headers:', [...response.headers.entries()]);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ ADHD game data saved successfully to MongoDB!');
      console.log('🎯 Saved report details:', result);
      console.log('🆔 Report ID:', result.reportId || result._id);
      alert('✅ ADHD game data saved successfully!');
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to save ADHD game data. Status:', response.status);
      console.error('❌ Error response:', errorText);
      console.error('❌ Full response object:', response);
      alert(`❌ Failed to save ADHD game data! Status: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Exception occurred while saving ADHD game data:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Full error object:', error);
    alert(`❌ Error saving ADHD game data: ${error.message}`);
  }
  
  console.log('🎮 ===== ADHD GAME DATA SAVE COMPLETE =====');
};

const generateTrial = (rule, history) => {
  const shape = rand(STIMULI.shapes);
  const colorName = rand(STIMULI.colors);
  let correctResponse = 'right';
  if (rule === 'shape') {
    correctResponse = ['circle', 'square'].includes(shape) ? 'left' : 'right';
  } else if (rule === 'color') {
    correctResponse = ['red', 'blue'].includes(colorName) ? 'left' : 'right';
  } else if (rule === '2-back') {
    const twoBack = history[history.length - 2];
    correctResponse = twoBack && twoBack.stimulusShape === shape ? 'left' : 'right';
  }
  return { shape, colorName, colorValue: STIMULI.colorMap[colorName], correctResponse };
};

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const std = (arr) => {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / arr.length);
};

function downloadJSON(data, filename = 'neuromatrix_results.json') {
  const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.href = uri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------- UI PRIMITIVES ----------
const ShapeSVG = ({ shape, color }) => {
  switch (shape) {
    case 'circle':
      return <circle cx="50" cy="50" r="40" fill={color} />;
    case 'square':
      return <rect x="10" y="10" width="80" height="80" rx="8" fill={color} />;
    case 'triangle':
      return <polygon points="50,10 90,85 10,85" fill={color} />;
    case 'star':
      return <polygon points="50,8 61,38 95,38 67,58 78,88 50,70 22,88 33,58 5,38 39,38" fill={color} />;
    default:
      return null;
  }
};



// ---------- SCREENS ----------

const StartScreen = ({ onStart }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    className="max-w-3xl w-full mx-auto p-8 rounded-2xl bg-gradient-to-br from-black/40 to-slate-900/60 backdrop-blur-sm"
    style={{ border: '2px solid #00FFC0', boxShadow: '0 8px 36px rgba(0,255,192,0.14), 0 0 60px rgba(0,255,192,0.28), inset 0 0 8px rgba(0,255,192,0.06)' }}
  >
    <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-br from-cyan-600/30 to-violet-600/30 shadow-xl">
              <BrainCircuit className="w-12 h-12 text-cyan-300" />
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight"
              style={{
                color: '#00FFC0',
                textShadow: '0 0 6px rgba(0,255,192,0.6), 0 0 12px rgba(0,255,192,0.35)'
              }}
            >
              NeuroMatrix
            </h1>
          </div>
        <p className="text-center text-slate-300 max-w-2xl">A quick, gamified executive function assessment. You will complete three timed blocks that measure task switching and working memory (2-back). Focus and follow the rules — they will change.</p>
        <div className="text-sm text-amber-300">⏱️ Time limit: 60 seconds total • Estimated runtime: ~5–8 minutes. Demo only — not a clinical diagnosis.</div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} onClick={onStart} className="mt-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-semibold shadow-2xl">
          Start Assessment
        </motion.button>
      <div className="mt-6 text-xs text-slate-500 text-center max-w-xl">Controls: Click LEFT or RIGHT buttons. Use touch on mobile. Sound enabled (Tone.js).</div>
    </div>
  </motion.div>
);

const HUD = ({ current, total, timeLeft }) => {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full flex items-center justify-between text-sm text-slate-300 mb-3">
      <div>Trials Remaining: <span className="font-semibold">{total - current - 1}</span></div>
      <div className="flex items-center gap-4">
        <div className="text-lg font-bold text-red-400">
          Time: {timeLeft}s
        </div>
        <div className="w-1/2 md:w-1/3 h-2 rounded-full bg-slate-700/40 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

const GameScreen = ({ onComplete }) => {
  const [blockIndex, setBlockIndex] = useState(0);
  const [trialIndex, setTrialIndex] = useState(0);
  const [currentTrial, setCurrentTrial] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [showRuleChange, setShowRuleChange] = useState(false);
  const startRef = useRef(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStartTime] = useState(Date.now());

  useEffect(() => {
    sfx.init();
    
    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('⏰ Time limit reached! Completing ADHD game...');
          console.log('📊 Final eventLog length at timeout:', eventLog.length);
          console.log('🔍 Final eventLog content:', eventLog);
          // Just complete the game - handleComplete will do the save
          setTimeout(() => {
            console.log('⏰ TIMEOUT: Calling onComplete with eventLog:', eventLog);
            onComplete(eventLog);
          }, 200);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [eventLog, onComplete]);

  const currentBlock = GAME_BLOCKS[blockIndex];

  useEffect(() => {
    if (showRuleChange) return;
    const t = generateTrial(currentBlock.rule, eventLog);
    setCurrentTrial(t);
    startRef.current = performance.now();
  }, [blockIndex, trialIndex, showRuleChange, currentBlock.rule, eventLog]);

  const scheduleNext = useCallback(() => {
    setFeedback(null);
    if (trialIndex >= currentBlock.trials - 1) {
      if (blockIndex >= GAME_BLOCKS.length - 1) {
        console.log('🏁 All ADHD game blocks completed! Completing game...');
        console.log('📊 Current eventLog length:', eventLog.length);
        console.log('🔍 Current eventLog content:', eventLog);
        // Just complete the game - handleComplete will do the save
        setTimeout(() => {
          console.log('🏁 BLOCKS COMPLETE: Calling onComplete with eventLog:', eventLog);
          onComplete(eventLog);
        }, 500);
        return;
      }
      setBlockIndex(b => b + 1);
      setTrialIndex(0);
      setShowRuleChange(true);
      sfx.sw();
      return;
    }
    setTrialIndex(t => t + 1);
  }, [trialIndex, blockIndex, currentBlock.trials, onComplete, eventLog]);

  useEffect(() => {
    if (!showRuleChange) return;
    const id = setTimeout(() => setShowRuleChange(false), 1800);
    return () => clearTimeout(id);
  }, [showRuleChange]);

  const handleResponse = (side) => {
    if (!currentTrial || feedback) return;
    
    // --- MODIFICATION: Capture high-precision timestamps ---
    const responsePerfTime = performance.now();
    const rt = responsePerfTime - startRef.current;
    const responseTimestamp = new Date();
    const stimulusAppearanceTimestamp = new Date(responseTimestamp.getTime() - rt);
    
    const isCorrect = side === currentTrial.correctResponse;

    const entry = {
      trialNumber: eventLog.length,
      blockKey: currentBlock.key,
      blockName: currentBlock.name,
      rule: currentBlock.rule,
      stimulusShape: currentTrial.shape,
      stimulusColor: currentTrial.colorName,
      userResponse: side,
      correctResponse: currentTrial.correctResponse,
      isCorrect,
      reactionTime: Math.round(rt),
      stimulusAppearanceTimestamp: stimulusAppearanceTimestamp.toISOString(),
      responseTimestamp: responseTimestamp.toISOString(),
    };

    setEventLog(prev => [...prev, entry]);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    isCorrect ? sfx.success() : sfx.error();

    setTimeout(scheduleNext, 420);
  };

  // Richer rule display with icons and clearer alignment
  const RuleDisplay = ({ rule }) => {
    if (rule === 'shape') {
      return (
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="text-slate-300 font-medium">Rule: <span className="font-semibold text-cyan-200">Sort by <span className="uppercase">SHAPE</span></span></div>
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="flex items-center gap-3 bg-slate-800/30 px-3 py-2 rounded-full border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-slate-900/40 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-5 h-5"><ShapeSVG shape="circle" color="#60a5fa"/></svg>
              </div>
              <div className="text-sm text-slate-300">Circle / Square</div>
              <div className="text-sm text-cyan-300 font-semibold">← LEFT</div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/30 px-3 py-2 rounded-full border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-slate-900/40 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-5 h-5"><ShapeSVG shape="triangle" color="#f97316"/></svg>
              </div>
              <div className="text-sm text-slate-300">Triangle / Star</div>
              <div className="text-sm text-cyan-300 font-semibold">RIGHT →</div>
            </div>
          </div>
        </div>
      );
    }

    if (rule === 'color') {
      return (
        <div className="mt-3 flex flex-col items-center gap-3">
          <div className="text-slate-300 font-medium">Rule: <span className="font-semibold text-cyan-200">Sort by <span className="uppercase">COLOR</span></span></div>
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="flex items-center gap-3 bg-slate-800/30 px-3 py-2 rounded-full border border-slate-700">
              <div className="w-5 h-5 rounded-full" style={{ background: STIMULI.colorMap.red }} />
              <div className="w-5 h-5 rounded-full" style={{ background: STIMULI.colorMap.blue }} />
              <div className="text-sm text-slate-300">Red / Blue</div>
              <div className="text-sm text-cyan-300 font-semibold">← LEFT</div>
            </div>

            <div className="flex items-center gap-3 bg-slate-800/30 px-3 py-2 rounded-full border border-slate-700">
              <div className="w-5 h-5 rounded-full" style={{ background: STIMULI.colorMap.green }} />
              <div className="w-5 h-5 rounded-full" style={{ background: STIMULI.colorMap.yellow }} />
              <div className="text-sm text-slate-300">Green / Yellow</div>
              <div className="text-sm text-cyan-300 font-semibold">RIGHT →</div>
            </div>
          </div>
        </div>
      );
    }

    // 2-back rule
    return (
      <div className="mt-3 text-center">
        <div className="text-slate-300 font-medium">Rule: <span className="font-semibold text-cyan-200">2-BACK</span></div>
        <div className="mt-2 text-sm text-slate-300 max-w-xl mx-auto">If the current shape matches the shape shown two trials ago, press <span className="font-semibold text-cyan-300">LEFT</span>. Otherwise press <span className="font-semibold text-cyan-300">RIGHT</span>.</div>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-slate-500">
          <div className="px-2 py-1 bg-slate-800/30 rounded">Previous</div>
          <div className="px-2 py-1 bg-slate-800/40 rounded">2-back</div>
          <div className="px-2 py-1 bg-slate-800/30 rounded">Current</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-4xl mx-auto p-6 rounded-2xl bg-black/40 border border-slate-800">
      {showRuleChange ? (
        <div className="text-center p-6">
          <ShieldAlert className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h2 className="text-4xl font-bold text-amber-300">RULE CHANGE</h2>
          <p className="mt-2 text-slate-300">Prepare — new instructions are active.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-slate-800/30 border border-slate-700 text-cyan-300 font-semibold">{currentBlock.name}</div>
            <RuleDisplay rule={currentBlock.rule} />
            <div className="mt-1 text-xs text-slate-500">{currentBlock.timed ? 'Timed Block' : 'Practice — untimed'}</div>
          </div>
          <HUD current={trialIndex} total={currentBlock.trials} timeLeft={timeLeft} />
          <div className="flex flex-col items-center py-6">
            <AnimatePresence mode="wait">
              {currentTrial && (
                <motion.div key={`${blockIndex}-${trialIndex}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 300 }} className="w-56 h-56 md:w-72 md:h-72 rounded-2xl bg-gradient-to-br from-black/40 to-slate-900/40 border border-slate-700 flex items-center justify-center shadow-xl">
                  <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56">
                    <ShapeSVG shape={currentTrial.shape} color={currentTrial.colorValue} />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-4">
            {['left', 'right'].map((side) => {
              const isChosen = feedback && ((feedback === 'correct' && side === currentTrial?.correctResponse) || (feedback === 'incorrect' && side !== currentTrial?.correctResponse));
              const bg = feedback ? (isChosen ? 'bg-green-700' : 'bg-red-800') : 'bg-slate-800';
              const border = feedback ? (isChosen ? 'border-green-400' : 'border-red-400') : 'border-slate-600';
              return (
                <motion.button
                  key={side}
                  onClick={() => handleResponse(side)}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                  className={`w-40 md:w-56 h-20 md:h-24 rounded-xl ${bg} ${border} border-2 flex items-center justify-center text-2xl font-bold text-white shadow-lg`}
                >
                  {side.toUpperCase()}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};

const InsightCard = ({ title, icon, text }) => (
  <div className="bg-gradient-to-br from-black/40 to-slate-900/40 border border-slate-800 p-4 rounded-xl">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-md bg-cyan-900/10 text-cyan-300">{icon}</div>
      <h4 className="font-semibold">{title}</h4>
    </div>
    <p className="text-sm text-slate-300">{text}</p>
  </div>
);

// ---------- METRICS / REPORT ----------
const analyzePerformance = (eventLog) => {
  const timed = eventLog.filter(e => GAME_BLOCKS.find(b => b.key === e.blockKey)?.timed);
  const correctTimed = timed.filter(t => t.isCorrect);
  const avgRT = Math.round(mean(correctTimed.map(t => t.reactionTime)) || 0);
  const rtStd = Math.round(std(correctTimed.map(t => t.reactionTime)) || 0);
  const overallAccuracy = Math.round((timed.filter(t => t.isCorrect).length / (timed.length || 1)) * 100);

  const switchTrialIndices = [];
  for (let i = 1; i < eventLog.length; i++) {
    const prev = eventLog[i - 1];
    const cur = eventLog[i];
    if (prev.blockKey !== cur.blockKey && GAME_BLOCKS.find(b => b.key === cur.blockKey)?.timed) {
      const idxInTimed = timed.findIndex(t => t.trialNumber === cur.trialNumber);
      if (idxInTimed >= 0) switchTrialIndices.push(idxInTimed);
    }
  }

  let totalSwitchCostRT = 0;
  let totalSwitchCostAcc = 0;
  switchTrialIndices.forEach(point => {
    const pre = timed.slice(Math.max(0, point - 3), point);
    const post = timed.slice(point, point + 3);
    const preRT = mean(pre.filter(t => t.isCorrect).map(t => t.reactionTime));
    const postRT = mean(post.filter(t => t.isCorrect).map(t => t.reactionTime));
    const preAcc = (pre.filter(t => t.isCorrect).length / (pre.length || 1)) * 100;
    const postAcc = (post.filter(t => t.isCorrect).length / (post.length || 1)) * 100;
    totalSwitchCostRT += (postRT - preRT) || 0;
    totalSwitchCostAcc += (preAcc - postAcc) || 0;
  });

  const twoBack = eventLog.filter(e => e.blockKey === '2back');
  const twoBackAccuracy = Math.round((twoBack.filter(t => t.isCorrect).length / (twoBack.length || 1)) * 100);

  const accuracyScore = overallAccuracy;
  const speedScore = Math.max(0, Math.min(100, 100 - (avgRT - 300) / 7));
  const consistencyScore = Math.max(0, Math.min(100, 100 - rtStd / 4));
  const flexibilityScore = Math.max(0, Math.min(100, 100 - totalSwitchCostRT / 20));
  const memoryScore = twoBackAccuracy;

  const composite = 0.4 * consistencyScore + 0.3 * flexibilityScore + 0.15 * memoryScore + 0.15 * accuracyScore;
  const adhdIndicator = 86 + (composite / 100) * 6;

  const radarData = [
    { subject: 'Accuracy', A: accuracyScore },
    { subject: 'Speed', A: Math.round(speedScore) },
    { subject: 'Consistency', A: Math.round(consistencyScore) },
    { subject: 'Flexibility', A: Math.round(flexibilityScore) },
    { subject: 'Memory', A: memoryScore },
  ];

  const lineData = timed.map((t, i) => ({ trial: i + 1, RT: t.reactionTime, correct: t.isCorrect }));
  const switchPoints = switchTrialIndices.map(p => ({ trial: p + 1 }));

  const insights = {
    consistency: rtStd > 250 ? 'Your response times were highly variable, which can sometimes indicate fluctuating attention.' : 'Your response times were generally consistent, suggesting stable focus.',
    flexibility: totalSwitchCostRT > 300 ? 'You showed a noticeable drop in speed after the rules changed, a common sign of cognitive inflexibility.' : 'You adapted well to rule changes, showing good cognitive flexibility.',
    memory: twoBackAccuracy < 75 ? 'The memory-focused task proved challenging, which may point to difficulties with working memory.' : 'You demonstrated strong performance on the memory task.'
  };

  return {
    eventLog, radarData, lineData, switchPoints, adhdIndicator,
    avgRT, rtStd, overallAccuracy, twoBackAccuracy, insights,
  };
};

// --- MODIFICATION: Updated report screen with detailed log table ---
const ReportScreen = ({ analysis, onRestart }) => {
  if (!analysis) return null;
  const { radarData, lineData, switchPoints, adhdIndicator, insights, eventLog } = analysis;

  const formatTimestamp = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl w-full mx-auto p-6 rounded-2xl bg-black/40 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-violet-400">Performance Report</h2>
          <p className="text-sm text-slate-400">Summary of executive function metrics and behavioral insights.</p>
        </div>
        <div className="flex gap-3">
          <motion.button whileHover={{ scale: 1.03 }} onClick={onRestart} className="px-4 py-2 rounded-xl bg-slate-700/40 border border-slate-600 flex items-center gap-2"><RotateCcw size={16}/> Play Again</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} onClick={() => downloadJSON(eventLog)} className="px-4 py-2 rounded-xl bg-indigo-600/80 flex items-center gap-2"><Download size={16}/> Export JSON</motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2 h-96 bg-gradient-to-br from-black/50 to-slate-900/40 p-4 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold mb-2">Cognitive Profile</h3>
          <ResponsiveContainer width="100%" height="88%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <Radar name="score" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-3 h-96 bg-gradient-to-br from-black/50 to-slate-900/40 p-4 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold mb-2 text-center">Performance Over Time (RT)</h3>
          <ResponsiveContainer width="100%" height="88%">
            <LineChart data={lineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="trial" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f1724', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="RT" stroke="#8b5cf6" strokeWidth={2} dot={false} />
              {switchPoints.map(p => <ReferenceLine key={p.trial} x={p.trial} stroke="#f59e0b" strokeDasharray="4 4" />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="text-center mb-6 p-6 rounded-xl bg-gradient-to-br from-slate-900/30 to-black/30 border border-slate-800">
        <h3 className="text-sm text-slate-400">Demonstrative ADHD Indicator</h3>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-6xl font-extrabold text-cyan-300 my-2">{adhdIndicator.toFixed(2)}%</motion.div>
        <p className="text-xs text-slate-500">(For demonstration only — not a clinical diagnosis)</p>
      </div>

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4">Behavioral Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard title="Consistency" icon={<GitCommitHorizontal/>} text={insights.consistency} />
          <InsightCard title="Cognitive Flexibility" icon={<Scaling/>} text={insights.flexibility} />
          <InsightCard title="Working Memory" icon={<BrainCircuit/>} text={insights.memory} />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">Detailed Trial Log</h3>
        <div className="max-h-72 overflow-auto bg-gradient-to-br from-black/40 to-slate-900/40 p-1 rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm table-auto">
            <thead className="sticky top-0 bg-slate-900/80 backdrop-blur-sm">
              <tr>
                <th className="p-2">Trial</th>
                <th className="p-2">Block</th>
                <th className="p-2">Stimulus Appeared</th>
                <th className="p-2">Response Clicked</th>
                <th className="p-2">RT (ms)</th>
                <th className="p-2">Result</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {eventLog.map(log => (
                <tr key={log.trialNumber} className="border-t border-slate-800 hover:bg-slate-800/50">
                  <td className="p-2">{log.trialNumber + 1}</td>
                  <td className="p-2">{log.blockName}</td>
                  <td className="p-2 font-mono">{formatTimestamp(log.stimulusAppearanceTimestamp)}</td>
                  <td className="p-2 font-mono">{formatTimestamp(log.responseTimestamp)}</td>
                  <td className="p-2">{log.reactionTime}</td>
                  <td className={`p-2 font-semibold ${log.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {log.isCorrect ? 'Correct' : 'Incorrect'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

// ---------- APP ----------
interface ADHDGameProps {
  onGameComplete?: () => void;
}

const ADHDGame: React.FC<ADHDGameProps> = ({ onGameComplete }) => {
  const [stage, setStage] = useState('start'); // start, game, report
  const [analysis, setAnalysis] = useState(null);

  const handleStart = async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    
    // Test connectivity and userId on game start
    console.log('🎮 ADHD Game starting...');
    const userId = localStorage.getItem('userId');
    console.log('👤 Current userId from localStorage:', userId);
    
    // Test backend connectivity
    try {
      console.log('🌐 Testing backend connectivity...');
      const testResponse = await fetch('http://localhost:5000/api/reports/test');
      console.log('✅ Backend test response:', testResponse.status);
    } catch (error) {
      console.error('❌ Backend connectivity test failed:', error);
    }
    
    setStage('game');
  };

  const handleComplete = (eventLog) => {
    console.log('🎯 ADHD Game handleComplete called!');
    console.log('📊 Event log received in handleComplete:', eventLog);
    console.log('📊 Event log length:', eventLog?.length || 0);
    
    // ALWAYS save the data first before showing analysis
    console.log('💾 Calling saveGameData from handleComplete...');
    saveGameData(eventLog).then(() => {
      console.log('✅ Save completed, now analyzing performance...');
      const a = analyzePerformance(eventLog);
      setAnalysis(a);
      
      // If onGameComplete is provided (game sequence), transition to next game
      // Otherwise show the report screen (standalone mode)
      if (onGameComplete) {
        console.log('🔄 ADHD Game: Transitioning to next game...');
        onGameComplete();
      } else {
        setStage('report');
      }
    }).catch(error => {
      console.error('❌ Save failed, but continuing to analysis:', error);
      const a = analyzePerformance(eventLog);
      setAnalysis(a);
      
      // If onGameComplete is provided (game sequence), transition to next game
      // Otherwise show the report screen (standalone mode)
      if (onGameComplete) {
        console.log('🔄 ADHD Game: Transitioning to next game (after save error)...');
        onGameComplete();
      } else {
        setStage('report');
      }
    });
  };

  const handleRestart = () => {
    setAnalysis(null);
    setStage('start');
  };

  return (
    <div className="min-h-screen antialiased font-sans gradient-bg text-white flex items-center justify-center p-6 relative">
      <ADHDParticleBackground />
      <div className="w-full max-w-6xl relative z-10">
        <AnimatePresence mode="wait">
          {stage === 'start' && <StartScreen onStart={handleStart} key="start" />}
          {stage === 'game' && <GameScreen onComplete={handleComplete} key="game" />}
          {stage === 'report' && <ReportScreen analysis={analysis} onRestart={handleRestart} key="report" />}
        </AnimatePresence>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500">NeuroMatrix</div>
    </div>
  );
};

export default ADHDGame;