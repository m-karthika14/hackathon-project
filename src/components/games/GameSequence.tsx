import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NeuroBalanceMaze from './NeuroBalanceMaze';
import ADHDGame from './adhdgame';

interface GameSequenceProps {
  // Add any props needed for the overall flow
}

const GameSequence: React.FC<GameSequenceProps> = () => {
  const [currentGame, setCurrentGame] = useState<'maze' | 'adhd'>('maze');
  const navigate = useNavigate();
  
  const handleMazeComplete = () => {
    console.log('🎮 GameSequence: Maze game completed, transitioning to ADHD game...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    setCurrentGame('adhd');
    console.log('✅ GameSequence: State changed to adhd');
  };

  const handleADHDComplete = () => {
    console.log('🎮 GameSequence: ADHD game completed, navigating to report...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    navigate('/report');
    console.log('✅ GameSequence: Navigated to report');
  };
  
  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 GameSequence state changed to:', currentGame);
  }, [currentGame]);
  
  // Debug logging for handler functions
  useEffect(() => {
    console.log('🔍 GameSequence: handleMazeComplete function is:', handleMazeComplete);
    console.log('🔍 GameSequence: handleADHDComplete function is:', handleADHDComplete);
  }, [handleMazeComplete, handleADHDComplete]);

  return (
    <div className="game-sequence-container">
      {currentGame === 'maze' && (
        <NeuroBalanceMaze onMazeComplete={handleMazeComplete} />
      )}
      {currentGame === 'adhd' && (
        <ADHDGame onGameComplete={handleADHDComplete} />
      )}
    </div>
  );
};

export default GameSequence;
