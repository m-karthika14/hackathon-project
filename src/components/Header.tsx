import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Back Button - Absolute Top Left */}
      {onBack && (
        <motion.button
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back</span>
        </motion.button>
      )}

      {/* Logo - Centered */}
      <div className="flex items-center justify-center mb-6">
        <Brain className="w-10 h-10 text-cyan-400 mr-3" />
        <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          MindMirror AI
        </span>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 
          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          Cognitive & Behavioral Profile Report
        </h1>
      </div>
    </motion.div>
  );
};

export default Header;