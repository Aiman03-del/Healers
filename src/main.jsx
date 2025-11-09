import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common';
// Register service worker for PWA after initial load to avoid blocking FCP
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        const updateSW = registerSW({
          onNeedRefresh() {
            if (confirm('New content available. Reload?')) {
              updateSW(true);
            }
          },
          onOfflineReady() {
            console.log('App ready to work offline');
          },
        });
      })
      .catch((error) => {
        console.error('Failed to register service worker', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
