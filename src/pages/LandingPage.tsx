import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, Target } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';
import ParticleBackground from '../components/layout/ParticleBackground';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/games');
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Particle background (client-side canvas) */}
      <ParticleBackground />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold font-poppins neon-text mb-6 float-animation"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            MindMirror AI
          </motion.h1>
          
          <motion.p
            className="text-2xl md:text-3xl text-gray-300 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Play. Learn. Discover Yourself.
          </motion.p>
          
          <motion.p
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Unlock the secrets of your cognitive patterns through AI-powered neurometric games. 
            Experience the future of mind analysis with cutting-edge assessment technology.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mb-16"
        >
          <NeonButton onClick={handleStartNow} size="lg" className="text-xl px-12 py-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-6 h-6" />
              <span>Start Neural Assessment</span>
              <Zap className="w-6 h-6" />
            </div>
          </NeonButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            {
              icon: Brain,
              title: "Cognitive Analysis",
              description: "Advanced neural pattern recognition"
            },
            {
              icon: Target,
              title: "Precision Testing",
              description: "Micro-second reaction measurements"
            },
            {
              icon: Zap,
              title: "Real-time AI",
              description: "Instant behavioral insights"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -10 }}
              className="text-center p-6 bg-dark-card bg-opacity-50 backdrop-blur-md rounded-xl neon-border"
            >
              <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center bg-transparent">
                <feature.icon className="w-12 h-12 stroke-white fill-transparent" />
              </div>
              <h3 className="text-xl font-semibold font-poppins text-neon-purple mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-300">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;