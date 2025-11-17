import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { Download, RotateCcw, Brain, User, Calendar, Clock, Activity, Zap, Target, TrendingDown, AlertCircle } from 'lucide-react';
// import { format } from 'date-fns';
import NeonButton from '../components/ui/NeonButton';
import PerformanceTrends from '../components/PerformanceTrends';
import ConditionRiskFlags from '../components/ConditionRiskFlags';
import DetailedInsights from '../components/DetailedInsights';

// Sample data - replace with actual data fetching
const sampleData = {
  "userId": "Guest_001",
  "createdAt": "2023-10-10T12:00:00Z",
  "durationSec": 1475,
  "gameMetrics": [
    { "name": "Attention", "value": 75 },
    { "name": "Motor Control", "value": 82 },
    { "name": "Cognitive Load", "value": 68 },
    { "name": "Environmental Stress", "value": 9 },
    { "name": "Behavioral Stability", "value": 77 },
    { "name": "NeuroBalance", "value": 84 }
  ],
  "visionMetrics": {
    "contrastSensitivity": 1.5,
    "colorVision": "normal",
    "depthPerception": "slight deficit",
    "visualAcuity": "20/25",
    "pupilEstimate": 3.2
  }
};

const ReportPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(sampleData);
  const [scores, setScores] = useState<number[]>([75, 82, 68, 91, 77, 84]); // 6 metrics now
  const [showContent, setShowContent] = useState(false);
  const [showPTSDLogs, setShowPTSDLogs] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportId, setReportId] = useState('');
  const [currentReport, setCurrentReport] = useState(null);
  const [allReports, setAllReports] = useState([]);

  useEffect(() => {
    const fetchAllReports = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/reports');
        if (response.ok) {
          const data = await response.json();
          setAllReports(data);
        } else {
          throw new Error('Failed to fetch reports');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAllReports();
  }, []);

  useEffect(() => {
    const storedScores = sessionStorage.getItem('gameScores');
    if (storedScores) {
      const gameScores = JSON.parse(storedScores);
      // Convert 5 game scores to 6 cognitive metrics
      const cognitiveScores = [
        gameScores[0] || 75, // Attention (from typing)
        gameScores[1] || 82, // Motor Control (from maze)
        gameScores[2] || 68, // Cognitive Load (from reaction)
        100 - (gameScores[3] || 9), // Environmental Stress (inverted from memory)
        gameScores[4] || 77, // Behavioral Stability (from trails)
        Math.round(gameScores.reduce((a: number, b: number) => a + b, 0) / gameScores.length) || 84 // NeuroBalance (average)
      ];
      setScores(cognitiveScores);
    }
    
    // Show content after a delay
    setTimeout(() => setShowContent(true), 1000);
  }, []);

  const cognitiveMetrics = [
    { name: 'Attention', score: scores[0], icon: <Target className="w-5 h-5" /> },
    { name: 'Motor Control', score: scores[1], icon: <Activity className="w-5 h-5" /> },
    { name: 'Cognitive Load', score: scores[2], icon: <Brain className="w-5 h-5" /> },
    { name: 'Environmental Stress', score: scores[3], icon: <AlertCircle className="w-5 h-5" /> },
    { name: 'Behavioral Stability', score: scores[4], icon: <Zap className="w-5 h-5" /> },
    { name: 'NeuroBalance', score: scores[5], icon: <TrendingDown className="w-5 h-5" /> },
  ];

  const radarData = cognitiveMetrics.map(metric => ({
    metric: metric.name,
    score: metric.score,
    fullMark: 100,
  }));

  const riskFlags = [
    {
      condition: 'ADHD',
      gameMarkers: ['Attention Lapses', 'Reaction Variance'],
      riskLevel: scores[0] < 50 ? 'high' : scores[0] < 70 ? 'moderate' : 'low'
    },
    {
      condition: 'Early Alzheimer\'s',
      gameMarkers: ['Memory Decline', 'Processing Speed'],
      riskLevel: scores[2] < 40 ? 'high' : scores[2] < 60 ? 'moderate' : 'low'
    },
    {
      condition: 'PTSD',
      gameMarkers: ['Stress Response', 'Hypervigilance'],
      riskLevel: scores[3] > 70 ? 'high' : scores[3] > 50 ? 'moderate' : 'low'
    },
    {
      condition: 'Stress',
      gameMarkers: ['Cortisol Markers', 'Performance Drop'],
      riskLevel: scores[3] > 60 ? 'high' : scores[3] > 40 ? 'moderate' : 'low'
    },
    {
      condition: 'Burnout',
      gameMarkers: ['Fatigue Patterns', 'Motivation Loss'],
      riskLevel: scores[4] < 50 ? 'high' : scores[4] < 70 ? 'moderate' : 'low'
    },
    {
      condition: 'Dyslexia',
      gameMarkers: ['Reading Speed', 'Pattern Recognition'],
      riskLevel: scores[1] < 50 ? 'moderate' : 'low'
    }
  ] as const;

  const trendData = [
    { session: 'Day 1', neuroBalance: scores[5] - 15, day: 1 },
    { session: 'Day 7', neuroBalance: scores[5] - 8, day: 7 },
    { session: 'Day 15', neuroBalance: scores[5] - 3, day: 15 },
    { session: 'Day 30', neuroBalance: scores[5], day: 30 },
  ];

  const insights = [
    {
      icon: <Zap className="w-4 h-4" />,
      text: `Reaction time slowed ${Math.round(Math.random() * 20 + 15)}% under high cognitive load conditions.`,
      type: 'warning' as const
    },
    {
      icon: <TrendingDown className="w-4 h-4" />,
      text: `Performance dropped ${Math.round(Math.random() * 15 + 20)}% after repeated trials, suggesting mental fatigue.`,
      type: 'neutral' as const
    },
    {
      icon: <Target className="w-4 h-4" />,
      text: "Accuracy remained stable but reaction time variance suggests attention lapses during sustained tasks.",
      type: 'neutral' as const
    },
    {
      icon: <Brain className="w-4 h-4" />,
      text: "Working memory performance indicates strong analytical thinking and information processing abilities.",
      type: 'positive' as const
    },
    {
      icon: <Activity className="w-4 h-4" />,
      text: "Motor control precision suggests well-optimized neural pathways with minimal cognitive interference.",
      type: 'positive' as const
    }
  ];

  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const sessionDate = new Date();
  const sessionDuration = '24:35'; // This would come from actual session tracking

  // Determine stress level for adaptive UI
  const stressLevel = scores[3] > 70 ? 'high' : scores[3] > 40 ? 'moderate' : 'low';
  const getStressAccent = () => {
    switch (stressLevel) {
      case 'high': return 'neon-pink';
      case 'moderate': return 'yellow-400';
      default: return 'neon-cyan';
    }
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem('gameScores');
    navigate('/games');
  };

  const handleDownload = () => {
    alert('Report download feature would be implemented here');
  };

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const insights = await response.json();
      setAiInsight(insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReport = async (id) => {
    if (!id) {
      setError('Please enter a Report ID');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${id}`);
      if (!response.ok) {
        throw new Error('Report not found');
      }
      const reportData = await response.json();
      setCurrentReport(reportData);
      setData(reportData.sessionData || reportData); // Handle both schema versions
      if (reportData.aiJsonReport && reportData.aiTextReport) {
        setAiInsight({
          jsonReport: reportData.aiJsonReport,
          textReport: reportData.aiTextReport,
        });
      } else {
        setAiInsight(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAndSaveInsights = async () => {
    if (!currentReport) {
      setError('Please fetch a report first');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${currentReport._id}/generate-insights`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate and save insights');
      }

      const updatedReport = await response.json();
      setCurrentReport(updatedReport);
      setAiInsight({
        jsonReport: updatedReport.aiJsonReport,
        textReport: updatedReport.aiTextReport,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSelection = (selectedReportId) => {
    setReportId(selectedReportId);
    // Automatically fetch the selected report
    handleFetchReport(selectedReportId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          title="Cognitive & Behavioral Profile Report"
          subtitle="This is not a diagnosis. Results highlight patterns and potential risks."
          userId={data.userId}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="my-8">
              <NeonButton onClick={handleGenerateInsights} disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Analyze Sample Data'}
              </NeonButton>
            </div>

            <div className="my-8 flex items-center gap-4">
              <input
                type="text"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                placeholder="Enter Report ID to Fetch"
                className="bg-gray-800 border border-cyan-400 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <NeonButton onClick={() => handleFetchReport(reportId)} disabled={isLoading}>
                {isLoading ? 'Fetching...' : 'Fetch Report'}
              </NeonButton>
              <NeonButton onClick={handleGenerateAndSaveInsights} disabled={!currentReport || isLoading}>
                {isLoading ? 'Analyzing...' : 'Generate & Save Insights'}
              </NeonButton>
            </div>

            {error && <div className="text-red-500 bg-red-900 p-4 rounded-lg my-4">{`Error: ${error}`}</div>}

            {currentReport && (
              <div className="bg-gray-800 p-4 rounded-lg mb-8">
                <h3 className="text-xl font-bold text-cyan-400">Current Report</h3>
                <p>ID: {currentReport._id}</p>
                <p>Session ID: {currentReport.sessionId || 'N/A'}</p>
                <p>User ID: {currentReport.userId}</p>
                <p>Game Type: {currentReport.gameType}</p>
              </div>
            )}

            {aiInsight && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Human-Readable Report</h2>
                  <pre className="whitespace-pre-wrap font-mono text-sm">{aiInsight.textReport}</pre>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h2 className="text-2xl font-bold mb-4 text-cyan-400">Machine-Readable JSON</h2>
                  <pre className="whitespace-pre-wrap font-mono text-sm">{JSON.stringify(aiInsight.jsonReport, null, 2)}</pre>
                </div>
              </div>
            )}

            <MetricsSection gameMetrics={data.gameMetrics} visionMetrics={data.visionMetrics} />
            <PerformanceTrends trials={data.trial_results || data.performanceLog} />
            <ConditionRiskFlags flags={data.riskFlags} />
            <DetailedInsights insights={data.insights} />
          </div>

          {/* Reports List Sidebar */}
          <div className="md:col-span-1 bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">All Reports</h2>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              {allReports.length > 0 ? (
                allReports.map((report) => (
                  <div
                    key={report._id}
                    onClick={() => handleReportSelection(report._id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      reportId === report._id
                        ? 'bg-cyan-600'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <p className="font-bold">{report.gameType}</p>
                    <p className="text-sm text-gray-300">User: {report.userId}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>No reports found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;