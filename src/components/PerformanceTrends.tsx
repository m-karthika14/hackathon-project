import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PerformanceTrends = () => {
  const trendData = [
    { session: '1 Day', neuroBalance: 28, accuracy: 82, reactionTime: 450 },
    { session: '7 Days', neuroBalance: 34, accuracy: 76, reactionTime: 485 },
    { session: '15 Days', neuroBalance: 41, accuracy: 79, reactionTime: 468 },
    { session: '30 Days', neuroBalance: 34, accuracy: 74, reactionTime: 502 },
  ];

  const currentTrend = 'declining';
  const trendChange = -7;

  const heatmapData = [
    { session: '1D', accuracy: 82, reactionTime: 450 },
    { session: '7D', accuracy: 76, reactionTime: 485 },
    { session: '15D', accuracy: 79, reactionTime: 468 },
    { session: '30D', accuracy: 74, reactionTime: 502 },
  ];

  const getTrendIcon = () => {
    if (currentTrend === 'improving') return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (currentTrend === 'declining') return <TrendingDown className="w-5 h-5 text-red-400" />;
    return <Minus className="w-5 h-5 text-gray-400" />;
  };

  const getTrendColor = () => {
    if (currentTrend === 'improving') return 'text-green-400';
    if (currentTrend === 'declining') return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <motion.section 
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
    >
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Performance Trends
        </span>
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Graph */}
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5"></div>
          <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl glow-border"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">NeuroBalance Score Trend</h3>
              <div className={`flex items-center space-x-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="font-semibold">
                  {trendChange > 0 ? '+' : ''}{trendChange}%
                </span>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="session" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <YAxis 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#4B5563' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B',
                      border: '1px solid #0891B2',
                      borderRadius: '12px',
                      color: '#F1F5F9'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="neuroBalance"
                    stroke="#06B6D4"
                    strokeWidth={3}
                    dot={{ fill: '#06B6D4', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#06B6D4', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Performance Heatmap */}
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
          <div className="absolute inset-0 border border-purple-500/20 rounded-2xl glow-border"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white mb-6">Performance Matrix</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 text-sm text-gray-400">
                <div></div>
                <div className="text-center">1D</div>
                <div className="text-center">7D</div>
                <div className="text-center">15D</div>
                <div className="text-center">30D</div>
              </div>
              
              {/* Accuracy Row */}
              <div className="grid grid-cols-5 gap-2">
                <div className="text-sm text-gray-400 flex items-center">Accuracy</div>
                {heatmapData.map((data, index) => {
                  const intensity = data.accuracy / 100;
                  return (
                    <motion.div
                      key={`accuracy-${index}`}
                      className={`h-12 rounded-lg flex items-center justify-center text-white font-semibold text-sm relative overflow-hidden`}
                      style={{
                        backgroundColor: `rgba(6, 182, 212, ${intensity * 0.7})`,
                        border: '1px solid rgba(6, 182, 212, 0.3)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <div className="absolute inset-0 bg-cyan-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10">{data.accuracy}%</span>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Reaction Time Row */}
              <div className="grid grid-cols-5 gap-2">
                <div className="text-sm text-gray-400 flex items-center">Response</div>
                {heatmapData.map((data, index) => {
                  const intensity = 1 - (data.reactionTime - 400) / 200; // Inverted for reaction time
                  return (
                    <motion.div
                      key={`reaction-${index}`}
                      className={`h-12 rounded-lg flex items-center justify-center text-white font-semibold text-sm relative overflow-hidden`}
                      style={{
                        backgroundColor: `rgba(168, 85, 247, ${Math.max(0.2, intensity * 0.7)})`,
                        border: '1px solid rgba(168, 85, 247, 0.3)'
                      }}
                      whileHover={{ scale: 1.05 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      <div className="absolute inset-0 bg-purple-400/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 text-xs">{data.reactionTime}ms</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              Hover over cells for detailed metrics
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default PerformanceTrends;