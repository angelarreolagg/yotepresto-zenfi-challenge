import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { parsePersistedState, STORAGE_KEY } from '@/entities/transaction';
import { initI18n } from '@/shared/i18n';
import { safeStorage } from '@/shared/lib/safeStorage';

import App from './App.tsx';
import './index.css';

// Read synchronously, before createRoot, so the very first render already has the right
// language — a component that paints before i18n resolves would flash a raw translation key.
const { language } = parsePersistedState(safeStorage.get(STORAGE_KEY));
initI18n(language);

const container = document.getElementById('root');

if (!container) throw new Error('No se encontró el elemento #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
