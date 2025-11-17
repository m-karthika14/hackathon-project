import React from 'react';
import { motion } from 'framer-motion';

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  id?: string; // Allow passing id to button
}

const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  id,
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-300 relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-neon-purple to-neon-blue text-white neon-glow hover:neon-glow-blue',
    secondary: 'bg-transparent neon-border text-neon-purple hover:bg-neon-purple hover:text-white',
    ghost: 'bg-transparent text-neon-cyan hover:bg-neon-cyan hover:bg-opacity-20'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      id={id}
      type={type}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span className="relative z-10">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-cyan opacity-0 hover:opacity-30 transition-opacity duration-300"
        initial={false}
      />
    </motion.button>
  );
};

export default NeonButton;