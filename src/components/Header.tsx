import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, User, Calendar, Clock, Activity } from 'lucide-react';

interface HeaderProps {
  onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({ onBack }) => {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Navigation */}
      <div className="flex items-center mb-6">
        <motion.button
          onClick={onBack}
          className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors duration-300 mr-6"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Back to Landing</span>
        </motion.button>
        
        <div className="flex items-center">
          <Brain className="w-8 h-8 text-cyan-400 mr-3" />
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            MindMirror AI
          </span>
        </div>
      </div>

      {/* Title Section */}
      <div className="text-center mb-8">
        <h1 
          className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          style={{ fontFamily: 'Orbitron, monospace' }}
        >
          Cognitive & Behavioral Profile Report
        </h1>
        <p className="text-gray-400 text-lg">
          This is not a diagnosis. Results highlight patterns and potential risks.
        </p>
      </div>

      {/* Session Info Card */}
      <motion.div 
        className="bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5"></div>
        <div className="absolute inset-0 border border-cyan-500/20 rounded-2xl glow-border"></div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center">
            <User className="w-6 h-6 text-cyan-400 mr-3" />
            <div>
              <p className="text-gray-400 text-sm">Patient ID</p>
              <p className="text-white font-semibold">MIR-2024-001</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-purple-400 mr-3" />
            <div>
              <p className="text-gray-400 text-sm">Assessment Date</p>
              <p className="text-white font-semibold">Jan 15, 2024</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-pink-400 mr-3" />
            <div>
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white font-semibold">24 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-yellow-400 mr-3" />
            <div>
              <p className="text-gray-400 text-sm">Session Type</p>
              <p className="text-white font-semibold">30-day Analysis</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Header;