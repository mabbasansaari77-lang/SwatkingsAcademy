import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './index.css';
import { AuthProvider } from './lib/auth';
import { readEmbeddedSeed, removePrerenderedHead } from './lib/prerender';
import { SettingsProvider } from './lib/settings';

readEmbeddedSeed();
removePrerenderedHead();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
