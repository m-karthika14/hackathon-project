import React from 'react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  name: string;
  value: number;
  status: 'good' | 'at-risk' | 'strong-risk';
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ name, value, status, icon }) => {
  const getStatusColors = () => {
    switch (status) {
      case 'good':
        return {
          border: 'border-green-500/30',
          bg: 'from-green-500/10 to-emerald-500/10',
          text: 'text-green-400',
          glow: 'shadow-green-500/20'
        };
      case 'at-risk':
        return {
          border: 'border-yellow-500/30',
          bg: 'from-yellow-500/10 to-orange-500/10',
          text: 'text-yellow-400',
          glow: 'shadow-yellow-500/20'
        };
      case 'strong-risk':
        return {
          border: 'border-red-500/30',
          bg: 'from-red-500/10 to-pink-500/10',
          text: 'text-red-400',
          glow: 'shadow-red-500/20'
        };
    }
  };

  const colors = getStatusColors();
  const statusText = status.replace('-', ' ').toUpperCase();

  return (
    <motion.div 
      className={`bg-slate-900/50 backdrop-blur-sm border ${colors.border} rounded-xl p-4 relative overflow-hidden group`}
      whileHover={{ 
        scale: 1.05,
        boxShadow: `0 10px 30px ${colors.glow}`
      }}
      transition={{ duration: 0.3 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-50`}></div>
      <div className={`absolute inset-0 border ${colors.border} rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 glow-border`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl">{icon}</span>
          <span className={`text-xs px-2 py-1 rounded-full bg-slate-800/50 ${colors.text} border ${colors.border}`}>
            {statusText}
          </span>
        </div>
        
        <h3 className="text-white font-semibold text-sm mb-2">{name}</h3>
        
        <div className="flex items-end justify-between">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {value}
          </span>
          <span className="text-gray-400 text-xs">/100</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${colors.bg.replace('/10', '/60')}`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;