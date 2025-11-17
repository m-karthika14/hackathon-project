// Neuro-Cognitive Response Test v3
// Single-file React app with downloadable JSON report and updated background visuals.
// Dependencies: react, framer-motion, recharts

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* -------------------- CONFIG & STIMULI -------------------- */
const TOTAL_TRIALS = 5;
const COLOR_LABELS = ["Red", "Blue", "Green", "Yellow"];

const BASE_STIMULI = [
  { id: "river", image: "https://i.postimg.cc/fLtYJkS8/one.jpg", alt: "Calm river", type: "Calm", sound: "ambulance-siren" },
  { id: "book", image: "https://i.postimg.cc/jqyJ9pHn/two.jpg", alt: "Open book", type: "Calm", sound: "scream-of-fear" },
  { id: "forest", image: "https://i.postimg.cc/5yJjbtBY/three.jpg", alt: "Sunlit forest trail", type: "Calm", sound: "crowd-talking" },
  { id: "mountain", image: "https://i.postimg.cc/NfpLvB5F/four.jpg", alt: "Snowy mountain peak", type: "Calm", sound: "police-siren" },
  { id: "stop", image: "https://i.postimg.cc/nz4cRtyH/road.avif", alt: "An abstract image suggesting a command to stop", type: "Sudden", sound: "car-accident" },
];

/* -------------------- HELPER UTILITIES -------------------- */

function shuffleArray(arr: any[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateSequence(rounds = TOTAL_TRIALS) {
  // For exactly 5 trials, use each of the 5 base stimuli exactly once
  const seq = [];
  const shuffledStimuli = shuffleArray([...BASE_STIMULI]);
  
  for (let i = 0; i < Math.min(rounds, BASE_STIMULI.length); i++) {
    seq.push({ 
      ...shuffledStimuli[i], 
      labelColor: COLOR_LABELS[Math.floor(Math.random() * COLOR_LABELS.length)], 
      index: i 
    });
  }
  
  return seq;
}

/* -------------------- AUDIO ENGINE -------------------- */

class SoundEngine {
  private ctx: AudioContext | null;
  private master: GainNode | null;
  private audioElements: Map<string, HTMLAudioElement>;

  constructor() { 
    this.ctx = null; 
    this.master = null;
    this.audioElements = new Map();
    this.loadAudioFiles();
  }

  loadAudioFiles() {
    const audioFiles = {
      'ambulance-siren': '/noise/ambulance-siren-364900.mp3',
      'scream-of-fear': '/noise/scream-of-fear-402823.mp3',
      'crowd-talking': '/noise/crowd-talking-138493.mp3',
      'police-siren': '/noise/police-siren-99029.mp3',
      'car-accident': '/noise/car-accident-with-squeal-and-crash-6054.mp3'
    };

    // Preload audio files
    Object.entries(audioFiles).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.volume = 0.25; // Set volume to 25%
      audio.preload = 'auto';
      this.audioElements.set(key, audio);
    });
  }

  ensure() { 
    if (!this.ctx) { 
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext; 
      this.ctx = new AudioContext(); 
      this.master = this.ctx.createGain(); 
      this.master.gain.value = 0.25; // Set master volume to 25%
      this.master.connect(this.ctx.destination); 
    } 
  }

  playAudioFile(key: string) {
    const audio = this.audioElements.get(key);
    if (audio) {
      audio.currentTime = 0; // Reset to beginning
      audio.volume = 0.25; // Ensure 25% volume
      audio.play().catch((error: any) => {
        console.warn('Failed to play audio:', error);
      });
    } else {
      console.warn('Audio file not found for key:', key);
    }
  }

  // Keep the original methods as fallbacks
  playSoft(duration = 1.0) { this.ensure(); if (!this.ctx || !this.master) return; const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = "sine"; o.frequency.value = 440; g.gain.value = 0.001; o.connect(g); g.connect(this.master); const now = this.ctx.currentTime; g.gain.setValueAtTime(0.001, now); g.gain.exponentialRampToValueAtTime(0.03, now + duration * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, now + duration); o.start(now); o.stop(now + duration + 0.05); }
  playVehicleRacing(duration = 1.5) { this.ensure(); if (!this.ctx || !this.master) return; const now = this.ctx.currentTime; const noise = this.ctx.createBufferSource(); const bufferSize = this.ctx.sampleRate * duration; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; } noise.buffer = buffer; const bandpass = this.ctx.createBiquadFilter(); bandpass.type = 'bandpass'; bandpass.frequency.value = 800; bandpass.Q.value = 15; const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.3, now + 0.1); gain.gain.linearRampToValueAtTime(0, now + duration); noise.connect(bandpass).connect(gain).connect(this.master); bandpass.frequency.setValueAtTime(200, now); bandpass.frequency.linearRampToValueAtTime(1500, now + duration * 0.7); noise.start(now); noise.stop(now + duration); }
  playPoliceSiren(duration = 1.2) { this.ensure(); if (!this.ctx || !this.master) return; const now = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); const lfo = this.ctx.createOscillator(); lfo.type = "sine"; lfo.frequency.value = 5; const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 300; lfo.connect(lfoGain).connect(osc.frequency); osc.frequency.value = 800; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.25, now + 0.1); gain.gain.linearRampToValueAtTime(0, now + duration); osc.connect(gain).connect(this.master); osc.start(now); lfo.start(now); osc.stop(now + duration); lfo.stop(now + duration); }
  playMaleStop(duration = 0.5) { this.ensure(); if (!this.ctx || !this.master) return; const now = this.ctx.currentTime; const noise = this.ctx.createBufferSource(); const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; noise.buffer = buffer; const noiseFilter = this.ctx.createBiquadFilter(); noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 3000; noiseFilter.Q.value = 20; const noiseGain = this.ctx.createGain(); noiseGain.gain.setValueAtTime(0.4, now); noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); noise.connect(noiseFilter).connect(noiseGain).connect(this.master); const vowel = this.ctx.createOscillator(); vowel.type = 'sawtooth'; vowel.frequency.setValueAtTime(150, now); const vowelFilter = this.ctx.createBiquadFilter(); vowelFilter.type = 'lowpass'; vowelFilter.frequency.value = 1000; const vowelGain = this.ctx.createGain(); vowelGain.gain.setValueAtTime(0, now + 0.05); vowelGain.gain.linearRampToValueAtTime(0.4, now + 0.1); vowelGain.gain.exponentialRampToValueAtTime(0.001, now + duration); vowel.connect(vowelFilter).connect(vowelGain).connect(this.master); noise.start(now); noise.stop(now + 0.1); vowel.start(now); vowel.stop(now + duration); }
  playThunder(duration = 1.4) { this.ensure(); if (!this.ctx || !this.master) return; const now = this.ctx.currentTime; const noise = this.ctx.createBufferSource(); const bufferSize = this.ctx.sampleRate * duration; const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate); const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize); } noise.buffer = buffer; const filter = this.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1000; const gain = this.ctx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.5, now + 0.05); gain.gain.exponentialRampToValueAtTime(0.001, now + duration); noise.connect(filter).connect(gain).connect(this.master); filter.frequency.setValueAtTime(1000, now); filter.frequency.exponentialRampToValueAtTime(100, now + duration * 0.7); noise.start(now); noise.stop(now + duration); }
  
  playForKey(key: string) { 
    // First try to play the audio file
    if (['ambulance-siren', 'scream-of-fear', 'crowd-talking', 'police-siren', 'car-accident'].includes(key)) {
      this.playAudioFile(key);
    } else {
      // Fallback to generated sounds
      switch (key) { 
        case "soft": this.playSoft(); break; 
        case "vehicleRacing": this.playVehicleRacing(); break; 
        case "policeSiren": this.playPoliceSiren(); break; 
        case "maleStop": this.playMaleStop(); break; 
        case "thunder": this.playThunder(); break; 
        default: this.playSoft(); 
      }
    }
  }

  stopAllAudio() {
    console.log('🔇 Stopping all PTSD game audio...');
    
    // Stop all HTML audio elements
    this.audioElements.forEach((audio, key) => {
      console.log(`🔇 Stopping audio: ${key}`);
      audio.pause();
      audio.currentTime = 0;
    });

    // Stop web audio context if it exists
    if (this.ctx && this.ctx.state === 'running') {
      console.log('🔇 Suspending Web Audio Context...');
      this.ctx.suspend();
    }

    console.log('✅ All PTSD game audio stopped');
  }
}

/* -------------------- BACKGROUND ANIMATION -------------------- */

function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const bgParticlesRef = useRef<any[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const bg = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      bg.push({ x, y, vx: -0.1 + Math.random() * 0.2, vy: 0.5 + Math.random() * 1, radius: 0.5 + Math.random() * 1.5, hue: 200 + Math.random() * 50, 
        // --- THIS IS THE MODIFIED LINE FOR TRANSPARENCY ---
        alpha: 0.1 + Math.random() * 0.2, // More transparent: Range is now 0.1 to 0.3
        phase: Math.random() * Math.PI * 2 
      });
    }
    bgParticlesRef.current = bg;

    function draw() {
      const canvas = canvasRef.current; if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width = window.innerWidth;
      const h = canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      bgParticlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.y > h + p.radius) { p.y = -p.radius; p.x = Math.random() * w; }
        if (p.x < 0 || p.x > w) { p.vx *= -1; }
        const glow = Math.sin(performance.now() * 0.002 + p.phase) * 0.5 + 0.5;
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
        gradient.addColorStop(0, `hsla(${p.hue}, 90%, 80%, ${p.alpha * glow})`);
        gradient.addColorStop(1, `hsla(${p.hue}, 90%, 80%, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
      particlesRef.current.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.03; p.life -= 1; const alpha = Math.max(0, p.life / p.maxLife); ctx.beginPath(); ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); });
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function spawnParticles(x: number, y: number, color = [0, 200, 255]) {
    const [r, g, b] = color;
    for (let i = 0; i < 18; i++) { const angle = Math.random() * Math.PI * 2; const speed = 1 + Math.random() * 4; particlesRef.current.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.6 - Math.random() * 1, size: 2 + Math.random() * 4, life: 30 + Math.floor(Math.random() * 30), maxLife: 30 + Math.floor(Math.random() * 30), r, g, b }); }
  }

  return { canvasRef, spawnParticles };
}

/* -------------------- FACE MONITORING INTEGRATION -------------------- */

// Face monitoring API functions
const startFaceMonitoring = async () => {
  try {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.warn('⚠️ No userId found - cannot start face monitoring');
      return;
    }

    console.log('🎥 Starting face monitoring for PTSD game...');
    const response = await fetch('http://localhost:5000/api/face-monitor/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        gameType: 'ptsd'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Face monitoring started successfully:', result);
    } else {
      console.error('❌ Failed to start face monitoring:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error starting face monitoring:', error);
  }
};

const stopFaceMonitoring = async () => {
  try {
    console.log('🛑 Stopping face monitoring...');
    const response = await fetch('http://localhost:5000/api/face-monitor/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Face monitoring stopped successfully:', result);
    } else {
      console.error('❌ Failed to stop face monitoring:', await response.text());
    }
  } catch (error) {
    console.error('❌ Error stopping face monitoring:', error);
  }
};

/* -------------------- MAIN APP COMPONENT -------------------- */

interface PTSDGameProps {
  onGameComplete?: () => void;
}

export default function NeuroCognitiveResponseTest({ onGameComplete }: PTSDGameProps) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<string>("intro");
  const [sequence, setSequence] = useState(() => generateSequence());
  const [roundIdx, setRoundIdx] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const soundEngineRef = useRef<SoundEngine | null>(null);
  const appearanceTimestampRef = useRef<number>(0);
  const { canvasRef, spawnParticles } = useCanvas();

  useEffect(() => { soundEngineRef.current = new SoundEngine(); }, []);

  // Cleanup effect to stop audio when component unmounts
  useEffect(() => {
    return () => {
      console.log('🔇 PTSD Game component unmounting, stopping all audio and face monitoring...');
      soundEngineRef.current?.stopAllAudio();
      stopFaceMonitoring();
    };
  }, []);

  useEffect(() => {
    if (stage !== "game" || roundIdx >= sequence.length) return;
    const stim = sequence[roundIdx];
    const timer = setTimeout(() => {
      soundEngineRef.current?.playForKey(stim.sound);
      setStartTime(performance.now());
      appearanceTimestampRef.current = Date.now();
    }, 400);
    return () => clearTimeout(timer);
  }, [stage, roundIdx, sequence]);

  function startAssessment() {
    soundEngineRef.current?.ensure();
    setSequence(generateSequence());
    setLogs([]);
    setRoundIdx(0);
    setStage("game");
    
    // Start face monitoring when game begins
    startFaceMonitoring();
  }

  function handleChoice(chosenColor: string, e: React.MouseEvent) {
    if (!startTime) return;
    const rt = performance.now() - startTime;
    const stim = sequence[roundIdx];
    const correct = chosenColor === stim.labelColor;
    
    // Create a properly structured log entry for MongoDB storage
    const logEntry = { 
      round: roundIdx + 1, 
      id: stim.id,
      image: stim.image,
      alt: stim.alt,
      type: stim.type, 
      sound: stim.sound,
      labelColor: stim.labelColor, 
      chosen: chosenColor, 
      correct, 
      rt: Math.round(rt), 
      appearanceTimestamp: appearanceTimestampRef.current 
    };
    
    console.log(`🎯 PTSD Game - Trial ${roundIdx + 1}/${TOTAL_TRIALS}:`, logEntry);
    setLogs(prev => [...prev, logEntry]);
    
    let particleColor = [90, 160, 255];
    if (chosenColor === "Red") particleColor = [255, 90, 90];
    if (chosenColor === "Green") particleColor = [120, 255, 160];
    if (chosenColor === "Yellow") particleColor = [255, 220, 90];
    spawnParticles(e.clientX, e.clientY, particleColor);
    setStartTime(null);
    const nextRound = roundIdx + 1;
    setTimeout(() => { 
      if (nextRound < sequence.length) { 
        setRoundIdx(nextRound); 
      } else { 
        // PTSD game completed - save data immediately and skip report
        console.log('🎉 PTSD Game Complete! Saving data and going to report page...');
        
        // Generate report data for saving to MongoDB
        const finalLogs = [...logs, logEntry];
        const correctLogs = finalLogs.filter(l => l.correct);
        const rt = correctLogs.map(l => l.rt);
        const avgRt = rt.length ? rt.reduce((s, l) => s + l, 0) / rt.length : 0;
        const emotional = finalLogs.filter(l => l.type === "Sudden" && l.correct);
        const neutral = finalLogs.filter(l => l.type === "Calm" && l.correct);
        const avgEm = emotional.length ? emotional.reduce((s, l) => s + l.rt, 0) / emotional.length : 0;
        const avgNe = neutral.length ? neutral.reduce((s, l) => s + l.rt, 0) / neutral.length : 0;
        const cogLoad = Math.max(0, avgEm - avgNe);
        const variance = rt.reduce((s, l) => s + Math.pow(l.rt - avgRt, 2), 0) / rt.length;
        const rtStDev = Math.sqrt(variance);
        const firstThird = correctLogs.slice(0, Math.floor(correctLogs.length / 3)).map(l => l.rt);
        const lastThird = correctLogs.slice(-Math.floor(correctLogs.length / 3)).map(l => l.rt);
        const avgFirst = firstThird.length ? firstThird.reduce((a, b) => a + b, 0) / firstThird.length : 0;
        const avgLast = lastThird.length ? lastThird.reduce((a, b) => a + b, 0) / lastThird.length : 0;
        
        const reportData = {
          attention: { value: `${Math.round((correctLogs.length / finalLogs.length) * 100)}%`, explanation: `Focus on the task. Lower scores may indicate difficulty filtering distractions.` },
          motorControl: { value: `${Math.round(avgRt)} ms`, explanation: `Average speed of correct responses. Reflects basic processing speed.` },
          cognitiveLoad: { value: `${Math.round(cogLoad)} ms`, explanation: `Performance slowdown after a startling stimulus. Higher values suggest greater impact from stressors.` },
          inhibitoryControl: { value: `${finalLogs.length - correctLogs.length}`, explanation: `Number of incorrect choices. Measures impulsivity or the ability to suppress incorrect responses.` },
          behavioralStability: { value: avgLast > avgFirst ? 'Declined' : 'Stable', explanation: `Change in reaction time from start to finish. A decline can indicate fatigue.` },
          neuroBalance: { value: `${Math.round(rtStDev)} ms`, explanation: `Reaction Time Variance. Lower values indicate high consistency and cognitive stability.` }
        };
        
        // Save data to MongoDB immediately (but don't wait for it)
        savePTSDGameData(finalLogs, reportData);
        
        // Stop all audio immediately when game completes
        console.log('🔇 PTSD Game completed! Stopping all audio...');
        soundEngineRef.current?.stopAllAudio();
        
        // Stop face monitoring when game completes
        stopFaceMonitoring();
        
        // Navigate to report page immediately - don't wait for save to complete
        console.log('🔄 PTSD Game completed! Navigating to report page...');
        
        if (onGameComplete) {
          console.log('🔄 Using onGameComplete callback');
          onGameComplete();
        } else {
          console.log('🔄 Navigating directly to /report page');
          navigate('/report');
        }
      } 
    }, 350);
  }

  // Save PTSD game data to MongoDB
  const savePTSDGameData = async (logs: any[], report: any) => {
    console.log('🧠 ===== STARTING PTSD GAME DATA SAVE =====');
    console.log('🔍 Logs received:', logs);
    console.log('📊 Report data:', report);
    
    try {
      const userId = localStorage.getItem('userId');
      console.log('👤 Retrieved userId from localStorage:', userId);
      
      if (!userId) {
        console.warn('⚠️ No userId found in localStorage, cannot save PTSD game data');
        return;
      }

      if (!logs || logs.length === 0) {
        console.warn('⚠️ No logs data to save');
        return;
      }

      // Calculate summary statistics
      const correctTrials = logs.filter(l => l.correct).length;
      const avgReactionTime = logs.length > 0 ? logs.reduce((sum, log) => sum + log.rt, 0) / logs.length : 0;
      const attentionScore = Math.round((correctTrials / logs.length) * 100);
      const inhibitoryErrors = logs.length - correctTrials;
      const stressorImpact = parseFloat(report.cognitiveLoad.value) || 0;

      const gameData = {
        userId,
        gameType: 'ptsd',
        scores: {
          motorControl: avgReactionTime,
          cognitiveLoad: stressorImpact,
          stressManagement: Math.max(0, 100 - parseFloat(report.neuroBalance.value)) || 0,
          behavioralStability: report.behavioralStability.value === 'Stable' ? 100 : 50,
          neuroBalance: Math.max(0, 100 - parseFloat(report.neuroBalance.value)) || 0,
          // PTSD-specific scores
          attention: attentionScore,
          inhibitoryControl: Math.max(0, 100 - inhibitoryErrors * 20),
          processingSpeed: Math.max(0, 2000 - avgReactionTime) / 20,
          stressorImpact: stressorImpact
        },
        performanceLog: logs,
        gameMetrics: {
          totalTrials: logs.length,
          correctTrials: correctTrials,
          averageReactionTime: avgReactionTime,
          stressorImpact: stressorImpact,
          attentionScore: attentionScore,
          inhibitoryErrors: inhibitoryErrors,
          responseConsistency: parseFloat(report.neuroBalance.value) || 0
        },
        summary: {
          totalTrials: logs.length,
          correctTrials: correctTrials,
          averageReactionTime: avgReactionTime,
          stressorImpact: stressorImpact,
          attentionScore: attentionScore,
          inhibitoryErrors: inhibitoryErrors
        },
        aiAnalysis: 'PTSD game performance analysis pending'
      };

      console.log('📤 ========== PREPARING TO SAVE PTSD GAME DATA ==========');
      console.log('📤 Sending PTSD game data to MongoDB...');
      console.log('👤 User ID:', userId);
      console.log('🎮 Game Type: ptsd');
      console.log('📊 Total trials:', logs.length);
      console.log('� Correct trials:', correctTrials);
      console.log('⚡ Average RT:', Math.round(avgReactionTime) + 'ms');
      console.log('🌐 API Endpoint: http://localhost:5000/api/reports');
      console.log('📝 Full game data:', gameData);
      console.log('📤 ========== SENDING REQUEST ==========');

      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response status text:', response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('🎉 ========== PTSD GAME REPORT SAVED SUCCESSFULLY! ==========');
        console.log('✅ PTSD game data has been successfully stored in MongoDB!');
        console.log('📊 Number of trials saved:', logs.length);
        console.log('🎯 Correct responses:', correctTrials + '/' + logs.length);
        console.log('⚡ Average reaction time:', Math.round(avgReactionTime) + 'ms');
        console.log('🆔 MongoDB Report ID:', result.reportId || result._id || result.report?._id);
        console.log('📝 Full report details:', result);
        console.log('🔗 Data saved with gameType: "ptsd"');
        console.log('👤 User ID:', userId);
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('🎉 ========== PTSD REPORT SAVE COMPLETE! ==========');
        
        // Show alert to user as well
        alert('🎉 PTSD Game Complete!\n✅ Your results have been saved to the database.\n📊 Trials: ' + logs.length + '\n🎯 Correct: ' + correctTrials);
        
        // If onGameComplete is provided (game sequence), transition to next game
        if (onGameComplete) {
          console.log('🔄 PTSD Game: Transitioning to next game...');
          setTimeout(() => onGameComplete(), 2000); // Give user 2 seconds to see results
        }
      } else {
        const errorText = await response.text();
        console.error('❌ ========== PTSD GAME SAVE FAILED! ==========');
        console.error('❌ Failed to save PTSD game data to MongoDB!');
        console.error('📡 HTTP Status:', response.status, response.statusText);
        console.error('📝 Error response:', errorText);
        console.error('📊 Data that failed to save:', gameData);
        console.error('❌ ========== SAVE FAILED! ==========');
        
        // Show alert to user about the error
        alert('❌ Error saving PTSD game data!\nStatus: ' + response.status + '\nPlease check console for details.');
        
        // Still transition even if save failed
        if (onGameComplete) {
          console.log('🔄 PTSD Game: Transitioning to next game (after save error)...');
          setTimeout(() => onGameComplete(), 2000);
        }
      }
    } catch (error) {
      console.error('❌ ========== EXCEPTION DURING PTSD SAVE ==========');
      console.error('❌ Exception occurred while saving PTSD game data!');
      console.error('❌ Error type:', error?.constructor?.name);
      console.error('❌ Error message:', (error as any)?.message);
      console.error('❌ Error stack:', (error as any)?.stack);
      console.error('❌ Full error object:', error);
      console.error('📊 Data that failed to save:', JSON.stringify({
        userIdFound: !!localStorage.getItem('userId'),
        gameType: 'ptsd',
        trialsCount: logs?.length || 0,
        logsPresent: !!logs
      }));
      console.error('❌ ========== EXCEPTION END ==========');
      
      // Show alert to user about the exception
      alert('❌ Exception occurred while saving PTSD game data!\nError: ' + (error as any)?.message + '\nPlease check console for details.');
      
      // Still transition even if save failed
      if (onGameComplete) {
        console.log('🔄 PTSD Game: Transitioning to next game (after exception)...');
        setTimeout(() => onGameComplete(), 2000);
      }
    }
    
    console.log('🧠 ========== PTSD GAME DATA SAVE PROCESS COMPLETE ==========');
    console.log('📊 Summary: Data save attempt finished');
    console.log('🕒 Timestamp:', new Date().toISOString());
    console.log('🧠 ========== END SAVE PROCESS ==========');
  };

  return (
    <div style={styles.page}>
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.container}>
        <header style={styles.header}><div style={styles.logo}>Neuro-Cognitive Response Test</div></header>
        <main style={styles.main}>
          <AnimatePresence mode="wait">
            {stage === "intro" && (<motion.div key="intro" {...fade}><h1 style={styles.title}>Cognitive Assessment</h1><p style={styles.lead}>An image with a color name will appear. Click the button that matches the color name as quickly and accurately as possible.</p><motion.button {...buttonAnim} style={styles.primary} onClick={startAssessment}>Begin</motion.button></motion.div>)}
            {stage === "game" && sequence[roundIdx] && (<motion.div key={roundIdx} {...fade} style={styles.gameContainer}><div style={styles.progressRow}>Round {roundIdx + 1} / {sequence.length}</div><motion.div style={styles.stimCard} layoutId={`stim-${roundIdx}`}><img src={sequence[roundIdx].image} alt={sequence[roundIdx].alt} style={styles.stimImage} /><div style={styles.stimLabel}><div style={{...styles.stimLabelText, color: colorToHex(sequence[roundIdx].labelColor) }}>{sequence[roundIdx].labelColor}</div></div></motion.div><div style={styles.buttonGrid}>{COLOR_LABELS.map(c => (<motion.button key={c} {...buttonAnim} onClick={(e) => handleChoice(c, e)} style={{...styles.actionBtn, background: buttonColorGradient(c)}}>{c}</motion.button>))}</div></motion.div>)}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/* -------------------- UI SUBCOMPONENTS & STYLES -------------------- */
const fade = { initial:{ opacity: 0, y: 10 }, animate:{ opacity: 1, y: 0 }, exit:{ opacity: 0, y: -10 } };
const buttonAnim = { whileHover:{ scale: 1.03 }, whileTap:{ scale: 0.98 } };

const colorToHex = (label: string) => ({ "Red": "#ff6b6b", "Blue": "#6fb3ff", "Green": "#7bffb1", "Yellow": "#ffd36b" }[label] || "#fff");
const buttonColorGradient = (c: string) => ({ "Red": "linear-gradient(90deg,#ff8b8b,#ff4b6b)", "Blue": "linear-gradient(90deg,#7bdcff,#3b8bff)", "Green": "linear-gradient(90deg,#7bffb1,#3bff8a)", "Yellow": "linear-gradient(90deg,#f9f6a6,#ffd24d)" }[c]);

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(180deg,#0a0514,#07061a)", color: "#dfe7ff", overflow: "hidden" as const, position: "relative" as const, fontFamily: '"Inter", "Segoe UI", Roboto, Arial, sans-serif' },
  canvas: { position: "fixed" as const, inset: 0, zIndex: 0, pointerEvents: "none" as const, opacity: 0.7 },
  container: { position: "relative" as const, zIndex: 2, maxWidth: 900, margin: "36px auto", padding: 20 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  logo: { fontSize: 20, fontWeight: 900, color: "#a8eefe", background: "linear-gradient(90deg,#071428,#1b2142)", padding: "8px 12px", borderRadius: 10, boxShadow: "0 6px 24px rgba(0,255,217,0.06)" },
  main: { minHeight: 600, borderRadius: 14, padding: 24, background: "linear-gradient(180deg, rgba(10,16,32,0.8), rgba(6,10,20,0.7))", backdropFilter: 'blur(10px)', boxShadow: "0 10px 30px rgba(0,0,0,0.6)", display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const },
  title: { fontSize: 32, margin: '0 0 12px 0', color: "#9befff", letterSpacing: -0.5 },
  lead: { color: "#bfcffa", fontSize: 16, maxWidth: 450, margin: '0 auto' },
  primary: { background: "linear-gradient(90deg,#00ffd1,#ff3ecb)", border: "none", padding: "12px 24px", borderRadius: 12, color: "#04102a", fontWeight: 900, cursor: "pointer", marginTop: '20px' },
  ghost: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px 14px", borderRadius: 12, color: "#bcd9ff", cursor: "pointer", },
  gameContainer: { width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center' },
  progressRow: { color: "#95b7ff", fontWeight: 700, marginBottom: 16 },
  stimCard: { borderRadius: 16, overflow: "hidden" as const, background: "#000", padding: 8, boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)', position: 'relative' as const },
  stimImage: { width: 500, height: 350, objectFit: "cover" as const, borderRadius: 12, display: "block" },
  stimLabel: { position: "absolute" as const, top: 20, left: 20, padding: "8px 14px", borderRadius: 8, background: "rgba(0,0,0,0.7)", backdropFilter: 'blur(5px)' },
  stimLabelText: { fontSize: 18, fontWeight: 900, textShadow: '0 0 10px #000' },
  buttonGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24, width: '100%', maxWidth: 500 },
  actionBtn: { padding: "16px 8px", borderRadius: 12, border: "none", fontWeight: 900, fontSize: 16, cursor: "pointer", color: "#051426" },
  reportLayout: { width: '100%', textAlign: 'left' as const },
  reportHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  reportActions: { display: 'flex', alignItems: 'center' },
  reportGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 },
  metricBox: { padding: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' },
  tooltip: { background: 'rgba(5, 20, 38, 0.9)', padding: '8px 12px', borderRadius: 8, border: '1px solid #00ffd1', color: 'white', fontSize: 12 },
  logContainer: { marginTop: 24, background: 'rgba(0,0,0,0.2)', borderRadius: 8, maxHeight: 180, display: 'flex', flexDirection: 'column' as const },
  logHeader: { display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1.5fr', fontWeight: 'bold', fontSize: 12, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9fb6ff' },
  logBody: { overflowY: 'auto' as const, padding: '0 4px 4px 4px' },
  logRow: { display: 'grid', gridTemplateColumns: '1fr 2fr 2fr 1.5fr', fontSize: 12, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' as const },
};

