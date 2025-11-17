import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PTSDGameLog {
  round: number;
  id: string;
  image: string;
  alt: string;
  type: 'Calm' | 'Sudden';
  sound: string;
  labelColor: string;
  chosen: string;
  correct: boolean;
  rt: number;
  appearanceTimestamp: number;
}

interface PTSDReport {
  reportId: string;
  gameDate: string;
  scores: any;
  gameMetrics: any;
  performanceLog: PTSDGameLog[];
  summary: {
    totalTrials: number;
    correctTrials: number;
    averageReactionTime: number;
    stressorImpact: number;
    attentionScore: number;
    inhibitoryErrors: number;
  };
}

interface PTSDLogsData {
  userId: string;
  overallStats: {
    totalGamesPlayed: number;
    totalTrials: number;
    totalCorrect: number;
    overallAccuracy: number;
    averageReactionTime: number;
    calmImagePerformance: PTSDGameLog[];
    suddenImagePerformance: PTSDGameLog[];
  };
  detailedLogs: PTSDReport[];
  message: string;
}

interface PTSDGameLogsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PTSDGameLogs({ isOpen, onClose }: PTSDGameLogsProps) {
  const [logsData, setLogsData] = useState<PTSDLogsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const fetchPTSDLogs = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('No user ID found');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:5000/api/reports/user/${userId}/ptsd-logs`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PTSD logs: ${response.statusText}`);
      }
      
      const data: PTSDLogsData = await response.json();
      setLogsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch PTSD logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPTSDLogs();
    }
  }, [isOpen]);

  const exportToCSV = () => {
    if (!logsData) return;

    const csvHeaders = [
      'Session', 'Date', 'Round', 'Image Type', 'Sound', 'Target Color', 
      'Chosen Color', 'Correct', 'Reaction Time (ms)', 'Appearance Time'
    ];

    const csvRows = logsData.detailedLogs.flatMap((session, sessionIndex) =>
      session.performanceLog.map((log) => [
        sessionIndex + 1,
        new Date(session.gameDate).toLocaleDateString(),
        log.round,
        log.type,
        log.sound,
        log.labelColor,
        log.chosen,
        log.correct ? 'Yes' : 'No',
        log.rt,
        new Date(log.appearanceTimestamp).toLocaleTimeString()
      ])
    );

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ptsd_game_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 border border-cyan-500/30 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 p-6 border-b border-cyan-500/30">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                🧠 PTSD Game Performance Logs
              </h2>
              <p className="text-cyan-300">
                Neuro-Cognitive Response Test Data Analysis
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                disabled={!logsData || logsData.detailedLogs.length === 0}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                📊 Export CSV
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 text-sm font-medium"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
              <span className="ml-3 text-cyan-300">Loading PTSD logs...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300">❌ {error}</p>
            </div>
          )}

          {logsData && (
            <div className="space-y-6">
              {/* Overall Statistics */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-xl font-bold text-white mb-4">📊 Overall Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Games Played</p>
                    <p className="text-white text-2xl font-bold">{logsData.overallStats.totalGamesPlayed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Total Trials</p>
                    <p className="text-white text-2xl font-bold">{logsData.overallStats.totalTrials}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Accuracy</p>
                    <p className="text-white text-2xl font-bold">{logsData.overallStats.overallAccuracy.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Avg. Reaction</p>
                    <p className="text-white text-2xl font-bold">{Math.round(logsData.overallStats.averageReactionTime)}ms</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Calm Images</p>
                    <p className="text-white text-2xl font-bold">{logsData.overallStats.calmImagePerformance.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-cyan-400 text-sm">Sudden Images</p>
                    <p className="text-white text-2xl font-bold">{logsData.overallStats.suddenImagePerformance.length}</p>
                  </div>
                </div>
              </div>

              {/* Session List */}
              <div className="bg-gray-800/50 rounded-xl p-6 border border-cyan-500/30">
                <h3 className="text-xl font-bold text-white mb-4">🎮 Game Sessions</h3>
                {logsData.detailedLogs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No PTSD game sessions found.</p>
                ) : (
                  <div className="space-y-3">
                    {logsData.detailedLogs.map((session, index) => (
                      <div key={session.reportId} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="text-white font-medium">
                              Session {index + 1} - {new Date(session.gameDate).toLocaleDateString()} {new Date(session.gameDate).toLocaleTimeString()}
                            </h4>
                            <div className="flex gap-6 mt-2 text-sm text-gray-300">
                              <span>🎯 {session.summary.correctTrials}/{session.summary.totalTrials} correct</span>
                              <span>⚡ {Math.round(session.summary.averageReactionTime)}ms avg</span>
                              <span>🧠 {session.summary.attentionScore}% attention</span>
                              <span>❌ {session.summary.inhibitoryErrors} errors</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedSession(selectedSession === index ? null : index)}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm transition-all duration-200"
                          >
                            {selectedSession === index ? 'Hide Details' : 'Show Details'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {selectedSession === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 border-t border-gray-700 pt-4 overflow-hidden"
                            >
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-cyan-400 border-b border-gray-700">
                                      <th className="text-left p-2">Round</th>
                                      <th className="text-left p-2">Image Type</th>
                                      <th className="text-left p-2">Sound</th>
                                      <th className="text-left p-2">Target</th>
                                      <th className="text-left p-2">Chosen</th>
                                      <th className="text-left p-2">Result</th>
                                      <th className="text-left p-2">Time (ms)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {session.performanceLog.map((log) => (
                                      <tr key={`${session.reportId}-${log.round}`} className="text-gray-300 border-b border-gray-800">
                                        <td className="p-2">{log.round}</td>
                                        <td className="p-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            log.type === 'Calm' ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                                          }`}>
                                            {log.type}
                                          </span>
                                        </td>
                                        <td className="p-2 text-xs">{log.sound}</td>
                                        <td className="p-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            log.labelColor === 'Red' ? 'bg-red-600 text-white' :
                                            log.labelColor === 'Blue' ? 'bg-blue-600 text-white' :
                                            log.labelColor === 'Green' ? 'bg-green-600 text-white' :
                                            'bg-yellow-600 text-black'
                                          }`}>
                                            {log.labelColor}
                                          </span>
                                        </td>
                                        <td className="p-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            log.chosen === 'Red' ? 'bg-red-600 text-white' :
                                            log.chosen === 'Blue' ? 'bg-blue-600 text-white' :
                                            log.chosen === 'Green' ? 'bg-green-600 text-white' :
                                            'bg-yellow-600 text-black'
                                          }`}>
                                            {log.chosen}
                                          </span>
                                        </td>
                                        <td className="p-2">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            log.correct ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'
                                          }`}>
                                            {log.correct ? '✓' : '✗'}
                                          </span>
                                        </td>
                                        <td className="p-2">{log.rt}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
