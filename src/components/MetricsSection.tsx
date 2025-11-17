import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from './MetricCard';

interface MetricsSectionProps {
  stressLevel: 'low' | 'moderate' | 'high';
}

const MetricsSection: React.FC<MetricsSectionProps> = ({ stressLevel }) => {
  const metrics = [
    { name: 'Attention', value: 72, status: 'good' as const, icon: '🎯' },
    { name: 'Motor Control', value: 45, status: 'at-risk' as const, icon: '🎮' },
    { name: 'Cognitive Load', value: 28, status: 'strong-risk' as const, icon: '🧠' },
    { name: 'Environmental Stress', value: 65, status: 'good' as const, icon: '🌍' },
    { name: 'Behavioral Stability', value: 58, status: 'at-risk' as const, icon: '⚖️' },
    { name: 'NeuroBalance', value: 34, status: 'strong-risk' as const, icon: '⚡' },
  ];

  const radarData = metrics.map(metric => ({
    subject: metric.name.split(' ')[0],
    value: metric.value,
    fullMark: 100,
    name: metric.name, // Full name for tooltip
  }));

  // Debug logging to check data
  console.log('MetricsSection radarData:', radarData);

  const getStressColor = () => {
    switch (stressLevel) {
      case 'low': return 'from-cyan-500 to-blue-500';
      case 'moderate': return 'from-yellow-500 to-orange-500';
      case 'high': return 'from-red-500 to-pink-500';
    }
  };

  return (
    <motion.section 
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        <span className={`bg-gradient-to-r ${getStressColor()} bg-clip-text text-transparent`}>
          Core Cognitive Metrics
        </span>
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart */}
        <motion.div 
          className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5"></div>
          <div className="absolute inset-0 border border-purple-500/20 rounded-2xl glow-border"></div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Cognitive Profile Overview</h3>
            <div className="h-80 bg-slate-800/30 rounded-lg p-4">
              {/* Simple CSS Bar Chart */}
              <div className="h-full flex items-end justify-around gap-2">
                {radarData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center h-full justify-end">
                    {/* Bar */}
                    <div 
                      className="bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-md mb-2 transition-all duration-500 hover:from-cyan-500 hover:to-cyan-300 cursor-pointer group relative min-w-[60px]"
                      style={{ 
                        height: `${item.value}%`,
                        minHeight: '10px'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.name}: {item.value}
                      </div>
                    </div>
                    {/* Label */}
                    <div className="text-white text-xs text-center transform -rotate-45 mt-2">
                      {item.subject}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Y-axis labels */}
              <div className="absolute left-2 top-4 h-64 flex flex-col justify-between text-gray-400 text-xs">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
            </div>
            
            {/* Fallback: Try Recharts as well */}
            <div className="h-80 mt-4 border border-gray-600 rounded-lg p-2">
              <div className="text-white text-sm mb-2">Recharts Version:</div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#666" />
                  <XAxis dataKey="subject" tick={{ fill: '#fff', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#fff', fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <MetricCard {...metric} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default MetricsSection;