import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AudioProvider } from './context/AudioContext';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
if ('serviceWorker' in navigator) {
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
