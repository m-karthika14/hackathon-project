import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Activity, Zap } from 'lucide-react';

const DetailedInsights = () => {
  const insights = [
    {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
      text: "Reaction time slowed 35% under loud sounds, suggesting environmental sensitivity affecting cognitive performance.",
      severity: 'medium'
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-red-400" />,
      text: "Performance dropped 28% after repeated trials, indicating potential cognitive fatigue and reduced sustained attention.",
      severity: 'high'
    },
    {
      icon: <Activity className="w-6 h-6 text-cyan-400" />,
      text: "Accuracy remained stable but reaction time variance suggests attention lapses during complex tasks.",
      severity: 'low'
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      text: "Motor control showed improvement in structured environments but declined under stress conditions.",
      severity: 'medium'
    }
  ];

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'low':
        return {
          bg: 'from-green-500/10 to-emerald-500/10',
          border: 'border-green-500/20',
          glow: 'shadow-green-500/20'
        };
      case 'medium':
        return {
          bg: 'from-yellow-500/10 to-orange-500/10',
          border: 'border-yellow-500/20',
          glow: 'shadow-yellow-500/20'
        };
      case 'high':
        return {
          bg: 'from-red-500/10 to-pink-500/10',
          border: 'border-red-500/20',
          glow: 'shadow-red-500/20'
        };
      default:
        return {
          bg: 'from-gray-500/10 to-slate-500/10',
          border: 'border-gray-500/20',
          glow: 'shadow-gray-500/20'
        };
    }
  };

  return (
    <motion.section 
      className="mb-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
    >
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
          Detailed Insights
        </span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight, index) => {
          const colors = getSeverityColors(insight.severity);
          return (
            <motion.div
              key={index}
              className={`bg-slate-900/50 backdrop-blur-sm border ${colors.border} rounded-2xl p-6 relative overflow-hidden group`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
              whileHover={{ 
                scale: 1.03,
                boxShadow: `0 10px 30px ${colors.glow}`
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`}></div>
              <div className={`absolute inset-0 border ${colors.border} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-border`}></div>
              
              <div className="relative z-10 flex items-start space-x-4">
                <motion.div
                  className="flex-shrink-0 p-3 bg-slate-800/50 rounded-full border border-gray-600"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {insight.icon}
                </motion.div>
                
                <div className="flex-1">
                  <p className="text-gray-200 leading-relaxed">
                    {insight.text}
                  </p>
                  
                  <div className="mt-3 flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      insight.severity === 'low' ? 'bg-green-400' :
                      insight.severity === 'medium' ? 'bg-yellow-400' :
                      'bg-red-400'
                    }`}></div>
                    <span className={`text-xs uppercase font-semibold tracking-wide ${
                      insight.severity === 'low' ? 'text-green-400' :
                      insight.severity === 'medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {insight.severity} Priority
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};

export default DetailedInsights;