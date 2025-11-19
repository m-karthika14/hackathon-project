# User Report Data Mapping

## User ID: `691e068b0c4975c081cec5eb`

### ✅ Real Data from adhdAnalysisReport

Based on the MongoDB document structure provided, here's what will be displayed on the Report Page:

---

## 📊 Cognitive Performance Metrics (Radar Chart + Metric Boxes)

| Metric | Real Value | Source Field |
|--------|------------|--------------|
| **Cognitive Performance** | **61.08** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.cognitivePerformance` |
| **Attention** | **56.58** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.finalAttention` |
| **Motor Control** | **65.52** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.motorControl` |
| **Cognitive Load** | **58.31** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.cognitiveLoad` |
| **Behavioral Stability** | **60.26** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.behavioralStability` |
| **NeuroBalance** | **68.00** | `adhdAnalysisReport.gamesAnalyzed[0].metrics.neuroBalance` |

---

## 📈 30-Day Performance Trend

**Current Score (Cognitive Performance):** `61.08`

**Auto-Generated Progressive Trend:**
- Starts at: `46` (61.08 - 15)
- Ends at: `61` (current score)
- **13 data points** over 30 days showing gradual improvement

The trend graph will display a progressive increase from Day 1 to Day 30.

---

## 💡 Dynamic Insights & Health Tips

**Score:** `61.08` → Falls into **Zone 13** (Score range: 57-60)

**Zone Details:**
- **Level:** "Good" Performance
- **Color Theme:** Green (positive)
- **3 Personalized Insights** based on Zone 13
- **3 Health Tips** with dynamic icons based on Zone 13

---

## 🔄 Data Flow

```
1. User logs in → JWT token stored in localStorage
2. Report Page loads → Fetches from /api/auth/adhd-analysis
3. Backend checks User document for adhdAnalysisReport field
4. Extracts metrics from gamesAnalyzed[0].metrics
5. Frontend displays:
   ✅ Radar chart with 5 real metrics
   ✅ 5 metric boxes with real scores
   ✅ 30-day trend generated from cognitivePerformance
   ✅ Zone 13 insights and tips
   ✅ "Continue playing 30 days" messages
```

---

## 🎯 Expected Display Values

### Radar Chart:
- **Attention:** 57/100 (rounded from 56.58)
- **Motor Control:** 66/100 (rounded from 65.52)
- **Cognitive Load:** 58/100 (rounded from 58.31)
- **Behavioral Stability:** 60/100 (rounded from 60.26)
- **NeuroBalance:** 68/100 (rounded from 68.00)

### Metric Cards:
Same 5 values displayed as individual cards below the radar chart

### 30-Day Trend Line:
Progressive increase from 46 → 61 over 30 days

### Insights Section:
Shows **Zone 13** ("Good" performance) with 3 detailed insights

### Health Tips:
Shows 3 health tips from Zone 13 with icons

---

## ✅ Verification Steps

1. Open browser: http://localhost:5175
2. Login with user ID: `691e068b0c4975c081cec5eb`
3. Navigate to Report Page
4. Check browser console for:
   - `✅ Found adhdAnalysisReport in User document for: 691e068b0c4975c081cec5eb`
   - `✅ Loaded ALL metrics from adhdAnalysisReport: { cognitivePerformance: 61.08, ... }`
   - `📊 Zone: Good | Score: 61.08`

5. Verify displayed values match the table above

---

## 📝 Note

Since this user only has **1 game analyzed**, the system uses that session's metrics. As the user plays more games (sessions), the system will use the **latest game** from the `gamesAnalyzed` array.

The 30-day trend is auto-generated because this is early-stage data. After 30 days of continuous play, real historical data will replace the generated trend.
