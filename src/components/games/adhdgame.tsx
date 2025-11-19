import { BrainCircuit, Activity, Scaling, ShieldAlert, Target, GitCommitHorizontal, CheckCircle, XCircle, Download, RotateCcw, ArrowLeft, ArrowRight, } from 'lucide-react';
import NeonButton from '../ui/NeonButton';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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

// --- Types ---
type Trial = { shape: string; colorName: string; colorValue: string; correctResponse: 'left' | 'right'; isMatch?: boolean };
type EventEntry = {
  trialNumber: number;
  globalTrialNumber?: number;
  blockKey: string;
  blockName: string;
  rule: string;
  stimulusShape: string;
  stimulusColor: string;
  stimulusId?: string;
  userResponse: string;
  correctResponse: 'left' | 'right';
  isCorrect: boolean;
  reactionTime: number;
  stimulusAppearanceTimestamp: string;
  stimulusAppearanceTimestampIST?: string;
  responseTimestamp: string;
  responseTimestampIST?: string;
  isPractice?: boolean;
  expectedMatch?: boolean;
  isMatch?: boolean;
  inputMethod?: string;
};

// --- MODIFICATION: Removed practice block - assessment starts directly ---
const GAME_BLOCKS = [
  { key: 'shape', name: 'Sort by Shape', rule: 'shape', trials: 6, timed: true },
  { key: 'color', name: 'Sort by Color', rule: 'color', trials: 5, timed: true },
  { key: '2back', name: '2-Back Memory', rule: '2-back', trials: 6, timed: true },
];

// ---------- AUDIO ----------
const sfx: { synth: any | null; isInit: boolean; init: () => void; play: (note?: string, dur?: string) => void; success: () => void; error: () => void; sw: () => void } = {
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
const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Save game data to MongoDB (supports guestId or userId)
const saveGameData = async (eventLog: EventEntry[]) => {
  console.log('🎮 ===== STARTING ADHD GAME DATA SAVE =====');

  try {
    const userId = localStorage.getItem('userId');
    const guestId = localStorage.getItem('guestId');
    console.log('👤 userId:', userId, 'guestId:', guestId);

    if (!eventLog || eventLog.length === 0) {
      console.warn('⚠️ No event log data to save');
      return;
    }

    // 1) Always attempt to save raw logs under the user's document (guest or user)
    try {
        const sessionId = localStorage.getItem('gameSessionId') || null;
        // Ensure every entry has level:1 so backend filtering will pick them up
        const normalized = Array.isArray(eventLog) ? eventLog.map(e => ({ ...(e || {}), level: (e && e.level) || 1 })) : [];
        // Only include level-1 entries (frontend filtering) to match DB schema
        let level1Logs = normalized.filter(e => e && e.level === 1);
        // Fallback: if no level-1 logs found but we do have normalized entries, send them all
        if ((!level1Logs || level1Logs.length === 0) && normalized.length > 0) {
          console.warn('No level-1 logs detected; falling back to sending all normalized entries');
          level1Logs = normalized;
        }

        const payload = {
          gameKey: 'adhd',
          logs: level1Logs,
          sessionId,
          guestId: guestId || null,
          userId: userId || null,
        };
      console.log('📤 Sending raw ADHD logs to /api/logs', payload);
      // Debug: print payload before sending to help inspect what the browser actually posts
      try { console.log('[DEBUG] /api/logs payload (adhd):', JSON.stringify(payload).slice(0,2000)); } catch(e) {}
      const logsResp = await fetch('http://localhost:5000/api/logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const respText = await logsResp.text();
      if (!logsResp.ok) console.error('❌ Failed to save ADHD raw logs', logsResp.status, respText);
      else {
        try { const jr = JSON.parse(respText); console.log('✅ ADHD raw logs saved:', jr); }
        catch { console.log('✅ ADHD raw logs saved (non-json response):', respText); }
      }
    } catch (err) {
      console.error('❌ Error saving ADHD raw logs:', err);
    }

    // 2) If userId exists, also send a full report to /api/reports (reportController expects userId)
    if (userId) {
      try {
        const analysis = analyzePerformance(eventLog);
        const gameData = {
          userId,
          gameType: 'NeuroMatrix-ADHD',
          scores: {
            motorControl: 0,
            cognitiveLoad: Math.round(analysis.overallAccuracy * 100),
            stressManagement: Math.max(0, 100 - Math.round(analysis.rtStd / 10)),
            behavioralStability: Math.round(analysis.twoBackAccuracy * 100),
            neuroBalance: Math.round((analysis.overallAccuracy + analysis.twoBackAccuracy) * 50),
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
            totalTime: 60000
          },
          summary: [`ADHD Game completed with ${eventLog.length} trials`],
          aiAnalysis: 'ADHD game performance analysis pending'
        };

        const response = await fetch('http://localhost:5000/api/reports', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gameData)
        });
        if (response.ok) {
          const result = await response.json();
          console.log('✅ ADHD game report saved:', result);
        } else {
          console.error('❌ Failed to save ADHD report', response.status, await response.text());
        }
      } catch (err) {
        console.error('❌ Error sending ADHD report to /api/reports:', err);
      }
    } else {
      console.log('ℹ️ No logged-in user; raw logs were saved under guestId (if present).');
    }
  } catch (err) {
    console.error('❌ Exception occurred while saving ADHD game data:', err);
  }

  console.log('🎮 ===== ADHD GAME DATA SAVE COMPLETE =====');
};

const generateTrial = (rule: string, history: EventEntry[]) : Trial & { isMatch?: boolean } => {
  const shape = rand(STIMULI.shapes);
  const colorName = rand(STIMULI.colors);
  let correctResponse: 'left' | 'right' = 'right';
  let isMatch = false;
  if (rule === 'shape') {
    correctResponse = ['circle', 'square'].includes(shape) ? 'left' : 'right';
  } else if (rule === 'color') {
    correctResponse = ['red', 'blue'].includes(colorName) ? 'left' : 'right';
  } else if (rule === '2-back') {
    // Filter history to only include trials from the current 2-back block
    const twoBackBlockHistory = history.filter((e: EventEntry) => e.blockKey === '2back');
    // Get the trial from 2 positions back in the current block
    const twoBack = twoBackBlockHistory[twoBackBlockHistory.length - 2];
    isMatch = !!(twoBack && twoBack.stimulusShape === shape);
    correctResponse = isMatch ? 'left' : 'right';
  }
  return { shape, colorName, colorValue: STIMULI.colorMap[colorName], correctResponse, isMatch };
};

const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const std = (arr: number[]) => {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) * (x - m), 0) / arr.length);
};

function downloadJSON(data: any, filename = 'neuromatrix_results.json') {
  const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.href = uri;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ---------- UI PRIMITIVES ----------
const ShapeSVG = ({ shape, color }: { shape: string; color: string }) => {
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

const NeuroBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-[#030313] via-[#071126] to-[#050214] opacity-95" />
    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g1" x1="0" x2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.06" />
        </linearGradient>
      </defs>
      <g stroke="url(#g1)" strokeWidth="1" fill="none">
        <path d="M20 80 L200 80 L200 200" />
        <path d="M120 0 L120 220 L620 220 L620 360 L780 360" />
        <path d="M0 480 L360 480 L360 520 L760 520" />
      </g>
    </svg>

    <div className="pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 35 }).map((_, i) => (
          <circle
            key={i}
            cx={`${Math.random() * 100}`}
            cy={`${Math.random() * 100}`}
            r={`${Math.random() * 0.7 + 0.2}`}
            fill={Math.random() > 0.6 ? '#06b6d4' : '#a78bfa'}
            opacity={Math.random() * 0.7 + 0.1}
          />
        ))}
      </svg>
    </div>

    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0ea5a4]/10 via-transparent to-[#f97316]/04" />
  </div>
);

// ---------- SCREENS ----------

const StartScreen = ({ onStart }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl w-full mx-auto p-8 rounded-2xl border border-slate-800 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-full bg-gradient-to-br from-cyan-600/30 to-violet-600/30 shadow-xl">
          <BrainCircuit className="w-12 h-12 text-cyan-300" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-violet-400">NeuroMatrix</h1>
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

const FinishButton: React.FC = () => {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleFinish = async () => {
    if (busy || done) return;
    setBusy(true);
    try {
      const userId = localStorage.getItem('userId');
      const guestId = localStorage.getItem('guestId');
      const sessionId = localStorage.getItem('gameSessionId') || null;
      // Include explicit end timestamp and isEnd flag so backend can record session end
      const payload: any = { end: true, gameKey: 'adhd', sessionId, isEnd: true, endTime: new Date().toISOString() };
      if (userId) payload.userId = userId; else if (guestId) payload.guestId = guestId;
      const resp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (resp.ok) {
        setDone(true);
        console.log('Session end recorded via Finish button');
      } else {
        console.warn('Failed to record session end:', resp.status, await resp.text());
      }
    } catch (e) {
      console.error('Error calling finish endpoint:', e);
    } finally { setBusy(false); }
  };

  return (
    <NeonButton id="finish-assessment-button" onClick={handleFinish} disabled={busy || done} variant={done ? 'secondary' : 'primary'}>
      {done ? 'Finished' : (busy ? 'Finishing...' : 'Finish Assessment')}
    </NeonButton>
  );
};

const GameScreen = ({ onComplete }) => {
  const [blockIndex, setBlockIndex] = useState(0);
  const [trialIndex, setTrialIndex] = useState<number>(0);
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [eventLog, setEventLog] = useState<EventEntry[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showRuleChange, setShowRuleChange] = useState<boolean>(false);
  const startRef = useRef<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [gameStartTime] = useState<number>(Date.now());
  // Diagnostics refs for input detection
  const inputMethodRef = useRef<'keyboard'|'mouse'|'touch'|'unknown'>('unknown');
  const finishedRef = useRef(false);
  // Pre-generated trials for blocks that need deterministic sequences (e.g., 2-back)
  const preGenRef = useRef<Record<string, Trial[]>>({});

  // Pre-generate 2-back sequences so the block has exactly N trials and predictable behavior
  useEffect(() => {
    const key = currentBlock.key;
    // reset finished guard when entering a block
    finishedRef.current = false;
    // Only pre-generate for 2-back
    if (currentBlock.rule === '2-back') {
      if (!preGenRef.current[key] || preGenRef.current[key].length !== currentBlock.trials) {
        const n = currentBlock.trials;
        const seq: Trial[] = [];
        for (let i = 0; i < n; i++) {
          if (i < 2) {
            const shape = rand(STIMULI.shapes);
            const colorName = rand(STIMULI.colors);
            seq.push({ shape, colorName, colorValue: STIMULI.colorMap[colorName], correctResponse: 'right', isMatch: false });
            continue;
          }
          // Decide match probability (30% matches)
          const makeMatch = Math.random() < 0.3;
          let shape: string;
          let colorName: string;
          if (makeMatch) {
            const twoBack = seq[i - 2];
            shape = twoBack.shape;
            colorName = twoBack.colorName;
            seq.push({ shape, colorName, colorValue: STIMULI.colorMap[colorName], correctResponse: 'left', isMatch: true });
          } else {
            // choose a shape that's not equal to the 2-back shape to avoid accidental match
            const forbidden = seq[i - 2].shape;
            const choices = STIMULI.shapes.filter(s => s !== forbidden);
            shape = rand(choices);
            colorName = rand(STIMULI.colors);
            seq.push({ shape, colorName, colorValue: STIMULI.colorMap[colorName], correctResponse: 'right', isMatch: false });
          }
        }
        preGenRef.current[key] = seq;
      }
    } else {
      // clear pregen for other blocks
      if (preGenRef.current[currentBlock.key]) delete preGenRef.current[currentBlock.key];
    }
  }, [blockIndex]);

  useEffect(() => {
    sfx.init();
  }, []);

  // detect input method (pointer/touch/keyboard)
  useEffect(() => {
    const onPointer = (ev: any) => {
      try {
        if (ev && ev.pointerType === 'touch') inputMethodRef.current = 'touch';
        else if (ev && ev.pointerType === 'mouse') inputMethodRef.current = 'mouse';
        else inputMethodRef.current = 'mouse';
      } catch (e) { inputMethodRef.current = 'unknown'; }
    };
    const onTouch = () => { inputMethodRef.current = 'touch'; };
    const onKey = () => { inputMethodRef.current = 'keyboard'; };
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('touchstart', onTouch);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Reset timer to 20 seconds when block changes
  useEffect(() => {
    setTimeLeft(20);
  }, [blockIndex]);

  useEffect(() => {
    // Timer countdown for current block
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (showRuleChange) return prev; // Don't countdown during rule change
        
        if (prev <= 1) {
          clearInterval(timer);
          console.log('⏰ Block time expired');
          // If this is the last block, complete the game
          if (blockIndex >= GAME_BLOCKS.length - 1) {
            console.log('⏰ All blocks time expired — completing ADHD game...');
            setTimeout(() => {
              console.log('⏰ TIMEOUT: Calling onComplete with eventLog:', eventLog);
              onComplete(eventLog);
            }, 200);
            return 0;
          }
          // Otherwise advance to the next block
          setBlockIndex(b => b + 1);
          setTrialIndex(0);
          setShowRuleChange(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showRuleChange, eventLog, onComplete, blockIndex]);

  const currentBlock = GAME_BLOCKS[blockIndex];

  useEffect(() => {
    if (showRuleChange) return;
    // If we have pre-generated trials for this block (e.g. 2back), use them
    const pre = preGenRef.current[currentBlock.key];
    if (pre && Array.isArray(pre) && typeof trialIndex === 'number') {
      const t = pre[trialIndex];
      setCurrentTrial(t || generateTrial(currentBlock.rule, eventLog));
      startRef.current = performance.now();
      return;
    }

    // Otherwise generate on-the-fly
    const t = generateTrial(currentBlock.rule, eventLog);
    setCurrentTrial(t);
    startRef.current = performance.now();
  }, [blockIndex, trialIndex, showRuleChange, currentBlock.rule, eventLog]);

  const scheduleNext = useCallback(() => {
    setFeedback(null);
    
    // Check if we've completed all trials in current block
    if (trialIndex + 1 >= currentBlock.trials) {
      // Current block is complete
      if (blockIndex >= GAME_BLOCKS.length - 1) {
        // All blocks complete
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
      // Move to next block
      setBlockIndex(b => b + 1);
      setTrialIndex(0);
      setShowRuleChange(true);
      sfx.sw();
      return;
    }
    // Continue to next trial in current block
    setTrialIndex(t => t + 1);
  }, [trialIndex, blockIndex, currentBlock.trials, onComplete, eventLog]);

  useEffect(() => {
    if (!showRuleChange) return;
    const id = setTimeout(() => setShowRuleChange(false), 1800);
    return () => clearTimeout(id);
  }, [showRuleChange]);

  const handleResponse = (side: 'left' | 'right') => {
    if (!currentTrial || feedback) return;
    
    // --- MODIFICATION: Capture high-precision timestamps ---
    const responsePerfTime = performance.now();
    const start = startRef.current ?? responsePerfTime;
    const rt = responsePerfTime - start;
    const responseTimestamp = new Date();
    const stimulusAppearanceTimestamp = new Date(responseTimestamp.getTime() - rt);
    
    const isCorrect = side === currentTrial.correctResponse;

    // Mark first 2 trials in 2-back block as practice
    const isPractice = currentBlock.rule === '2-back' && trialIndex < 2;

    // include both per-block trial index and a global ordinal
    const blockTrialNumber = trialIndex;
    const globalTrialNumber = eventLog.length;

    const entry: any = {
      level: 1,
      trialNumber: blockTrialNumber,       // per-block trial index (0-based)
      globalTrialNumber,                   // global across blocks
      blockKey: currentBlock.key,
      blockName: currentBlock.name,
      rule: currentBlock.rule,
      stimulusShape: currentTrial.shape,
      stimulusColor: currentTrial.colorName,
      stimulusId: `${currentTrial.shape}_${currentTrial.colorName}`,
      userResponse: side,
      correctResponse: currentTrial.correctResponse,
      isCorrect,
      reactionTime: Math.round(rt),
      stimulusAppearanceTimestamp: stimulusAppearanceTimestamp.toISOString(),
      responseTimestamp: responseTimestamp.toISOString(),
      // IST timestamps for immediate local readability
      stimulusAppearanceTimestampIST: stimulusAppearanceTimestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }),
      responseTimestampIST: responseTimestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }),
      isPractice, // Add practice flag
    };

    // 2-back specific: include expected match flag and whether it was a match
    if (currentBlock.rule === '2-back') {
      entry.expectedMatch = !!(currentTrial as any).isMatch;
      entry.isMatch = entry.expectedMatch; // same semantics: expected == actual match condition
    }

    // attach observed input method when responding
    (entry as any).inputMethod = inputMethodRef.current || 'unknown';

    // Build new event log for immediate checks (state update follows)
    const newEventLog = [...eventLog, entry];
    setEventLog(newEventLog);
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    isCorrect ? sfx.success() : sfx.error();

    // If this was the last trial of the last block, finish immediately (guard double-calls)
    const lastBlockIndex = GAME_BLOCKS.length - 1;
    const isLastBlock = blockIndex === lastBlockIndex;
    const isLastTrialInBlock = trialIndex === (currentBlock.trials - 1);
    if (isLastBlock && isLastTrialInBlock && !finishedRef.current) {
      finishedRef.current = true;
      console.log('🏁 Last trial answered — completing ADHD game from handleResponse');
      setTimeout(() => {
        try {
          onComplete(newEventLog);
        } catch (e) {
          console.error('Error during onComplete:', e);
        }
      }, 500);
      return;
    }

    // Otherwise continue as before
    setTimeout(scheduleNext, 420);
  };

  const ruleDisplay = useMemo(() => {
    if (currentBlock.rule === 'shape') {
      return (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-cyan-500/30">
            <span className="text-cyan-300">⚪ ⬜</span>
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-cyan-200 font-semibold">LEFT</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-lg border border-orange-500/30">
            <span className="text-orange-300">▲ ⭐</span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-200 font-semibold">RIGHT</span>
          </div>
        </div>
      );
    }
    if (currentBlock.rule === 'color') {
      return (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500/20 to-blue-500/20 rounded-lg border border-blue-500/30">
            <span className="text-red-400">🔴</span>
            <span className="text-blue-400">🔵</span>
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-200 font-semibold">LEFT</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-yellow-500/20 rounded-lg border border-yellow-500/30">
            <span className="text-green-400">🟢</span>
            <span className="text-yellow-400">🟡</span>
            <ArrowRight className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-200 font-semibold">RIGHT</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-emerald-500/30">
          <span className="text-emerald-300">✓ Same</span>
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-200 font-semibold">LEFT</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-500/20 to-gray-500/20 rounded-lg border border-gray-500/30">
          <span className="text-gray-300">✗ Different</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-200 font-semibold">RIGHT</span>
        </div>
      </div>
    );
  }, [currentBlock.rule]);

  return (
    <div>
      {showRuleChange ? (
        <div className="text-center p-6">
          <ShieldAlert className="w-16 h-16 mx-auto text-amber-400 mb-4" />
          <h2 className="text-4xl font-bold text-amber-300">RULE CHANGE</h2>
          <p className="mt-2 text-slate-300">Prepare — new instructions are active.</p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-center">
            <div className="inline-block px-4 py-2 rounded-full border border-slate-700 text-cyan-300 font-semibold">{currentBlock.name}</div>
            <div className="mt-4">{ruleDisplay}</div>
            <div className="mt-1 text-xs text-slate-500">Timed Block</div>
          </div>
          <HUD current={trialIndex} total={currentBlock.trials} timeLeft={timeLeft} />
          <div className="flex flex-col items-center py-6">
            <AnimatePresence mode="wait">
              {currentTrial && (
                <motion.div key={`${blockIndex}-${trialIndex}`} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: 'spring', stiffness: 300 }} className="w-56 h-56 md:w-72 md:h-72 rounded-2xl border border-slate-700 flex items-center justify-center shadow-xl">
                  <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-56 md:h-56">
                    <ShapeSVG shape={currentTrial.shape} color={currentTrial.colorValue} />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex gap-4 justify-center mt-4">
            {['left', 'right'].map((side) => {
              const isChosen = feedback && ((feedback === 'correct' && side === currentTrial?.correctResponse) || (feedback === 'incorrect' && side !== currentTrial?.correctResponse));
              const bg = feedback ? (isChosen ? 'bg-green-700' : 'bg-red-800') : 'bg-slate-800';
              const border = feedback ? (isChosen ? 'border-green-400' : 'border-red-400') : 'border-slate-600';
              return (
                <motion.button
          key={side}
            onClick={() => handleResponse(side as 'left' | 'right')}
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
    </div>
  );
};

const InsightCard = ({ title, icon, text }: { title: string; icon: React.ReactNode; text: string }) => (
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
  // Filter out practice trials (first 2 trials in 2-back block)
  const nonPractice = eventLog.filter(e => !e.isPractice);
  const timed = nonPractice.filter(e => GAME_BLOCKS.find(b => b.key === e.blockKey)?.timed);
  const correctTimed = timed.filter(t => t.isCorrect);
  const avgRT = Math.round(mean(correctTimed.map(t => t.reactionTime)) || 0);
  const rtStd = Math.round(std(correctTimed.map(t => t.reactionTime)) || 0);
  const overallAccuracy = Math.round((timed.filter(t => t.isCorrect).length / (timed.length || 1)) * 100);

  const switchTrialIndices = [];
  for (let i = 1; i < nonPractice.length; i++) {
    const prev = nonPractice[i - 1];
    const cur = nonPractice[i];
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

  // Only count non-practice trials for 2-back accuracy
  const twoBack = nonPractice.filter(e => e.blockKey === '2back');
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
const ReportScreen = ({ analysis, onRestart }: { analysis: any; onRestart: () => void }) => {
  // Allow ReportScreen to render even if analysis is not yet available so the Finish
  // Assessment button can be shown immediately after game completion.
  const radarData = analysis?.radarData || [];
  const lineData = analysis?.lineData || [];
  const switchPoints = analysis?.switchPoints || [];
  const adhdIndicator = analysis?.adhdIndicator || 0;
  const insights = analysis?.insights || { consistency: '', flexibility: '', memory: '' };
  const eventLog = analysis?.eventLog || [];

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    } as Intl.DateTimeFormatOptions);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl w-full mx-auto p-6 rounded-2xl bg-black/40 border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-violet-400">Performance Report</h2>
          <p className="text-sm text-slate-400">Summary of executive function metrics and behavioral insights.</p>
        </div>
        <div className="flex gap-3">
          <NeonButton onClick={onRestart} variant="secondary" size="md"><RotateCcw size={16}/> Play Again</NeonButton>
          <NeonButton onClick={() => downloadJSON(eventLog)} variant="primary" size="md"><Download size={16}/> Export JSON</NeonButton>
          <FinishButton />
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
              {switchPoints.map((p: { trial: number }) => <ReferenceLine key={p.trial} x={p.trial} stroke="#f59e0b" strokeDasharray="4 4" />)}
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
              {eventLog.map((log: EventEntry) => (
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
  const [analysis, setAnalysis] = useState<any>(null);

  const handleStart = async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    
    // Test connectivity and userId on game start
    console.log('🎮 ADHD Game starting...');
    const userId = localStorage.getItem('userId');
    console.log('👤 Current userId from localStorage:', userId);
    
    // Check play availability (enforce server-side play limits earlier)
    try {
      const guestId = localStorage.getItem('guestId');

      // Ensure a fresh sessionId is generated for this play-through so the backend
      // records exactly one session per game. Overwrite any existing session id.
      const newSessionId = `adhd_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
      localStorage.setItem('gameSessionId', newSessionId);

      const checkPayload: any = { checkOnly: true };
      if (userId) checkPayload.userId = userId;
      else if (guestId) checkPayload.guestId = guestId;
      // include sessionId for server-side correlation (optional)
      checkPayload.sessionId = newSessionId;

      console.log('🌐 Checking play availability before starting...', checkPayload);
      const checkResp = await fetch('http://localhost:5000/api/logs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checkPayload)
      });
      if (checkResp.ok) {
        console.log('✅ Play allowed — creating session and starting game');
        // Create a new session on server (Start Assessment pressed)
        try {
          const startPayload: any = { start: true };
          if (userId) startPayload.userId = userId; else if (guestId) startPayload.guestId = guestId;
          startPayload.gameKey = 'adhd';
          // Provide the sessionId we generated so backend will create/find the single session
          startPayload.sessionId = newSessionId;
          const startResp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(startPayload) });
          if (startResp.ok) {
            const jr = await startResp.json().catch(() => null);
            if (jr && jr.sessionId) localStorage.setItem('gameSessionId', jr.sessionId);
            if (jr && jr.sessionNumber) localStorage.setItem('gameSessionNumber', String(jr.sessionNumber));
          }
        } catch (e) { console.warn('Failed to create session on start:', e); }
        setStage('game');
      } else {
        const txt = await checkResp.json().catch(() => ({}));
        const msg = txt && txt.message ? txt.message : 'You are not allowed to play at this time.';
        const next = txt && txt.nextAllowedAt ? ` Next allowed at: ${txt.nextAllowedAt}` : '';
        alert(msg + next);
      }
    } catch (error) {
      console.error('❌ Play availability check failed, proceeding to start anyway:', error);
      setStage('game');
    }
  };

  const handleComplete = (eventLog: EventEntry[]) => {
    console.log('🎯 ADHD Game handleComplete called!');
    console.log('📊 Event log received in handleComplete:', eventLog);
    console.log('📊 Event log length:', eventLog?.length || 0);
    
      // Build additional telemetry requested: false positives/negatives, hyperspeed, idle, RT drift, error clusters, decision latency, input method
      const telemetry = {} as any;
      // Per-trial RT series
      const rtSeries = (eventLog || []).map((e: any, idx: number) => ({ trialIndex: idx, trialNumber: e.trialNumber, blockKey: e.blockKey, reactionTime: e.reactionTime, stimulusTime: e.stimulusAppearanceTimestamp, responseTime: e.responseTimestamp, isCorrect: e.isCorrect }));
      telemetry.rtSeries = rtSeries;

      // Hyper-speed responses (<200ms)
      telemetry.hyperSpeed = rtSeries.filter((r: any) => typeof r.reactionTime === 'number' && r.reactionTime < 200).map((r: any) => ({ trialIndex: r.trialIndex, trialNumber: r.trialNumber, reactionTime: r.reactionTime, responseTime: r.responseTime }));

      // False negatives: expected trials per block vs recorded
      const falseNegatives: any[] = [];
      for (const b of GAME_BLOCKS) {
        const recorded = (eventLog || []).filter(e => e.blockKey === b.key && !e.isPractice);
        if (recorded.length < b.trials) {
          falseNegatives.push({ blockKey: b.key, expected: b.trials, recorded: recorded.length, missing: b.trials - recorded.length });
        }
      }
      telemetry.falseNegatives = falseNegatives;

      // False positives: here we infer 'commission' errors as responses that are incorrect on trials where response was not expected.
      // The ADHD task doesn't explicitly include explicit No-Go trials in this implementation, so this will be empty unless a rule indicates withholding.
      const falsePositives: any[] = [];
      // Keep backwards-compatible: detect any trials with userResponse present but correctResponse === null (none in current impl)
      for (const e of (eventLog || [])) {
        if (e.userResponse && (e.correctResponse === null || e.correctResponse === undefined) && !e.isPractice) {
          falsePositives.push({ trialNumber: e.trialNumber, blockKey: e.blockKey, responseTime: e.responseTimestamp, reactionTime: e.reactionTime });
        }
      }
      telemetry.falsePositives = falsePositives;

      // Idle/inactivity: gaps >5s between consecutive responses or between response->next stimulus
      const idleSegments: any[] = [];
      const toMs = (iso?: string) => iso ? new Date(iso).getTime() : null;
      for (let i = 0; i < (eventLog || []).length - 1; i++) {
        const cur = eventLog[i];
        const next = eventLog[i + 1];
        const curResp = toMs(cur.responseTimestamp);
        const nextStim = toMs(next.stimulusAppearanceTimestamp);
        if (curResp && nextStim) {
          const gap = nextStim - curResp;
          if (gap > 5000) {
            idleSegments.push({ start: new Date(curResp + 1).toISOString(), durationSec: Math.round(gap / 1000), betweenTrials: [cur.trialNumber, next.trialNumber] });
          }
        }
      }
      // note: no reliable global gameStartTime available here; skip initial idle-from-start detection
      telemetry.idleSegments = idleSegments;

      // Reaction time drift: avg, std, slope (linear regression)
      const rts = rtSeries.map((r: any) => (typeof r.reactionTime === 'number' ? r.reactionTime : null)).filter((v: any) => v !== null);
      telemetry.rtStats = { avg: Math.round(mean(rts)), std: Math.round(std(rts)), count: rts.length };
      // simple slope via least-squares
      if (rts.length > 1) {
        const n = rts.length;
        const x = Array.from({ length: n }, (_, i) => i + 1);
        const xm = mean(x);
        const ym = mean(rts);
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) { num += (x[i] - xm) * (rts[i] - ym); den += (x[i] - xm) * (x[i] - xm); }
        telemetry.rtTrend = { slope: den !== 0 ? num / den : 0 };
      } else telemetry.rtTrend = { slope: 0 };

      // Error clustering: consecutive incorrect trials within <=5s
      const errorClusters: any[] = [];
      let cluster: string[] = [];
      for (let i = 0; i < (eventLog || []).length; i++) {
        const e = eventLog[i];
        if (!e.isCorrect) {
          const t = toMs(e.responseTimestamp) || toMs(e.stimulusAppearanceTimestamp) || Date.now();
          if (cluster.length === 0) cluster.push(new Date(t).toISOString());
          else {
            const prev = new Date(cluster[cluster.length - 1]).getTime();
            if (t - prev <= 5000) cluster.push(new Date(t).toISOString());
            else { if (cluster.length) errorClusters.push([...cluster]); cluster = [new Date(t).toISOString()]; }
          }
        }
      }
      if (cluster.length) errorClusters.push(cluster);
      telemetry.errorClusters = errorClusters;

      // Decision latency per trial is already RT, so include as array
      telemetry.decisionLatencies = rtSeries.map((r: any) => ({ trialIndex: r.trialIndex, trialNumber: r.trialNumber, decisionLatencyMs: r.reactionTime }));

  // Input method: infer most frequent inputMethod recorded per trial (entries may include inputMethod)
  const inputCounts = (eventLog || []).reduce((acc: any, e: any) => { const im = e && e.inputMethod ? e.inputMethod : 'unknown'; acc[im] = (acc[im] || 0) + 1; return acc; }, {});
  let most = 'unknown'; let mostC = 0;
  Object.keys(inputCounts).forEach(k => { if (inputCounts[k] > mostC) { most = k; mostC = inputCounts[k]; }});
  telemetry.inputMethod = most;

      // Build telemetry entry to append to logs (preserve existing entries)
          const telemetryEntry = { level: 1, eventType: 'adhd_telemetry', telemetry, createdAt: new Date().toISOString() };

          // Create a session end entry so the backend has an explicit end marker and timestamp
          const sessionId = localStorage.getItem('gameSessionId') || null;
          const userId = localStorage.getItem('userId') || null;
          const guestId = localStorage.getItem('guestId') || null;
          const endEntry = {
            level: 1,
            eventType: 'session_end',
            isEnd: true,
            endTime: new Date().toISOString(),
            gameKey: 'adhd',
            sessionId,
            userId,
            guestId,
            createdAt: new Date().toISOString(),
          };

      console.log('💾 Calling saveGameData from handleComplete with telemetry and session end...');
      const augmented = Array.isArray(eventLog) ? [...eventLog, telemetryEntry, endEntry] : [telemetryEntry, endEntry];

      // Show report screen immediately so Finish button is available right away.
      if (!onGameComplete) setStage('report');

      saveGameData(augmented as any).then(async () => {
      console.log('✅ Save completed, now analyzing performance...');

      // Tell backend to finalize the game/session by sending end:true so helper paths run
      try {
        const endPayload: any = { end: true, gameKey: 'adhd', sessionId };
        if (userId) endPayload.userId = userId; else if (guestId) endPayload.guestId = guestId;
        const endResp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(endPayload) });
        if (endResp.ok) console.log('✅ End flag posted to backend');
        else console.warn('⚠️ End flag POST failed:', endResp.status, await endResp.text());
      } catch (e) { console.warn('⚠️ End flag POST error:', e); }

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
    }).catch(async (error) => {
      console.error('❌ Save failed, but continuing to analysis:', error);

      // Even if save failed, still attempt to mark end so backend session flags get set
      try {
        const endPayload: any = { end: true, gameKey: 'adhd', sessionId };
        if (userId) endPayload.userId = userId; else if (guestId) endPayload.guestId = guestId;
        const endResp = await fetch('http://localhost:5000/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(endPayload) });
        if (endResp.ok) console.log('✅ End flag posted to backend (after save error)');
        else console.warn('⚠️ End flag POST failed (after save error):', endResp.status, await endResp.text());
      } catch (e) { console.warn('⚠️ End flag POST error (after save error):', e); }

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
    <div className="min-h-screen antialiased font-sans text-white flex items-center justify-center p-6 relative">
      <ADHDParticleBackground />
      <div className="w-full max-w-6xl">
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