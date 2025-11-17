/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'neon-purple': '#a855f7',
        'neon-blue': '#3b82f6',
        'neon-pink': '#ec4899',
        'neon-cyan': '#22d3ee',
        'dark-bg': '#0a0a0f',
        'dark-card': '#1a1a2e',
      },
      animation: {
        'neon-glow': 'neonPulse 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};