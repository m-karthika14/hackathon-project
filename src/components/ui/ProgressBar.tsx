import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  currentGame: number;
  totalGames: number;
  gameNames: string[];
  elapsedTime?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentGame, totalGames, gameNames, elapsedTime = 0 }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-poppins text-neon-purple">
          Neural Assessment Protocol
        </h2>
        <div className="flex items-center space-x-4">
          <span className="text-neon-blue font-semibold">
            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
          </span>
          <span className="text-neon-cyan font-semibold">
            {currentGame}/{totalGames}
          </span>
        </div>
      </div>
      
      <div className="relative">
        <div className="flex justify-between mb-2">
          {gameNames.map((name, index) => (
            <div
              key={index}
              className={`text-sm font-medium ${
                index < currentGame
                  ? 'text-neon-cyan'
                  : index === currentGame
                  ? 'text-neon-purple'
                  : 'text-gray-500'
              }`}
            >
              {name}
            </div>
          ))}
        </div>
        
        <div className="flex space-x-2">
          {Array.from({ length: totalGames }).map((_, index) => (
            <div key={index} className="flex-1 h-3 bg-dark-card rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  index < currentGame
                    ? 'bg-gradient-to-r from-neon-cyan to-neon-blue neon-glow-cyan'
                    : index === currentGame
                    ? 'bg-gradient-to-r from-neon-purple to-neon-pink neon-glow'
                    : 'bg-gray-600'
                }`}
                initial={{ width: 0 }}
                animate={{ 
                  width: index < currentGame ? '100%' : index === currentGame ? '100%' : '0%' 
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;