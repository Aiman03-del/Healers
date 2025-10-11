import { useState, useEffect } from 'react';
import { FaDownload, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install prompt
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for 7 days
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('installPromptDismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        setShowInstall(false);
      }
    }
  }, []);

  return (
    <AnimatePresence>
      {showInstall && deferredPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-md z-50"
        >
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 backdrop-blur-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="bg-white/20 p-3 rounded-xl">
                  <FaDownload className="text-2xl" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Install Healers App</h3>
                  <p className="text-sm text-white/90">
                    মোবাইলে অ্যাপ ইনস্টল করুন এবং অফলাইনেও ব্যবহার করুন!
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white/70 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-violet-600 font-semibold py-2.5 px-4 rounded-lg hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-white/90 hover:text-white font-medium transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPWA;

