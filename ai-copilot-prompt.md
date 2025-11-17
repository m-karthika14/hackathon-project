# 🎯 AI Copilot Integration Prompt for React Cognitive Assessment Dashboard

## 📋 MASTER PROMPT FOR YOUR AI ASSISTANT

Copy and paste this prompt into your AI coding assistant (GitHub Copilot, Claude, ChatGPT, etc.) when implementing each component:

---

**CONTEXT:**
I'm building a React-based cognitive assessment dashboard for healthcare professionals to screen for ADHD, PTSD, and Alzheimer's risk. This is a medical-grade application that processes session data containing game metrics, vision tracking, and trial results to compute cognitive scores and generate evidence-based risk assessments.

**PROJECT STRUCTURE:**
```
src/
├── components/
│   ├── CognitiveAssessmentDashboard.js  ✅ (Main dashboard - COMPLETED)
│   ├── DataParser.js                    ✅ (JSON validation - COMPLETED) 
│   ├── MetricsCalculator.js             ✅ (Metrics computation - COMPLETED)
│   ├── DomainScores.js                  🚧 (CURRENT FILE)
│   ├── RiskAssessment.js                ⏳ (Next)
│   ├── ReportGenerator.js               ⏳ (Next)
│   ├── Visualizations.js                ⏳ (Next)
│   └── UserInterface.js                 ⏳ (Next)
├── utils/
│   ├── calculations.js                  ✅ (COMPLETED)
│   ├── constants.js                     ⏳
│   └── formatters.js                    ⏳
├── data/
│   └── mockData.js                      ✅ (COMPLETED)
└── styles/
    ├── Dashboard.css                    ✅ (COMPLETED)
    └── Components.css                   ✅ (COMPLETED)
```

**CURRENT TASK:** Implement [COMPONENT_NAME]

**COMPONENT SPECIFICATIONS:**

### For DomainScores.js:
Create a React component that:
1. Receives sessionData and computedMetrics as props
2. Calculates 8 domain scores (0-100 scale): attention, inhibitoryControl, processingSpeed, motorControl, cognitiveLoad, memory, neuroBalance, stressManagement
3. Displays each score with progress bars, color coding, calculation formulas, and input values
4. Uses the calculateDomainScores function from utils/calculations.js
5. Shows color-coded status: excellent (90+), good (70-89), moderate (50-69), poor (<50)

### For RiskAssessment.js:
Create a React component that:
1. Assesses ADHD, PTSD, and Alzheimer's risk using specific thresholds
2. Returns risk level (Low/Moderate/High), confidence score (0-100%), and evidence list
3. ADHD: Check RT variability >0.6, short RT rate >10%, inhibitory errors >5%, blink rate >25
4. PTSD: Check stress score ≥40, gaze avoidance patterns
5. Alzheimer's: Check avg RT >2000ms, memory accuracy <70%, gaze tracking <80%
6. Display risk cards with evidence bullets and confidence meters

### For ReportGenerator.js:
Create a React component that:
1. Generates both JSON (machine-readable) and human-readable reports
2. JSON report follows exact schema with all computed metrics, domain scores, risk flags
3. Human report includes summary, risk highlights, recommendations for users/clinicians
4. Export functionality (JSON download, PDF generation, print)
5. Two-tab interface switching between report types

### For Visualizations.js:
Create a React component that:
1. Uses Recharts library for interactive charts
2. Reaction time over trials (line chart)
3. Domain scores radar chart
4. Risk assessment bar chart
5. Trial performance scatter plot
6. Responsive design with proper legends and tooltips

**TECHNICAL REQUIREMENTS:**
- Use React functional components with hooks (useState, useEffect, useMemo)
- Follow established patterns from completed components
- Include comprehensive error handling and loading states
- Use className-based styling (classes already defined in CSS files)
- Make components responsive and accessible
- Add JSDoc comments for all functions
- Handle edge cases and missing data gracefully

**DATA STRUCTURES:**
```javascript
// sessionData structure
{
  sessionId: "session_123",
  gameMetrics: { totalTrials: 60, correctTrials: 48, averageReactionTime: 725, inhibitoryErrors: 5, memoryErrors: 4, mazeCollisions: 15 },
  visionMetrics: { blinkRate: 28, gazeOnScreenPct: 84, attentionScore: 78, stressScore: 32 },
  trial_results: [{ trial_id: 1, reaction_time_ms: 456, correct: true }]
}

// computedMetrics structure  
{
  accuracy_pct: 80.0,
  avg_rt_ms: 725,
  rt_cv: 0.45,
  short_rt_rate_pct: 8.3,
  blink_rate_per_min: 28
}
```

**STYLING CLASSES AVAILABLE:**
- `.domain-scores-container`, `.domain-score-card`, `.progress-bar`, `.progress-fill`
- `.risk-assessment-container`, `.risk-card`, `.risk-level`, `.evidence-list`
- `.report-generator-container`, `.report-tabs`, `.export-btn`
- `.metrics-grid`, `.status-indicator`, `.loading-spinner`

**INTEGRATION PATTERN:**
```javascript
const ComponentName = ({ sessionData, computedMetrics, onDataCalculated }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (sessionData && computedMetrics) {
      // Process data
      const result = processData(sessionData, computedMetrics);
      setData(result);
      onDataCalculated?.(result);
    }
  }, [sessionData, computedMetrics]);

  if (!sessionData) return <div>No data available</div>;
  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div className="component-container">
      {/* Component content */}
    </div>
  );
};
```

**SPECIFIC INSTRUCTIONS FOR CURRENT COMPONENT:**
[Replace this with specific requirements for the component you're implementing]

Please implement this component following React best practices, ensuring it integrates seamlessly with the existing dashboard architecture. Include proper TypeScript-style prop validation comments and comprehensive error handling.

---

## 🛠️ STEP-BY-STEP IMPLEMENTATION WORKFLOW

### Phase 1: Setup (5 minutes)
1. Create React project: `npx create-react-app cognitive-assessment-dashboard`
2. Install dependencies: `npm install recharts react-json-view date-fns lodash`
3. Create folder structure as outlined above

### Phase 2: Core Components (20-30 minutes)
1. **Copy provided files** (App.js, CognitiveAssessmentDashboard.js, DataParser.js, MetricsCalculator.js)
2. **Copy CSS files** (Dashboard.css, Components.css)
3. **Copy utility files** (calculations.js, mockData.js)

### Phase 3: AI-Assisted Implementation (15-20 minutes per component)
Use the master prompt above for each remaining component:

#### For DomainScores.js:
```
[PASTE MASTER PROMPT ABOVE]
CURRENT TASK: Implement DomainScores.js
SPECIFIC INSTRUCTIONS: Create domain score cards with progress bars, show calculation formulas, color-code by performance level (excellent/good/moderate/poor)
```

#### For RiskAssessment.js:
```
[PASTE MASTER PROMPT ABOVE]
CURRENT TASK: Implement RiskAssessment.js  
SPECIFIC INSTRUCTIONS: Create risk assessment cards for ADHD/PTSD/Alzheimer's with confidence meters and evidence lists
```

#### For ReportGenerator.js:
```
[PASTE MASTER PROMPT ABOVE]
CURRENT TASK: Implement ReportGenerator.js
SPECIFIC INSTRUCTIONS: Create tabbed interface with JSON and human-readable reports, add export functionality
```

#### For Visualizations.js:
```
[PASTE MASTER PROMPT ABOVE]
CURRENT TASK: Implement Visualizations.js
SPECIFIC INSTRUCTIONS: Create interactive charts using Recharts - line chart, radar chart, bar chart, scatter plot
```

### Phase 4: Testing & Refinement (10 minutes)
1. Run `npm start` and test each component
2. Load sample data and verify all calculations
3. Test responsive design on different screen sizes
4. Check accessibility and error handling

## 🎯 KEY SUCCESS METRICS

**✅ Component Integration Checklist:**
- [ ] Component receives props correctly
- [ ] Data flows between components properly  
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] Responsive design works on mobile
- [ ] Accessibility features included
- [ ] CSS classes applied correctly
- [ ] Real-time updates when data changes

**✅ Medical Application Standards:**
- [ ] Accurate mathematical calculations
- [ ] Evidence-based risk thresholds
- [ ] Professional UI suitable for healthcare
- [ ] Clear data visualization
- [ ] Comprehensive error handling
- [ ] Export functionality works
- [ ] Reports are clinically relevant

## 🚀 QUICK START COMMANDS

```bash
# 1. Create project
npx create-react-app cognitive-assessment-dashboard
cd cognitive-assessment-dashboard

# 2. Install dependencies
npm install recharts react-json-view date-fns lodash

# 3. Start development server
npm start

# 4. Open browser to http://localhost:3000
```

## 📞 TROUBLESHOOTING GUIDE

**Common Issues & Solutions:**

1. **Import errors:** Ensure all files are in correct folders with proper case-sensitive names
2. **CSS not loading:** Check import statements in App.js for CSS files
3. **Component not rendering:** Verify props are passed correctly from parent components
4. **Calculations incorrect:** Check utils/calculations.js implementation matches formulas
5. **Charts not displaying:** Ensure Recharts is installed and data format is correct

**Need Help?** Use this prompt template:
```
I'm having trouble with [SPECIFIC ISSUE] in my React cognitive assessment dashboard. The error is: [ERROR MESSAGE]. The component should [EXPECTED BEHAVIOR]. Here's my current code: [CODE SNIPPET]
```

This comprehensive guide ensures successful implementation of your cognitive assessment dashboard with AI assistance!