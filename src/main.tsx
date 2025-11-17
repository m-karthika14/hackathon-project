import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import VantaBackground from './components/layout/VantaBackground.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <VantaBackground>
      <App />
    </VantaBackground>
  </StrictMode>
);
