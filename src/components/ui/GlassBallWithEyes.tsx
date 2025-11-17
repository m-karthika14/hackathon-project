import React, { useRef, useEffect } from 'react';

const GlassBallWithEyes: React.FC = () => {
  const ballRef = useRef<HTMLDivElement>(null);
  const leftEyeRef = useRef<HTMLDivElement>(null);
  const rightEyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!ballRef.current || !leftEyeRef.current || !rightEyeRef.current) return;
      const rect = ballRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      const maxMove = 15;
      const moveX = Math.min(Math.max(deltaX / 10, -maxMove), maxMove);
      const moveY = Math.min(Math.max(deltaY / 10, -maxMove), maxMove);
      leftEyeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
      rightEyeRef.current.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
    function handleMouseLeave() {
      if (!leftEyeRef.current || !rightEyeRef.current) return;
      leftEyeRef.current.style.transform = 'translate(0, 0)';
      rightEyeRef.current.style.transform = 'translate(0, 0)';
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="glass-ball" ref={ballRef}>
      <div className="eyes">
        <div className="eye left" ref={leftEyeRef}></div>
        <div className="eye right" ref={rightEyeRef}></div>
      </div>
      <style>{`
        .glass-ball {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, rgba(0, 140, 255, 0.6), rgba(0, 0, 0, 0.8));
          border-radius: 50%;
          position: relative;
          top: -25px;
          box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5), 0 0 30px rgba(0, 140, 255, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .eyes {
          position: absolute;
          width: 60%;
          display: flex;
          justify-content: space-between;
        }
        .eye {
          width: 15px;
          height: 40px;
          background: white;
          border-radius: 10px;
          position: relative;
          transition: transform 0.1s ease-out;
          animation: blink 4s infinite;
        }
        @keyframes blink {
          0%, 90% { height: 40px; }
          95% { height: 5px; }
          100% { height: 40px; }
        }
      `}</style>
    </div>
  );
};

export default GlassBallWithEyes;