# React Cognitive Assessment Dashboard - Complete Implementation Guide

## 🚀 Quick Start Instructions

### Step 1: Create New React Project
```bash
npx create-react-app cognitive-assessment-dashboard
cd cognitive-assessment-dashboard
```

### Step 2: Install Required Dependencies
```bash
npm install recharts react-json-view date-fns lodash styled-components
```

### Step 3: Create Folder Structure
Create these folders and files in your `src` directory:

```
src/
├── components/
│   ├── CognitiveAssessmentDashboard.js
│   ├── DataParser.js
│   ├── MetricsCalculator.js
│   ├── RiskAssessment.js
│   ├── DomainScores.js
│   ├── ReportGenerator.js
│   ├── Visualizations.js
│   └── UserInterface.js
├── utils/
│   ├── calculations.js
│   ├── constants.js
│   └── formatters.js
├── data/
│   └── mockData.js
├── styles/
│   ├── Dashboard.css
│   └── Components.css
├── App.js (replace existing)
└── index.js (keep existing)
```

## 📋 File-by-File Implementation

### 1. src/App.js
```javascript
import React from 'react';
import CognitiveAssessmentDashboard from './components/CognitiveAssessmentDashboard';
import './styles/Dashboard.css';
import './styles/Components.css';

function App() {
  return (
    <div className="App">
      <CognitiveAssessmentDashboard />
    </div>
  );
}

export default App;
```

### 2. src/components/CognitiveAssessmentDashboard.js
```javascript
import React, { useState, useEffect } from 'react';
import DataParser from './DataParser';
import MetricsCalculator from './MetricsCalculator';
import RiskAssessment from './RiskAssessment';
import DomainScores from './DomainScores';
import ReportGenerator from './ReportGenerator';
import Visualizations from './Visualizations';

const CognitiveAssessmentDashboard = () => {
  const [activeTab, setActiveTab] = useState('data-input');
  const [sessionData, setSessionData] = useState(null);
  const [computedMetrics, setComputedMetrics] = useState(null);
  const [domainScores, setDomainScores] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataParsed = (data) => {
    setSessionData(data);
    setIsProcessing(true);
    
    setTimeout(() => {
      setIsProcessing(false);
      setActiveTab('metrics');
    }, 1000);
  };

  const tabs = [
    { id: 'data-input', label: 'Data Input', icon: '📊' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'domain-scores', label: 'Domain Scores', icon: '🎯' },
    { id: 'risk-assessment', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'reports', label: 'Reports', icon: '📄' },
    { id: 'visualizations', label: 'Visualizations', icon: '📉' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'data-input':
        return <DataParser onDataParsed={handleDataParsed} />;
      case 'metrics':
        return (
          <MetricsCalculator 
            sessionData={sessionData}
            onMetricsCalculated={setComputedMetrics}
          />
        );
      case 'domain-scores':
        return (
          <DomainScores 
            sessionData={sessionData}
            computedMetrics={computedMetrics}
            onScoresCalculated={setDomainScores}
          />
        );
      case 'risk-assessment':
        return (
          <RiskAssessment 
            sessionData={sessionData}
            computedMetrics={computedMetrics}
            domainScores={domainScores}
            onRiskAssessed={setRiskAssessment}
          />
        );
      case 'reports':
        return (
          <ReportGenerator 
            sessionData={sessionData}
            computedMetrics={computedMetrics}
            domainScores={domainScores}
            riskAssessment={riskAssessment}
          />
        );
      case 'visualizations':
        return (
          <Visualizations 
            sessionData={sessionData}
            computedMetrics={computedMetrics}
            domainScores={domainScores}
            riskAssessment={riskAssessment}
          />
        );
      default:
        return <div>Select a tab to begin</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🧠 Cognitive Assessment Dashboard</h1>
        <p>Evidence-based screening for ADHD, PTSD, and Cognitive Decline</p>
      </header>

      <div className="dashboard-layout">
        <nav className="dashboard-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              disabled={!sessionData && tab.id !== 'data-input'}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <main className="dashboard-content">
          {isProcessing ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Processing cognitive assessment data...</p>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
};

export default CognitiveAssessmentDashboard;
```

### 3. src/components/DataParser.js
```javascript
import React, { useState } from 'react';
import { SAMPLE_DATA } from '../data/mockData';

const DataParser = ({ onDataParsed }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [validationStatus, setValidationStatus] = useState(null);
  const [errors, setErrors] = useState([]);

  const validateData = (data) => {
    const errors = [];
    
    // Check required fields
    if (!data.sessionId) errors.push('Missing sessionId');
    if (!data.gameMetrics) errors.push('Missing gameMetrics');
    if (!data.visionMetrics) errors.push('Missing visionMetrics');
    if (!data.trial_results) errors.push('Missing trial_results');
    
    // Check gameMetrics required fields
    if (data.gameMetrics) {
      if (!data.gameMetrics.totalTrials) errors.push('Missing gameMetrics.totalTrials');
      if (!data.gameMetrics.correctTrials) errors.push('Missing gameMetrics.correctTrials');
      if (!data.gameMetrics.averageReactionTime) errors.push('Missing gameMetrics.averageReactionTime');
    }
    
    return errors;
  };

  const handleParseData = () => {
    try {
      const data = JSON.parse(jsonInput);
      const validationErrors = validateData(data);
      
      if (validationErrors.length > 0) {
        setValidationStatus('error');
        setErrors(validationErrors);
        return;
      }
      
      setValidationStatus('success');
      setErrors([]);
      onDataParsed(data);
    } catch (error) {
      setValidationStatus('error');
      setErrors(['Invalid JSON format: ' + error.message]);
    }
  };

  const loadSampleData = () => {
    setJsonInput(JSON.stringify(SAMPLE_DATA, null, 2));
    setValidationStatus('success');
    setErrors([]);
    onDataParsed(SAMPLE_DATA);
  };

  return (
    <div className="data-parser-container">
      <div className="section-header">
        <h2>📊 Data Input</h2>
        <p>Paste your cognitive assessment session JSON data below</p>
      </div>
      
      <div className="input-controls">
        <button 
          className="sample-data-btn"
          onClick={loadSampleData}
        >
          📋 Load Sample Data
        </button>
        
        <button 
          className="parse-btn"
          onClick={handleParseData}
          disabled={!jsonInput.trim()}
        >
          🔍 Parse & Validate Data
        </button>
      </div>

      <div className="json-input-section">
        <textarea
          className="json-input"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={`Paste your session JSON here...

Expected structure:
{
  "sessionId": "session_123",
  "userId": "user_456", 
  "createdAt": "2025-09-13T12:00:00Z",
  "durationSec": 300,
  "gameMetrics": {
    "totalTrials": 50,
    "correctTrials": 42,
    "averageReactionTime": 650,
    "inhibitoryErrors": 3,
    "memoryErrors": 2,
    "mazeCollisions": 10
  },
  "visionMetrics": {
    "blinkRate": 28,
    "avgFixationMs": 250,
    "gazeOnScreenPct": 85,
    "attentionScore": 75,
    "stressScore": 30
  },
  "trial_results": [
    {
      "trial_id": 1,
      "reaction_time_ms": 445,
      "correct": true,
      "stimulus": "go"
    }
  ]
}`}
        />
      </div>

      {validationStatus && (
        <div className={`validation-status ${validationStatus}`}>
          {validationStatus === 'success' ? (
            <div className="success-message">
              ✅ Data validation successful! Ready for analysis.
            </div>
          ) : (
            <div className="error-message">
              ❌ Validation failed:
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataParser;
```

### 4. src/components/MetricsCalculator.js
```javascript
import React, { useState, useEffect } from 'react';
import { calculateMetrics } from '../utils/calculations';

const MetricsCalculator = ({ sessionData, onMetricsCalculated }) => {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    if (sessionData) {
      const calculatedMetrics = calculateMetrics(sessionData);
      setMetrics(calculatedMetrics);
      onMetricsCalculated(calculatedMetrics);
    }
  }, [sessionData, onMetricsCalculated]);

  if (!metrics) {
    return <div>Calculating metrics...</div>;
  }

  const MetricCard = ({ title, value, unit, formula, status }) => (
    <div className={`metric-card ${status}`}>
      <div className="metric-header">
        <h3>{title}</h3>
        <div className={`status-indicator ${status}`}>
          {status === 'good' ? '✅' : status === 'warning' ? '⚠️' : '❌'}
        </div>
      </div>
      <div className="metric-value">
        {value} {unit}
      </div>
      <div className="metric-formula">
        <small>Formula: {formula}</small>
      </div>
    </div>
  );

  return (
    <div className="metrics-container">
      <div className="section-header">
        <h2>📈 Computed Metrics</h2>
        <p>Core cognitive performance indicators</p>
      </div>

      <div className="metrics-grid">
        <MetricCard
          title="Accuracy"
          value={metrics.accuracy_pct.toFixed(1)}
          unit="%"
          formula="(correctTrials / totalTrials) × 100"
          status={metrics.accuracy_pct >= 80 ? 'good' : metrics.accuracy_pct >= 60 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Average Reaction Time"
          value={metrics.avg_rt_ms.toFixed(0)}
          unit="ms"
          formula="mean(reaction_times)"
          status={metrics.avg_rt_ms <= 800 ? 'good' : metrics.avg_rt_ms <= 1200 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Reaction Time Std Dev"
          value={metrics.rt_std_ms.toFixed(0)}
          unit="ms"
          formula="std_dev(reaction_times)"
          status={metrics.rt_std_ms <= 200 ? 'good' : metrics.rt_std_ms <= 400 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="RT Coefficient of Variation"
          value={metrics.rt_cv.toFixed(3)}
          unit=""
          formula="std_dev / mean"
          status={metrics.rt_cv <= 0.3 ? 'good' : metrics.rt_cv <= 0.6 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Short RT Rate"
          value={metrics.short_rt_rate_pct.toFixed(1)}
          unit="% (< 150ms)"
          formula="count(RT < 150ms) / total_trials × 100"
          status={metrics.short_rt_rate_pct <= 5 ? 'good' : metrics.short_rt_rate_pct <= 10 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Long RT Rate"
          value={metrics.long_rt_rate_pct.toFixed(1)}
          unit="% (> 2000ms)"
          formula="count(RT > 2000ms) / total_trials × 100"
          status={metrics.long_rt_rate_pct <= 5 ? 'good' : metrics.long_rt_rate_pct <= 15 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Blink Rate"
          value={metrics.blink_rate_per_min.toFixed(1)}
          unit="blinks/min"
          formula="(total_blinks / duration_sec) × 60"
          status={metrics.blink_rate_per_min <= 20 ? 'good' : metrics.blink_rate_per_min <= 30 ? 'warning' : 'poor'}
        />
        
        <MetricCard
          title="Gaze On Screen"
          value={metrics.gaze_on_screen_pct.toFixed(1)}
          unit="%"
          formula="mean(gaze_on_screen_pct)"
          status={metrics.gaze_on_screen_pct >= 85 ? 'good' : metrics.gaze_on_screen_pct >= 70 ? 'warning' : 'poor'}
        />
      </div>

      <div className="metrics-summary">
        <h3>📊 Metrics Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="label">Total Trials:</span>
            <span className="value">{sessionData.gameMetrics.totalTrials}</span>
          </div>
          <div className="summary-item">
            <span className="label">Session Duration:</span>
            <span className="value">{sessionData.durationSec}s</span>
          </div>
          <div className="summary-item">
            <span className="label">Maze Collisions:</span>
            <span className="value">{sessionData.gameMetrics.mazeCollisions || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCalculator;
```

### 5. src/utils/calculations.js
```javascript
// Core calculation functions for cognitive metrics

export const calculateMetrics = (sessionData) => {
  const { gameMetrics, visionMetrics, trial_results = [] } = sessionData;
  
  // Basic metrics
  const accuracy_pct = (gameMetrics.correctTrials / gameMetrics.totalTrials) * 100;
  const avg_rt_ms = gameMetrics.averageReactionTime;
  
  // Calculate reaction time statistics from trial results
  const reactionTimes = trial_results.map(trial => trial.reaction_time_ms);
  const rt_std_ms = calculateStandardDeviation(reactionTimes);
  const rt_cv = rt_std_ms / avg_rt_ms;
  
  // Short and long reaction time rates
  const short_rt_count = reactionTimes.filter(rt => rt < 150).length;
  const long_rt_count = reactionTimes.filter(rt => rt > 2000).length;
  const short_rt_rate_pct = (short_rt_count / trial_results.length) * 100;
  const long_rt_rate_pct = (long_rt_count / trial_results.length) * 100;
  
  // Vision metrics
  const blink_rate_per_min = (visionMetrics.blinkRate * 60) / sessionData.durationSec;
  const gaze_on_screen_pct = visionMetrics.gazeOnScreenPct;
  const fixation_mean_ms = visionMetrics.avgFixationMs;
  
  return {
    accuracy_pct,
    avg_rt_ms,
    rt_std_ms,
    rt_cv,
    short_rt_rate_pct,
    long_rt_rate_pct,
    blink_rate_per_min,
    gaze_on_screen_pct,
    fixation_mean_ms,
    maze_collisions: gameMetrics.mazeCollisions || 0
  };
};

export const calculateDomainScores = (sessionData, computedMetrics) => {
  const { visionMetrics, gameMetrics } = sessionData;
  
  // Attention Score (0-100)
  const attention = Math.min(100, Math.max(0, 
    0.5 * (visionMetrics.attentionScore || 50) + 0.5 * computedMetrics.accuracy_pct
  ));
  
  // Inhibitory Control (0-100)
  const inhibitoryControl = Math.min(100, Math.max(0,
    100 - ((gameMetrics.inhibitoryErrors / gameMetrics.totalTrials) * 100)
  ));
  
  // Processing Speed (0-100)
  const processingSpeed = Math.min(100, Math.max(0,
    mapReactionTimeToScore(computedMetrics.avg_rt_ms)
  ));
  
  // Motor Control (0-100)
  const motorControl = Math.min(100, Math.max(0,
    100 * (1 - Math.min(computedMetrics.maze_collisions / 30, 1))
  ));
  
  // Cognitive Load (0-100, lower is better)
  const cognitiveLoad = Math.min(100, Math.max(0,
    (computedMetrics.rt_cv * 100 + (computedMetrics.blink_rate_per_min - 15) * 2) / 2
  ));
  
  // Memory (0-100)
  const memoryAccuracy = gameMetrics.memoryErrors ? 
    (1 - (gameMetrics.memoryErrors / gameMetrics.totalTrials)) * 100 : 85;
  const memory = Math.min(100, Math.max(0, memoryAccuracy));
  
  // Neuro Balance (average of key scores)
  const neuroBalance = (motorControl + attention + inhibitoryControl) / 3;
  
  // Stress Management (0-100)
  const stressManagement = Math.min(100, Math.max(0,
    100 - (visionMetrics.stressScore || 25)
  ));
  
  return {
    attention: {
      value: attention,
      formula: "0.5 * attentionScore + 0.5 * accuracy",
      inputs: { attentionScore: visionMetrics.attentionScore, accuracy: computedMetrics.accuracy_pct }
    },
    inhibitoryControl: {
      value: inhibitoryControl,
      formula: "100 - (inhibitoryErrors / totalTrials * 100)",
      inputs: { inhibitoryErrors: gameMetrics.inhibitoryErrors, totalTrials: gameMetrics.totalTrials }
    },
    processingSpeed: {
      value: processingSpeed,
      formula: "mapped from avgRT (150ms=100, 3000ms=0)",
      inputs: { avgReactionTime: computedMetrics.avg_rt_ms }
    },
    motorControl: {
      value: motorControl,
      formula: "100 * (1 - min(collisions/30, 1))",
      inputs: { mazeCollisions: computedMetrics.maze_collisions }
    },
    cognitiveLoad: {
      value: cognitiveLoad,
      formula: "(rt_cv * 100 + (blinkRate - 15) * 2) / 2",
      inputs: { rt_cv: computedMetrics.rt_cv, blinkRate: computedMetrics.blink_rate_per_min }
    },
    memory: {
      value: memory,
      formula: "(1 - memoryErrors/totalTrials) * 100",
      inputs: { memoryErrors: gameMetrics.memoryErrors || 0, totalTrials: gameMetrics.totalTrials }
    },
    neuroBalance: {
      value: neuroBalance,
      formula: "(motorControl + attention + inhibitoryControl) / 3",
      inputs: { motorControl, attention, inhibitoryControl }
    },
    stressManagement: {
      value: stressManagement,
      formula: "100 - stressScore",
      inputs: { stressScore: visionMetrics.stressScore }
    }
  };
};

export const assessRisks = (sessionData, computedMetrics, domainScores) => {
  const risks = {
    ADHD: assessADHDRisk(sessionData, computedMetrics),
    PTSD: assessPTSDRisk(sessionData, computedMetrics),
    Alzheimers: assessAlzheimersRisk(sessionData, computedMetrics)
  };
  
  return risks;
};

const assessADHDRisk = (sessionData, computedMetrics) => {
  const evidence = [];
  let riskLevel = 'Low';
  let confidence = 0;
  
  // Check RT coefficient of variation
  if (computedMetrics.rt_cv > 0.6) {
    evidence.push({
      path: 'computedMetrics.rt_cv',
      value: computedMetrics.rt_cv,
      why: `RT variability ${computedMetrics.rt_cv.toFixed(3)} > 0.6 threshold indicates impulsivity`
    });
    confidence += 30;
  }
  
  // Check short RT rate
  if (computedMetrics.short_rt_rate_pct > 10) {
    evidence.push({
      path: 'computedMetrics.short_rt_rate_pct',
      value: computedMetrics.short_rt_rate_pct,
      why: `${computedMetrics.short_rt_rate_pct.toFixed(1)}% fast responses > 10% threshold suggests impulsivity`
    });
    confidence += 25;
  }
  
  // Check inhibitory errors
  const inhibitoryErrorRate = sessionData.gameMetrics.inhibitoryErrors / sessionData.gameMetrics.totalTrials;
  if (inhibitoryErrorRate > 0.05) {
    evidence.push({
      path: 'gameMetrics.inhibitoryErrors',
      value: sessionData.gameMetrics.inhibitoryErrors,
      why: `Error rate ${(inhibitoryErrorRate * 100).toFixed(1)}% > 5% threshold indicates poor inhibitory control`
    });
    confidence += 25;
  }
  
  // Check blink rate
  if (computedMetrics.blink_rate_per_min > 25) {
    evidence.push({
      path: 'visionMetrics.blinkRate',
      value: computedMetrics.blink_rate_per_min,
      why: `Blink rate ${computedMetrics.blink_rate_per_min.toFixed(1)}/min > 25 threshold suggests stress/attention issues`
    });
    confidence += 20;
  }
  
  // Determine risk level
  if (evidence.length >= 3) {
    riskLevel = 'High';
  } else if (evidence.length >= 2) {
    riskLevel = 'Moderate';
  }
  
  return {
    level: riskLevel,
    confidence: Math.min(confidence, 100),
    evidence
  };
};

const assessPTSDRisk = (sessionData, computedMetrics) => {
  const evidence = [];
  let riskLevel = 'Low';
  let confidence = 0;
  
  const stressScore = sessionData.visionMetrics.stressScore || 0;
  
  if (stressScore >= 40) {
    evidence.push({
      path: 'visionMetrics.stressScore',
      value: stressScore,
      why: `Stress score ${stressScore} >= 40 threshold indicates elevated stress response`
    });
    confidence += 40;
    riskLevel = 'High';
  } else if (stressScore >= 25) {
    evidence.push({
      path: 'visionMetrics.stressScore',
      value: stressScore,
      why: `Moderate stress score ${stressScore} suggests some stress markers`
    });
    confidence += 20;
    riskLevel = 'Moderate';
  }
  
  // Check for gaze avoidance patterns
  if (computedMetrics.gaze_on_screen_pct < 70) {
    evidence.push({
      path: 'visionMetrics.gazeOnScreenPct',
      value: computedMetrics.gaze_on_screen_pct,
      why: `Low gaze engagement ${computedMetrics.gaze_on_screen_pct.toFixed(1)}% < 70% may indicate avoidance`
    });
    confidence += 15;
  }
  
  return {
    level: riskLevel,
    confidence: Math.min(confidence, 100),
    evidence
  };
};

const assessAlzheimersRisk = (sessionData, computedMetrics) => {
  const evidence = [];
  let riskLevel = 'Low';
  let confidence = 0;
  
  // Check average reaction time
  if (computedMetrics.avg_rt_ms > 2000) {
    evidence.push({
      path: 'computedMetrics.avg_rt_ms',
      value: computedMetrics.avg_rt_ms,
      why: `Slow processing ${computedMetrics.avg_rt_ms}ms > 2000ms threshold indicates cognitive slowing`
    });
    confidence += 35;
  }
  
  // Check memory performance
  const memoryErrors = sessionData.gameMetrics.memoryErrors || 0;
  const memoryAccuracy = (1 - (memoryErrors / sessionData.gameMetrics.totalTrials)) * 100;
  if (memoryAccuracy < 70) {
    evidence.push({
      path: 'gameMetrics.memoryErrors',
      value: memoryErrors,
      why: `Memory accuracy ${memoryAccuracy.toFixed(1)}% < 70% threshold suggests memory impairment`
    });
    confidence += 35;
  }
  
  // Check gaze tracking
  if (computedMetrics.gaze_on_screen_pct < 80) {
    evidence.push({
      path: 'visionMetrics.gazeOnScreenPct',
      value: computedMetrics.gaze_on_screen_pct,
      why: `Poor attention tracking ${computedMetrics.gaze_on_screen_pct.toFixed(1)}% < 80% may indicate attention deficits`
    });
    confidence += 20;
  }
  
  // Determine risk level
  if (evidence.length >= 2 && confidence >= 50) {
    riskLevel = 'High';
  } else if (evidence.length >= 1 || confidence >= 25) {
    riskLevel = 'Moderate';
  }
  
  return {
    level: riskLevel,
    confidence: Math.min(confidence, 100),
    evidence
  };
};

// Helper functions
const calculateStandardDeviation = (values) => {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
};

const mapReactionTimeToScore = (rt) => {
  // Map RT to 0-100 scale: 150ms = 100, 3000ms = 0
  if (rt <= 150) return 100;
  if (rt >= 3000) return 0;
  return 100 - ((rt - 150) / (3000 - 150)) * 100;
};
```

## 📝 Copilot Integration Prompt

**Use this prompt with your AI coding assistant (Copilot, Claude, etc.):**

```
I'm building a React cognitive assessment dashboard for healthcare screening. Here's what I need you to help me implement:

CONTEXT:
- This is a medical screening application for ADHD, PTSD, and Alzheimer's risk assessment
- I have session data with game metrics, vision metrics, and trial results
- Need to compute cognitive metrics, domain scores, and generate risk assessments
- The app should be professional, accessible, and suitable for healthcare professionals

CURRENT FILE: [filename]
DESCRIPTION: [brief description of what this component should do]

REQUIREMENTS FOR THIS COMPONENT:
1. Use React functional components with hooks
2. Follow the established patterns from the main dashboard
3. Include proper error handling and loading states
4. Use className-based styling (CSS classes provided separately)
5. Make it responsive and accessible
6. Include comprehensive JSDoc comments for all functions

SPECIFIC FUNCTIONALITY NEEDED:
[Describe the specific functionality for each component based on the file structure above]

Please implement this component following React best practices, ensuring it integrates well with the overall dashboard architecture.
```

## 🎨 Additional Files Needed

You'll also need to create these remaining files:

### src/data/mockData.js
```javascript
export const SAMPLE_DATA = {
  "sessionId": "session_12345",
  "userId": "user_789", 
  "createdAt": "2025-09-13T12:22:00Z",
  "durationSec": 420,
  "gameMetrics": {
    "totalTrials": 60,
    "correctTrials": 48,
    "averageReactionTime": 725,
    "inhibitoryErrors": 5,
    "responseConsistency": 0.78,
    "memoryErrors": 4,
    "mazeCollisions": 15
  },
  "visionMetrics": {
    "blinkRate": 28,
    "avgFixationMs": 265,
    "saccades": 145,
    "gazeOnScreenPct": 84,
    "headMovementEvents": 12,
    "microHeadMovements": 8,
    "attentionScore": 78,
    "stressScore": 32,
    "facialExpression": "neutral",
    "pupilEstimate": 3.2
  },
  "trial_results": [
    {"trial_id": 1, "reaction_time_ms": 456, "correct": true, "stimulus": "go"},
    {"trial_id": 2, "reaction_time_ms": 623, "correct": true, "stimulus": "go"},
    {"trial_id": 3, "reaction_time_ms": 1245, "correct": false, "stimulus": "no-go"},
    {"trial_id": 4, "reaction_time_ms": 389, "correct": true, "stimulus": "go"},
    {"trial_id": 5, "reaction_time_ms": 834, "correct": true, "stimulus": "go"},
    {"trial_id": 6, "reaction_time_ms": 125, "correct": false, "stimulus": "no-go"},
    {"trial_id": 7, "reaction_time_ms": 567, "correct": true, "stimulus": "go"},
    {"trial_id": 8, "reaction_time_ms": 2145, "correct": false, "stimulus": "go"}
  ]
};
```

## 🚀 Getting Started

1. Follow the folder structure exactly as shown
2. Copy each component file into the correct location
3. Install all dependencies
4. Use the copilot prompt for any remaining components
5. Run `npm start` to see your dashboard in action

The dashboard will provide a comprehensive cognitive assessment interface with real-time data processing, visualization, and professional reporting capabilities suitable for healthcare environments.