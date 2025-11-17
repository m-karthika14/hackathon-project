import React from 'react';
import { motion } from 'framer-motion';

const ConditionRiskFlags = () => {
  const conditions = [
    {
      condition: 'ADHD',
      gameMarkers: 'Attention lapses, reaction variance',
      risk: 'medium',
      icon: '⚠️'
    },
    {
      condition: 'Early Alzheimer\'s',
      gameMarkers: 'Memory sequence failures',
      risk: 'low',
      icon: '✅'
    },
    {
      condition: 'PTSD',
      gameMarkers: 'Stress response spikes',
      risk: 'low',
      icon: '✅'
    },
    {
      condition: 'Stress/Burnout',
      gameMarkers: 'Performance degradation',
      risk: 'high',
      icon: '🔴'
    },
    {
      condition: 'Dyslexia',
      gameMarkers: 'Pattern recognition delays',
      risk: 'medium',
      icon: '⚠️'
    },
    {
      condition: 'Anxiety Disorders',
      gameMarkers: 'Motor control fluctuations',
      risk: 'medium',
      icon: '⚠️'
    },
  ];

  const getRiskColors = (risk: string) => {
    switch (risk) {
      case 'low':
        return {
          bg: 'from-green-500/10 to-emerald-500/10',
          border: 'border-green-500/30',
          text: 'text-green-400',
          glow: 'shadow-green-500/20'
        };
      case 'medium':
        return {
          bg: 'from-yellow-500/10 to-orange-500/10',
          border: 'border-yellow-500/30',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/20'
        };
      case 'high':
        return {
          bg: 'from-red-500/10 to-pink-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-red-500/20'
        };
      default:
        return {
          bg: 'from-gray-500/10 to-slate-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          glow: 'shadow-gray-500/20'
        };
    }
  };

  return (
    <motion.section 
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Condition Risk Assessment
        </span>
      </h2>
      
      <motion.div 
        className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
        <div className="absolute inset-0 border border-purple-500/20 rounded-2xl glow-border"></div>
        
        <div className="relative z-10">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-700">
            <div className="text-cyan-400 font-semibold">Condition</div>
            <div className="text-cyan-400 font-semibold">Game Markers</div>
            <div className="text-cyan-400 font-semibold">Risk Flag</div>
          </div>
          
          {/* Table Rows */}
          <div className="space-y-3">
            {conditions.map((item, index) => {
              const colors = getRiskColors(item.risk);
              return (
                <motion.div
                  key={item.condition}
                  className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r ${colors.bg} border ${colors.border} relative group`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 8px 25px ${colors.glow}`
                  }}
                >
                  <div className={`absolute inset-0 border ${colors.border} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-border`}></div>
                  
                  <div className="relative z-10">
                    <div className="text-white font-semibold">{item.condition}</div>
                  </div>
                  
                  <div className="relative z-10">
                    <div className="text-gray-300 text-sm">{item.gameMarkers}</div>
                  </div>
                  
                  <div className="relative z-10 flex items-center">
                    <span className="text-2xl mr-2">{item.icon}</span>
                    <span className={`${colors.text} font-semibold uppercase text-sm`}>
                      {item.risk} Risk
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default ConditionRiskFlags;