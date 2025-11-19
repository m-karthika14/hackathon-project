import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NeuroBalanceMaze from './NeuroBalanceMaze';
import ADHDGame from './adhdgame';
import MarioGame from './mario';

interface GameSequenceProps {
  // Add any props needed for the overall flow
}

const GameSequence: React.FC<GameSequenceProps> = () => {
  const [currentGame, setCurrentGame] = useState<'maze' | 'adhd' | 'mario'>('maze');
  const navigate = useNavigate();
  
  // Ensure a stable session id exists for the whole sequence (links maze -> adhd)
  useEffect(() => {
    let sessionId = localStorage.getItem('gameSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('gameSessionId', sessionId);
      console.log('🔖 GameSequence: created new gameSessionId', sessionId);
    } else {
      console.log('🔖 GameSequence: using existing gameSessionId', sessionId);
    }
  }, []);
  
  const handleMazeComplete = () => {
    console.log('🎮 GameSequence: Maze game completed, transitioning to ADHD game...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    setCurrentGame('adhd');
    console.log('✅ GameSequence: State changed to adhd');
  };

  const handleADHDComplete = () => {
    console.log('🎮 GameSequence: ADHD game completed, transitioning to Mario game...');
    console.log('🔄 GameSequence: Current game state before transition:', currentGame);
    setCurrentGame('mario');
    console.log('✅ GameSequence: State changed to mario');
  };
  
  const handleMarioComplete = () => {
    console.log('🎮 GameSequence: Mario game completed, navigating to report...');
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
    console.log('🔍 GameSequence: handleMarioComplete function is:', handleMarioComplete);
  }, [handleMazeComplete, handleADHDComplete, handleMarioComplete]);

  return (
    <div className="game-sequence-container">
      {currentGame === 'maze' && (
        <NeuroBalanceMaze onMazeComplete={handleMazeComplete} />
      )}
      {currentGame === 'adhd' && (
        <ADHDGame onGameComplete={handleADHDComplete} />
      )}
      {currentGame === 'mario' && (
        <MarioGame onGameComplete={handleMarioComplete} />
      )}
    </div>
  );
};

export default GameSequence;
