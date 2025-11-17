import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NeonButton from '../components/ui/NeonButton';
import NeonInput from './NeonInput';
import GlassBallWithEyes from '../components/ui/GlassBallWithEyes';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        
        // Save user data to localStorage
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('isLoggedIn', 'true');
        
        navigate('/home');
      } else {
        const errorData = await response.json();
        console.error('Failed to login:', errorData);
        alert('Login failed: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleGuestLogin = () => {
    // Set guest user data
    const guestId = 'guest_' + Date.now();
    localStorage.setItem('userId', guestId);
    localStorage.setItem('userEmail', 'guest@mindmirror.ai');
    localStorage.setItem('isLoggedIn', 'guest');
    
    navigate('/home');
  };

  useEffect(() => {
    // Create synth audio context
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const playKeySound = () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 400 + Math.random() * 200;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    };

    const playClickSound = () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = 150;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    };

    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const loginBtn = document.getElementById('login');
    const guestBtn = document.getElementById('guest');

    email?.addEventListener('keydown', playKeySound);
    password?.addEventListener('keydown', playKeySound);
    loginBtn?.addEventListener('click', playClickSound);
    guestBtn?.addEventListener('click', playClickSound);

    return () => {
      email?.removeEventListener('keydown', playKeySound);
      password?.removeEventListener('keydown', playKeySound);
      loginBtn?.removeEventListener('click', playClickSound);
      guestBtn?.removeEventListener('click', playClickSound);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black relative flex items-center justify-center overflow-hidden"
    >
      {/* Vanta Net Background */}
      <div
        ref={(() => {
          const vantaRef = React.useRef(null);
          React.useEffect(() => {
            let vantaEffect: any = null;
            let threeScript = document.createElement('script');
            threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
            threeScript.async = true;
            document.body.appendChild(threeScript);

            let vantaScript = document.createElement('script');
            vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js';
            vantaScript.async = true;
            document.body.appendChild(vantaScript);

            function initVanta() {
              // @ts-ignore
              if (window.VANTA && window.VANTA.NET && vantaRef.current) {
                // @ts-ignore
                vantaEffect = window.VANTA.NET({
                  el: vantaRef.current,
                  mouseControls: true,
                  touchControls: true,
                  gyroControls: false,
                  minHeight: 200.0,
                  minWidth: 200.0,
                  scale: 1.0,
                  scaleMobile: 1.0,
                  color: 0x3350a4,
                  backgroundColor: 0x23153c,
                  points: 16.0,
                  maxDistance: 19.0,
                  spacing: 13.0,
                });
              }
            }
            function checkAndInit() {
              // @ts-ignore
              if (window.THREE && window.VANTA && window.VANTA.NET) {
                initVanta();
              } else {
                setTimeout(checkAndInit, 100);
              }
            }
            threeScript.onload = checkAndInit;
            vantaScript.onload = checkAndInit;
            return () => {
              if (vantaEffect && typeof vantaEffect.destroy === 'function') {
                vantaEffect.destroy();
              }
              if (threeScript) document.body.removeChild(threeScript);
              if (vantaScript) document.body.removeChild(vantaScript);
            };
          }, []);
          return vantaRef;
        })()} 
        className="absolute inset-0 w-full h-full"
      />
      {/* Glass Ball with Moving Eyes and Login Side by Side */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-8 px-6 mt-[-40px]">
        {/* Glass Ball Side */}
        <div className="flex-1 flex justify-center items-center">
          <GlassBallWithEyes />
        </div>
        {/* Login Side */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-full max-w-md px-6"
        >
          <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-2xl p-8 neon-border">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl font-poppins font-bold neon-text mb-2">
                MindMirror AI
              </h1>
              <p className="text-gray-400">Enter your neural network</p>
            </motion.div>
            <form onSubmit={handleLogin} className="space-y-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <NeonInput
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <NeonInput
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <NeonButton id="login" type="submit" className="w-full">
                  Login
                </NeonButton>
                <NeonButton 
                  id="guest"
                  type="button" 
                  variant="secondary" 
                  className="w-full"
                  onClick={handleGuestLogin}
                >
                  Continue as Guest
                </NeonButton>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginPage;