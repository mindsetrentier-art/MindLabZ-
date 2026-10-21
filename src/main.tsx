import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupNetlifyBadgeRemover } from './utils/netlifyBadgeRemover';

// Immediately initialize Netlify badge cleaner
setupNetlifyBadgeRemover();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Manage Service Worker: Unregister in preview/dev, register only in standalone custom domain
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isDevPreview =
    window.location.hostname.includes('run.app') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isDevPreview) {
    // Unregister any active Service Workers and clear all stale caches in preview
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name).catch(() => {});
        }
      });
    }
  } else if (window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration notice:', err);
      });
    });
  }
}
