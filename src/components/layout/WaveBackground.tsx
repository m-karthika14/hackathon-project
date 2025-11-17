import React, { useEffect, useRef } from 'react';

const WaveBackground: React.FC = () => {
  const vantaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vantaEffect: any;
    let threeScript: HTMLScriptElement | null = null;
    let vantaScript: HTMLScriptElement | null = null;

    // Load three.js
    threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    threeScript.async = true;
    document.body.appendChild(threeScript);

    // Load vanta.waves
    vantaScript = document.createElement('script');
    vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js';
    vantaScript.async = true;
    document.body.appendChild(vantaScript);

    function initVanta() {
      // @ts-ignore
      if (window.VANTA && window.VANTA.WAVES && vantaRef.current) {
        // @ts-ignore
        vantaEffect = window.VANTA.WAVES({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          shininess: 111.0,
          waveHeight: 7.0,
          waveSpeed: 1.4,
          zoom: 0.7,
        });
      }
    }

    // Wait for both scripts to load
    function checkAndInit() {
      // @ts-ignore
      if (window.THREE && window.VANTA && window.VANTA.WAVES) {
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

  return <div ref={vantaRef} className="absolute inset-0 w-full h-full" />;
};

export default WaveBackground;