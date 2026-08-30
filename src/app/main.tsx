import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { initI18n } from '@/shared/i18n';

import App from './App.tsx';
import './index.css';

// Persisted language will be read from entities/transaction's stored decisions once that layer
// exists (ROADMAP §8 phase 2+); until then the detector's browser-language guess applies.
initI18n(null);

const container = document.getElementById('root');

if (!container) throw new Error('No se encontró el elemento #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
