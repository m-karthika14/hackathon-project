import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

const Disclaimer = () => {
  return (
    <motion.section 
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
    >
      <motion.div 
        className="bg-slate-900/30 backdrop-blur-sm border border-gray-600/30 rounded-2xl p-6 relative overflow-hidden"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5"></div>
        <div className="absolute inset-0 border border-gray-600/30 rounded-2xl glow-border opacity-50"></div>
        
        <div className="relative z-10 flex items-start space-x-4">
          <motion.div
            className="flex-shrink-0 p-2 bg-gray-700/50 rounded-full"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Info className="w-5 h-5 text-gray-400" />
          </motion.div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">Important Disclaimer</h3>
            <p className="text-gray-400 leading-relaxed">
              This is not a medical diagnosis. Results highlight patterns and potential risk markers 
              that may warrant further professional evaluation. Always consult with qualified healthcare 
              professionals for proper medical assessment and treatment recommendations.
            </p>
            
            <div className="mt-4 text-xs text-gray-500">
              MindMirror AI • Cognitive Assessment Platform • For Educational and Research Purposes
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default Disclaimer;