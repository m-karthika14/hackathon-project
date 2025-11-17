import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NeuroBalanceMaze from './NeuroBalanceMaze';
import ADHDGame from './adhdgame';
import PTSDGame from './ptsdgame';

interface GameSequenceProps {
  // Add any props needed for the overall flow
}

const GameSequence: React.FC<GameSequenceProps> = () => {
  const [currentGame, setCurrentGame] = useState<'maze' | 'adhd' | 'ptsd'>('maze');
  const navigate = useNavigate();
  
  const handleMazeComplete = () => {
    console.log('🎮 GameSequence: Maze game completed, transitioning to ADHD game...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    setCurrentGame('adhd');
    console.log('✅ GameSequence: State changed to adhd');
  };

  const handleADHDComplete = () => {
    console.log('🎮 GameSequence: ADHD game completed, transitioning to PTSD game...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    setCurrentGame('ptsd');
    console.log('✅ GameSequence: State changed to ptsd');
  };
  
  const handlePTSDComplete = () => {
    console.log('🎮 GameSequence: All games completed! Navigating to report page...');
    navigate('/report');
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
      {currentGame === 'ptsd' && (
        <PTSDGame onGameComplete={handlePTSDComplete} />
      )}
    </div>
  );
};

export default GameSequence;
