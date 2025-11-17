import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GameSequence from '../components/games/GameSequence';

const GameFlowPage: React.FC = () => {
  const [currentGameIndex] = useState(0);

  const games = [
    // { component: VirtualTyping, name: 'Typing' },
    { component: GameSequence, name: 'Cognitive Games' },
    // { component: GoNoGoReaction, name: 'Reaction' },
    // { component: NBackMemory, name: 'Memory' },
    // { component: TrailMakingTest, name: 'Trails' },
  ];

  
  const CurrentGameComponent = games[currentGameIndex]?.component;

  // (elapsed time removed since ProgressBar was removed)

  return (
    <div className="min-h-screen gradient-bg">
      
      <div className="container mx-auto px-4 pb-8">
        <motion.div
          key={currentGameIndex}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="bg-dark-card bg-opacity-30 backdrop-blur-md rounded-2xl min-h-[600px]"
        >
          {CurrentGameComponent && (
            <CurrentGameComponent />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GameFlowPage;