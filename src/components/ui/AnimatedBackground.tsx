import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Flowing waves */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 15 + i * 5,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 2
          }}
        >
          <div
            className={`h-full w-96 bg-gradient-to-r opacity-20 ${
              i === 0 ? 'from-purple-500 via-pink-500 to-transparent' :
              i === 1 ? 'from-blue-500 via-cyan-500 to-transparent' :
              'from-pink-500 via-purple-500 to-transparent'
            }`}
            style={{
              transform: `skewX(-20deg) translateY(${i * 20}px)`,
              filter: 'blur(1px)'
            }}
          />
        </motion.div>
      ))}
      
      {/* Floating orbs */}
      {[...Array(5)].map((_, i) => {
        // Generate random values once per render for each orb
        const width = 20 + Math.random() * 40;
        const height = 20 + Math.random() * 40;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const color = ['#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4'][Math.floor(Math.random() * 4)];
        const xMove = Math.random() * 20 - 10;
        const duration = 4 + Math.random() * 4;
        const delay = Math.random() * 2;
        return (
          <motion.div
            key={`orb-${i}`}
            className="absolute rounded-full opacity-30"
            style={{
              width,
              height,
              left: `${left}%`,
              top: `${top}%`,
              background: `radial-gradient(circle, ${color}, transparent)`
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, xMove, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay
            }}
          />
        );
      })}
    </div>
  );
};

export default AnimatedBackground;