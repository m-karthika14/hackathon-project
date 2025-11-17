const { useState, useEffect, useMemo } = React;

// Sample data from the provided JSON
const SAMPLE_DATA = {
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
    {"trial_id": 1, "reaction_time_ms": 456, "correct": true, "stimulus": "go", "vision_snapshot": {"blink_count": 0, "gaze_on_screen_pct": 95, "head_direction": "center", "emotion": "focused"}},
    {"trial_id": 2, "reaction_time_ms": 623, "correct": true, "stimulus": "go", "vision_snapshot": {"blink_count": 1, "gaze_on_screen_pct": 88, "head_direction": "center", "emotion": "calm"}},
    {"trial_id": 3, "reaction_time_ms": 1245, "correct": false, "stimulus": "no-go", "vision_snapshot": {"blink_count": 3, "gaze_on_screen_pct": 45, "head_direction": "left", "emotion": "frustrated"}},
    {"trial_id": 4, "reaction_time_ms": 389, "correct": true, "stimulus": "go", "vision_snapshot": {"blink_count": 0, "gaze_on_screen_pct": 92, "head_direction": "center", "emotion": "focused"}},
    {"trial_id": 5, "reaction_time_ms": 834, "correct": true, "stimulus": "go", "vision_snapshot": {"blink_count": 2, "gaze_on_screen_pct": 78, "head_direction": "center", "emotion": "neutral"}},
    {"trial_id": 6, "reaction_time_ms": 125, "correct": false, "stimulus": "no-go", "vision_snapshot": {"blink_count": 0, "gaze_on_screen_pct": 95, "head_direction": "center", "emotion": "impulsive"}},
    {"trial_id": 7, "reaction_time_ms": 567, "correct": true, "stimulus": "go", "vision_snapshot": {"blink_count": 1, "gaze_on_screen_pct": 89, "head_direction": "center", "emotion": "calm"}},
    {"trial_id": 8, "reaction_time_ms": 2145, "correct": false, "stimulus": "go", "vision_snapshot": {"blink_count": 4, "gaze_on_screen_pct": 65, "head_direction": "right", "emotion": "distracted"}}
  ]
};

// Data processing functions
const processSessionData = (sessionData) => {
  if (!sessionData || !sessionData.gameMetrics || !sessionData.trial_results) {
    return null;
  }

  const { gameMetrics, visionMetrics = {}, trial_results = [] } = sessionData;
  
  // Calculate core metrics
  const accuracy_pct = (gameMetrics.correctTrials / gameMetrics.totalTrials) * 100;
  
  // Calculate reaction time statistics from trials
  const reactionTimes = trial_results.map(t => t.reaction_time_ms).filter(rt => rt > 0);
  const avg_rt_ms = reactionTimes.reduce((sum, rt) => sum + rt, 0) / reactionTimes.length;
  const rt_variance = reactionTimes.reduce((sum, rt) => sum + Math.pow(rt - avg_rt_ms, 2), 0) / reactionTimes.length;
  const rt_std_ms = Math.sqrt(rt_variance);
  const rt_cv = rt_std_ms / avg_rt_ms;
  
  // Calculate rates
  const short_rt_rate_pct = (reactionTimes.filter(rt => rt < 150).length / reactionTimes.length) * 100;
  const long_rt_rate_pct = (reactionTimes.filter(rt => rt > 2000).length / reactionTimes.length) * 100;
  
  // Vision metrics
  const blink_rate_per_min = visionMetrics.blinkRate || 0;
  const fixation_mean_ms = visionMetrics.avgFixationMs || 0;
  const gaze_on_screen_pct = visionMetrics.gazeOnScreenPct || 0;
  const maze_collisions = gameMetrics.mazeCollisions || 0;

  const computedMetrics = {
    accuracy_pct: Math.round(accuracy_pct * 100) / 100,
    avg_rt_ms: Math.round(avg_rt_ms * 100) / 100,
    rt_std_ms: Math.round(rt_std_ms * 100) / 100,
    rt_cv: Math.round(rt_cv * 1000) / 1000,
    short_rt_rate_pct: Math.round(short_rt_rate_pct * 100) / 100,
    long_rt_rate_pct: Math.round(long_rt_rate_pct * 100) / 100,
    blink_rate_per_min,
    fixation_mean_ms,
    gaze_on_screen_pct,
    maze_collisions
  };

  // Calculate domain scores
  const attention = Math.min(100, Math.max(0, 
    0.5 * (visionMetrics.attentionScore || 50) + 0.5 * accuracy_pct
  ));
  
  const inhibitoryControl = Math.min(100, Math.max(0,
    100 - ((gameMetrics.inhibitoryErrors / Math.max(1, gameMetrics.totalTrials)) * 100)
  ));
  
  const processingSpeed = Math.min(100, Math.max(0,
    avg_rt_ms <= 150 ? 100 : avg_rt_ms >= 3000 ? 0 : 100 - ((avg_rt_ms - 150) / (3000 - 150)) * 100
  ));
  
  const motorControl = Math.min(100, Math.max(0,
    100 * (1 - Math.min(maze_collisions / 30, 1))
  ));
  
  const cognitiveLoad = Math.min(100, Math.max(0,
    100 - (rt_cv * 50 + (blink_rate_per_min / 50) * 50)
  ));
  
  const memory = Math.min(100, Math.max(0,
    100 - ((gameMetrics.memoryErrors || 0) / Math.max(1, gameMetrics.totalTrials)) * 100
  ));
  
  const neuroBalance = (motorControl + attention + inhibitoryControl) / 3;
  
  const stressManagement = Math.min(100, Math.max(0,
    100 - (visionMetrics.stressScore || 0)
  ));

  const domainScores = {
    attention: {
      value: Math.round(attention * 100) / 100,
      formula: "0.5 * attentionScore + 0.5 * accuracy_pct",
      inputs: { attentionScore: visionMetrics.attentionScore || 50, accuracy_pct }
    },
    inhibitoryControl: {
      value: Math.round(inhibitoryControl * 100) / 100,
      formula: "100 - (inhibitoryErrors / totalTrials) * 100",
      inputs: { inhibitoryErrors: gameMetrics.inhibitoryErrors, totalTrials: gameMetrics.totalTrials }
    },
    processingSpeed: {
      value: Math.round(processingSpeed * 100) / 100,
      formula: "Linear mapping: RT ≤ 150ms = 100, RT ≥ 3000ms = 0",
      inputs: { avg_rt_ms }
    },
    motorControl: {
      value: Math.round(motorControl * 100) / 100,
      formula: "100 * (1 - min(mazeCollisions / 30, 1))",
      inputs: { mazeCollisions: maze_collisions }
    },
    cognitiveLoad: {
      value: Math.round(cognitiveLoad * 100) / 100,
      formula: "100 - (rt_cv * 50 + blinkRate_normalized * 50)",
      inputs: { rt_cv, blink_rate_per_min }
    },
    memory: {
      value: Math.round(memory * 100) / 100,
      formula: "100 - (memoryErrors / totalTrials) * 100",
      inputs: { memoryErrors: gameMetrics.memoryErrors || 0, totalTrials: gameMetrics.totalTrials }
    },
    neuroBalance: {
      value: Math.round(neuroBalance * 100) / 100,
      formula: "(motorControl + attention + inhibitoryControl) / 3",
      inputs: { motorControl, attention, inhibitoryControl }
    },
    stressManagement: {
      value: Math.round(stressManagement * 100) / 100,
      formula: "100 - stressScore",
      inputs: { stressScore: visionMetrics.stressScore || 0 }
    }
  };

  // Risk assessment
  const riskFlags = calculateRiskFlags(computedMetrics, domainScores, gameMetrics, visionMetrics, trial_results);

  return {
    computedMetrics,
    domainScores,
    riskFlags,
    sessionData
  };
};

const calculateRiskFlags = (metrics, domains, gameMetrics, visionMetrics, trials) => {
  const flags = {};
  
  // ADHD Risk
  const adhdEvidence = [];
  let adhdScore = 0;
  
  if (metrics.rt_cv > 0.6) {
    adhdEvidence.push({
      path: "computedMetrics.rt_cv",
      value: metrics.rt_cv,
      why: "High reaction time variability (>0.6) indicates attention inconsistency"
    });
    adhdScore += 1;
  }
  
  if (metrics.short_rt_rate_pct > 10) {
    adhdEvidence.push({
      path: "computedMetrics.short_rt_rate_pct",
      value: metrics.short_rt_rate_pct,
      why: "High impulsive response rate (>10%) suggests poor inhibitory control"
    });
    adhdScore += 1;
  }
  
  if ((gameMetrics.inhibitoryErrors / gameMetrics.totalTrials) > 0.05) {
    adhdEvidence.push({
      path: "gameMetrics.inhibitoryErrors",
      value: gameMetrics.inhibitoryErrors,
      why: "Inhibitory error rate >5% indicates attention regulation issues"
    });
    adhdScore += 1;
  }
  
  if (metrics.blink_rate_per_min > 25) {
    adhdEvidence.push({
      path: "visionMetrics.blinkRate",
      value: metrics.blink_rate_per_min,
      why: "Elevated blink rate (>25/min) may indicate stress or attention strain"
    });
    adhdScore += 1;
  }
  
  flags.ADHD = {
    level: adhdScore >= 3 ? "High" : adhdScore >= 2 ? "Moderate" : "Low",
    confidence: Math.min(100, adhdScore * 25),
    evidence: adhdEvidence
  };
  
  // Alzheimer's Risk
  const alzheimerEvidence = [];
  let alzheimerScore = 0;
  
  if (metrics.avg_rt_ms > 2000) {
    alzheimerEvidence.push({
      path: "computedMetrics.avg_rt_ms",
      value: metrics.avg_rt_ms,
      why: "Severely delayed average reaction time (>2000ms) suggests processing decline"
    });
    alzheimerScore += 1;
  }
  
  if (domains.memory.value < 70) {
    alzheimerEvidence.push({
      path: "domainScores.memory",
      value: domains.memory.value,
      why: "Poor memory performance (<70%) indicates cognitive decline"
    });
    alzheimerScore += 1;
  }
  
  if (metrics.gaze_on_screen_pct < 80) {
    alzheimerEvidence.push({
      path: "visionMetrics.gazeOnScreenPct",
      value: metrics.gaze_on_screen_pct,
      why: "Low attention focus (<80%) may indicate cognitive impairment"
    });
    alzheimerScore += 1;
  }
  
  flags.Alzheimers = {
    level: alzheimerScore >= 3 ? "High" : alzheimerScore >= 2 ? "Moderate" : "Low",
    confidence: Math.min(100, alzheimerScore * 30),
    evidence: alzheimerEvidence
  };
  
  // PTSD Risk
  const ptsdEvidence = [];
  let ptsdScore = 0;
  
  if ((visionMetrics.stressScore || 0) >= 40) {
    ptsdEvidence.push({
      path: "visionMetrics.stressScore",
      value: visionMetrics.stressScore,
      why: "Elevated stress markers (≥40) indicate heightened arousal"
    });
    ptsdScore += 1;
  }
  
  // Check for stress responses in trials
  const stressTrials = trials.filter(t => 
    !t.correct && t.vision_snapshot && 
    (t.vision_snapshot.blink_count > 2 || t.vision_snapshot.gaze_on_screen_pct < 60)
  );
  
  if (stressTrials.length > trials.length * 0.2) {
    ptsdEvidence.push({
      path: "trial_results",
      value: stressTrials.length,
      why: `${stressTrials.length} trials showed stress responses (blink spikes, gaze avoidance)`
    });
    ptsdScore += 1;
  }
  
  flags.PTSD = {
    level: ptsdScore >= 2 ? "High" : ptsdScore >= 1 ? "Moderate" : "Low",
    confidence: Math.min(100, ptsdScore * 40),
    evidence: ptsdEvidence
  };
  
  return flags;
};

// React Components
const Sidebar = ({ activePanel, setActivePanel }) => {
  const navItems = [
    { id: 'input', label: 'Data Input', icon: '📊' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'domains', label: 'Domain Scores', icon: '🎯' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'visualizations', label: 'Visualizations', icon: '📊' }
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>🧠 CogniDash</h2>
      </div>
      <nav>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${activePanel === item.id ? 'active' : ''}`}
                onClick={() => setActivePanel(item.id)}
              >
                <span style={{ marginRight: '8px' }}>{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const DataInputPanel = ({ jsonData, setJsonData, processedData, setProcessedData }) => {
  const [validationStatus, setValidationStatus] = useState(null);

  const handleDataChange = (e) => {
    setJsonData(e.target.value);
    setValidationStatus(null);
  };

  const parseData = () => {
    try {
      const parsed = JSON.parse(jsonData);
      const processed = processSessionData(parsed);
      if (processed) {
        setProcessedData(processed);
        setValidationStatus({ type: 'success', message: 'Data parsed successfully!' });
      } else {
        setValidationStatus({ type: 'error', message: 'Invalid data structure. Missing required fields.' });
      }
    } catch (error) {
      setValidationStatus({ type: 'error', message: `JSON parsing error: ${error.message}` });
    }
  };

  const loadSampleData = () => {
    const sampleJson = JSON.stringify(SAMPLE_DATA, null, 2);
    setJsonData(sampleJson);
    const processed = processSessionData(SAMPLE_DATA);
    setProcessedData(processed);
    setValidationStatus({ type: 'success', message: 'Sample data loaded successfully!' });
  };

  return (
    <div className="data-input-section">
      <h2>Data Input</h2>
      <p>Paste your cognitive assessment session JSON data below or load sample data to explore the dashboard.</p>
      
      <div className="form-group">
        <label className="form-label">Session JSON Data</label>
        <textarea
          className="form-control json-textarea"
          value={jsonData}
          onChange={handleDataChange}
          placeholder={`{
  "sessionId": "session_123",
  "userId": "user_456", 
  "gameMetrics": {
    "totalTrials": 50,
    "correctTrials": 42,
    "averageReactionTime": 650,
    ...
  },
  "visionMetrics": {
    "blinkRate": 28,
    "gazeOnScreenPct": 84,
    ...
  },
  "trial_results": [...]
}`}
        />
      </div>

      <div className="input-controls">
        <button className="btn btn--primary" onClick={parseData}>
          Parse Data
        </button>
        <button className="btn btn--secondary" onClick={loadSampleData}>
          Load Sample Data
        </button>
      </div>

      {validationStatus && (
        <div className={`validation-status ${validationStatus.type}`}>
          {validationStatus.message}
        </div>
      )}
    </div>
  );
};

const MetricsPanel = ({ processedData }) => {
  if (!processedData) {
    return (
      <div>
        <h2>Computed Metrics</h2>
        <p>Please load and parse session data first using the Data Input panel.</p>
      </div>
    );
  }

  const { computedMetrics } = processedData;
  
  const getMetricIndicator = (metric, value) => {
    const indicators = {
      accuracy_pct: value >= 85 ? 'good' : value >= 70 ? 'warning' : 'poor',
      avg_rt_ms: value <= 600 ? 'good' : value <= 1000 ? 'warning' : 'poor',
      rt_cv: value <= 0.3 ? 'good' : value <= 0.6 ? 'warning' : 'poor',
      blink_rate_per_min: value <= 20 ? 'good' : value <= 30 ? 'warning' : 'poor',
      gaze_on_screen_pct: value >= 85 ? 'good' : value >= 70 ? 'warning' : 'poor'
    };
    return indicators[metric] || 'warning';
  };

  const metricConfigs = [
    {
      key: 'accuracy_pct',
      title: 'Accuracy Rate',
      value: `${computedMetrics.accuracy_pct}%`,
      formula: '(correctTrials / totalTrials) × 100'
    },
    {
      key: 'avg_rt_ms',
      title: 'Avg Reaction Time',
      value: `${computedMetrics.avg_rt_ms}ms`,
      formula: 'Mean of all reaction times'
    },
    {
      key: 'rt_cv',
      title: 'RT Variability',
      value: computedMetrics.rt_cv.toFixed(3),
      formula: 'Standard deviation / Mean RT'
    },
    {
      key: 'blink_rate_per_min',
      title: 'Blink Rate',
      value: `${computedMetrics.blink_rate_per_min}/min`,
      formula: 'Blinks per minute from vision data'
    },
    {
      key: 'gaze_on_screen_pct',
      title: 'Focus Rate',
      value: `${computedMetrics.gaze_on_screen_pct}%`,
      formula: 'Percentage of time gazing on screen'
    }
  ];

  return (
    <div>
      <h2>Computed Metrics</h2>
      <div className="metrics-grid">
        {metricConfigs.map(config => (
          <div key={config.key} className="metric-card">
            <div className="metric-header">
              <h3 className="metric-title">{config.title}</h3>
              <span className={`metric-indicator ${getMetricIndicator(config.key, computedMetrics[config.key])}`}>
                {getMetricIndicator(config.key, computedMetrics[config.key])}
              </span>
            </div>
            <div className="metric-value">{config.value}</div>
            <div className="metric-formula">{config.formula}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DomainScoresPanel = ({ processedData }) => {
  if (!processedData) {
    return (
      <div>
        <h2>Domain Scores</h2>
        <p>Please load and parse session data first using the Data Input panel.</p>
      </div>
    );
  }

  const { domainScores } = processedData;
  
  const getScoreLevel = (value) => {
    if (value >= 80) return 'excellent';
    if (value >= 60) return 'good';
    if (value >= 40) return 'moderate';
    return 'poor';
  };

  const domainConfigs = [
    { key: 'attention', title: 'Attention', icon: '👁️' },
    { key: 'inhibitoryControl', title: 'Inhibitory Control', icon: '🛑' },
    { key: 'processingSpeed', title: 'Processing Speed', icon: '⚡' },
    { key: 'motorControl', title: 'Motor Control', icon: '🎮' },
    { key: 'memory', title: 'Memory', icon: '🧠' },
    { key: 'stressManagement', title: 'Stress Management', icon: '😌' }
  ];

  return (
    <div>
      <h2>Domain Scores</h2>
      <div className="domain-scores-grid">
        {domainConfigs.map(config => {
          const domain = domainScores[config.key];
          if (!domain) return null;
          
          return (
            <div key={config.key} className="domain-card">
              <div className="domain-header">
                <h3 className="domain-title">
                  <span style={{ marginRight: '8px' }}>{config.icon}</span>
                  {config.title}
                </h3>
                <span className="domain-score">{domain.value}/100</span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${getScoreLevel(domain.value)}`}
                  style={{ width: `${domain.value}%` }}
                ></div>
              </div>
              <div className="domain-calculation">
                <strong>Formula:</strong> {domain.formula}<br/>
                <strong>Inputs:</strong> {JSON.stringify(domain.inputs)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RiskAssessmentPanel = ({ processedData }) => {
  if (!processedData) {
    return (
      <div>
        <h2>Risk Assessment</h2>
        <p>Please load and parse session data first using the Data Input panel.</p>
      </div>
    );
  }

  const { riskFlags } = processedData;

  const riskConfigs = [
    { key: 'ADHD', title: 'ADHD Risk Markers', icon: '🎯' },
    { key: 'Alzheimers', title: "Alzheimer's Risk Markers", icon: '🧠' },
    { key: 'PTSD', title: 'PTSD Risk Markers', icon: '💭' }
  ];

  return (
    <div>
      <h2>Risk Assessment</h2>
      <p><em>Note: This is a screening tool, not a diagnostic instrument. Risk flags suggest areas for clinical evaluation.</em></p>
      <div className="risk-assessment-grid">
        {riskConfigs.map(config => {
          const risk = riskFlags[config.key];
          if (!risk) return null;
          
          return (
            <div key={config.key} className="risk-card">
              <div className="risk-header">
                <h3 className="risk-title">
                  <span style={{ marginRight: '8px' }}>{config.icon}</span>
                  {config.title}
                </h3>
                <span className={`risk-level ${risk.level.toLowerCase()}`}>
                  {risk.level}
                </span>
              </div>
              <div className="confidence-score">
                Confidence: {risk.confidence}%
              </div>
              <ul className="evidence-list">
                {risk.evidence.map((evidence, index) => (
                  <li key={index} className="evidence-item">
                    <strong>{evidence.path}:</strong> {evidence.value} - {evidence.why}
                  </li>
                ))}
                {risk.evidence.length === 0 && (
                  <li className="evidence-item">No significant risk markers detected.</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReportsPanel = ({ processedData }) => {
  const [activeTab, setActiveTab] = useState('json');

  if (!processedData) {
    return (
      <div>
        <h2>Generated Reports</h2>
        <p>Please load and parse session data first using the Data Input panel.</p>
      </div>
    );
  }

  const generateJSONReport = () => {
    const report = {
      reportId: `${processedData.sessionData.sessionId}_${Date.now()}`,
      sessionId: processedData.sessionData.sessionId,
      userId: processedData.sessionData.userId,
      timestamp: new Date().toISOString(),
      computedMetrics: processedData.computedMetrics,
      domainScores: processedData.domainScores,
      riskFlags: processedData.riskFlags,
      recommendations: {
        user_friendly: [
          "Continue regular cognitive exercises",
          "Monitor stress levels during tasks",
          "Consider consultation if symptoms persist"
        ],
        clinician_friendly: [
          "Recommend ASRS-5 screening for ADHD markers",
          "Consider MoCA assessment for cognitive function",
          "Monitor reaction time variability trends"
        ]
      },
      limitations: [
        "Small sample size from single session",
        "Webcam-based measurements have inherent noise",
        "Not a replacement for clinical diagnosis",
        "Thresholds may need calibration for populations"
      ]
    };
    return JSON.stringify(report, null, 2);
  };

  const generateHumanReport = () => {
    const { computedMetrics, domainScores, riskFlags, sessionData } = processedData;
    
    return `COGNITIVE ASSESSMENT REPORT
===============================

Session: ${sessionData.sessionId}
Date: ${new Date(sessionData.createdAt).toLocaleDateString()}
Duration: ${Math.round(sessionData.durationSec / 60)} minutes

SUMMARY SCORES
--------------
Attention:           ${domainScores.attention.value}/100
Motor Control:       ${domainScores.motorControl?.value || 'N/A'}/100  
Memory:              ${domainScores.memory.value}/100
Processing Speed:    ${domainScores.processingSpeed.value}/100

PERFORMANCE METRICS
------------------
Overall Accuracy:    ${computedMetrics.accuracy_pct}%
Average RT:          ${computedMetrics.avg_rt_ms}ms
RT Variability:      ${computedMetrics.rt_cv.toFixed(3)}
Focus Rate:          ${computedMetrics.gaze_on_screen_pct}%

RISK ASSESSMENT
---------------
ADHD Markers:        ${riskFlags.ADHD.level} (${riskFlags.ADHD.confidence}% confidence)
${riskFlags.ADHD.evidence.map(e => `  • ${e.why}`).join('\n')}

Alzheimer's Markers: ${riskFlags.Alzheimers.level} (${riskFlags.Alzheimers.confidence}% confidence)  
${riskFlags.Alzheimers.evidence.map(e => `  • ${e.why}`).join('\n')}

PTSD Markers:        ${riskFlags.PTSD.level} (${riskFlags.PTSD.confidence}% confidence)
${riskFlags.PTSD.evidence.map(e => `  • ${e.why}`).join('\n')}

RECOMMENDATIONS
---------------
• Continue regular cognitive training exercises
• Monitor attention and reaction time patterns over multiple sessions  
• Consider clinical evaluation if multiple risk markers persist
• Implement stress management techniques for optimal performance

LIMITATIONS
-----------
• This is a screening tool, not diagnostic
• Single session provides limited longitudinal insight
• Webcam-based measurements contain inherent noise
• Thresholds based on research literature, not clinical cut-offs

For clinical interpretation, consider formal assessments (ASRS, MoCA, PCL-5) 
and consultation with qualified healthcare providers.`;
  };

  const exportData = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>Generated Reports</h2>
      <div className="report-tabs">
        <button
          className={`report-tab ${activeTab === 'json' ? 'active' : ''}`}
          onClick={() => setActiveTab('json')}
        >
          JSON Report
        </button>
        <button
          className={`report-tab ${activeTab === 'human' ? 'active' : ''}`}
          onClick={() => setActiveTab('human')}
        >
          Human Report
        </button>
      </div>

      <div className="export-controls">
        <button
          className="btn btn--secondary"
          onClick={() => exportData(
            activeTab === 'json' ? generateJSONReport() : generateHumanReport(),
            `cognitive_report_${processedData.sessionData.sessionId}.${activeTab === 'json' ? 'json' : 'txt'}`
          )}
        >
          Export {activeTab === 'json' ? 'JSON' : 'Text'}
        </button>
      </div>

      <div className="report-content">
        {activeTab === 'json' ? (
          <pre className="json-output">{generateJSONReport()}</pre>
        ) : (
          <pre className="human-report" style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-family-base)' }}>
            {generateHumanReport()}
          </pre>
        )}
      </div>
    </div>
  );
};

const VisualizationsPanel = ({ processedData }) => {
  const [chartsInitialized, setChartsInitialized] = useState(false);

  useEffect(() => {
    if (!processedData || chartsInitialized) return;

    // Small delay to ensure DOM elements are ready
    setTimeout(() => {
      // Create reaction time chart
      const rtCtx = document.getElementById('rtChart');
      if (rtCtx) {
        new Chart(rtCtx, {
          type: 'line',
          data: {
            labels: processedData.sessionData.trial_results.map((_, i) => i + 1),
            datasets: [{
              label: 'Reaction Time (ms)',
              data: processedData.sessionData.trial_results.map(t => t.reaction_time_ms),
              borderColor: '#1FB8CD',
              backgroundColor: 'rgba(31, 184, 205, 0.1)',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Reaction Time (ms)'
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Trial Number'
                }
              }
            }
          }
        });
      }

      // Create domain scores chart
      const domainCtx = document.getElementById('domainChart');
      if (domainCtx) {
        const domainLabels = ['Attention', 'Inhibitory\nControl', 'Processing\nSpeed', 'Motor\nControl', 'Memory', 'Stress\nMgmt'];
        const domainValues = [
          processedData.domainScores.attention.value,
          processedData.domainScores.inhibitoryControl.value,
          processedData.domainScores.processingSpeed.value,
          processedData.domainScores.motorControl?.value || 0,
          processedData.domainScores.memory.value,
          processedData.domainScores.stressManagement.value
        ];

        new Chart(domainCtx, {
          type: 'radar',
          data: {
            labels: domainLabels,
            datasets: [{
              label: 'Domain Scores',
              data: domainValues,
              borderColor: '#1FB8CD',
              backgroundColor: 'rgba(31, 184, 205, 0.2)',
              pointBackgroundColor: '#1FB8CD'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 20
                }
              }
            }
          }
        });
      }

      setChartsInitialized(true);
    }, 100);

  }, [processedData, chartsInitialized]);

  if (!processedData) {
    return (
      <div>
        <h2>Data Visualizations</h2>
        <p>Please load and parse session data first using the Data Input panel.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Data Visualizations</h2>
      
      <div className="chart-container" style={{ position: 'relative', height: '400px' }}>
        <h3 className="chart-title">Reaction Time Over Trials</h3>
        <canvas id="rtChart"></canvas>
      </div>
      
      <div className="chart-container" style={{ position: 'relative', height: '400px' }}>
        <h3 className="chart-title">Domain Scores Radar</h3>
        <canvas id="domainChart"></canvas>
      </div>

      <div className="trial-details">
        <h3>Trial Details</h3>
        {processedData.sessionData.trial_results.slice(0, 10).map(trial => (
          <div key={trial.trial_id} className="trial-item">
            <div className="trial-info">
              <div className="trial-id">Trial {trial.trial_id}</div>
              <div className="trial-stats">{trial.reaction_time_ms}ms • {trial.stimulus}</div>
            </div>
            <div className={`trial-result ${trial.correct ? 'correct' : 'incorrect'}`}>
              {trial.correct ? 'Correct' : 'Incorrect'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Dashboard Component
const CognitiveDashboard = () => {
  const [activePanel, setActivePanel] = useState('input');
  const [jsonData, setJsonData] = useState('');
  const [processedData, setProcessedData] = useState(null);

  const renderPanel = () => {
    switch (activePanel) {
      case 'input':
        return React.createElement(DataInputPanel, { 
          jsonData: jsonData,
          setJsonData: setJsonData,
          processedData: processedData,
          setProcessedData: setProcessedData
        });
      case 'metrics':
        return React.createElement(MetricsPanel, { processedData: processedData });
      case 'domains':
        return React.createElement(DomainScoresPanel, { processedData: processedData });
      case 'risk':
        return React.createElement(RiskAssessmentPanel, { processedData: processedData });
      case 'reports':
        return React.createElement(ReportsPanel, { processedData: processedData });
      case 'visualizations':
        return React.createElement(VisualizationsPanel, { processedData: processedData });
      default:
        return React.createElement(DataInputPanel, { 
          jsonData: jsonData,
          setJsonData: setJsonData,
          processedData: processedData,
          setProcessedData: setProcessedData
        });
    }
  };

  return React.createElement('div', { className: 'dashboard' },
    React.createElement(Sidebar, { activePanel: activePanel, setActivePanel: setActivePanel }),
    React.createElement('div', { className: 'main-content' },
      React.createElement('div', { className: 'header' },
        React.createElement('h1', null, 'Cognitive Assessment Dashboard')
      ),
      React.createElement('div', { className: 'content-area' },
        renderPanel()
      )
    )
  );
};

// Render the application
ReactDOM.render(React.createElement(CognitiveDashboard), document.getElementById('root'));