import React from 'react';
import { motion } from 'framer-motion';

interface ScoreCardProps {
  title: string;
  score: number;
  color: string;
  delay?: number;
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, color, delay = 0 }) => {
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      purple: 'text-neon-purple border-neon-purple',
      blue: 'text-neon-blue border-neon-blue',
      pink: 'text-neon-pink border-neon-pink',
      cyan: 'text-neon-cyan border-neon-cyan',
      green: 'text-green-400 border-green-400',
    };
    return colorMap[color] || 'text-neon-purple border-neon-purple';
  };

  const getGlowClass = (color: string) => {
    const glowMap: { [key: string]: string } = {
      purple: 'neon-glow',
      blue: 'neon-glow-blue',
      pink: 'neon-glow-pink',
      cyan: 'neon-glow-cyan',
      green: 'shadow-lg',
    };
    return glowMap[color] || 'neon-glow';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: "easeOut" }}
      className={`bg-dark-card bg-opacity-50 backdrop-blur-md rounded-xl p-6 border-2 ${getColorClasses(color)} ${getGlowClass(color)}`}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold font-poppins mb-4 text-white">
          {title}
        </h3>
        <div className="relative">
          <motion.div
            className={`text-4xl font-bold ${getColorClasses(color).split(' ')[0]} mb-2`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.3, duration: 0.5, type: "spring" }}
          >
            {score}
          </motion.div>
          <motion.div
            className={`w-full h-2 bg-dark-bg rounded-full overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: delay + 0.5, duration: 0.8 }}
          >
            <motion.div
              className={`h-full ${color === 'purple' ? 'bg-neon-purple' : 
                color === 'blue' ? 'bg-neon-blue' : 
                color === 'pink' ? 'bg-neon-pink' : 
                color === 'cyan' ? 'bg-neon-cyan' : 'bg-green-400'
              } ${getGlowClass(color)}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ delay: delay + 0.7, duration: 1, ease: "easeOut" }}
            />
          </motion.div>
          <div className="text-sm text-gray-400 mt-2">/ 100</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ScoreCard;