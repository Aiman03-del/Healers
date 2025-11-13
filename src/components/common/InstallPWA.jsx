import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let idleHandle;
    let timeoutId;

    if (typeof window === "undefined") {
      setIsReady(false);
      return;
    }

    const idleCallback = window.requestIdleCallback;
    if (typeof idleCallback === "function") {
      idleHandle = idleCallback(() => setIsReady(true), { timeout: 800 });
      return () => {
        if (window.cancelIdleCallback) {
          window.cancelIdleCallback(idleHandle);
        }
      };
    }

    timeoutId = setTimeout(() => setIsReady(true), 600);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install prompt
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstall(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
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

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const handleDismiss = () => {
    setShowInstall(false);
    // Remember dismissal for 7 days
    localStorage.setItem("installPromptDismissed", Date.now().toString());
  };

  // Check if user dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissal =
        (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        setShowInstall(false);
      }
    }
  }, []);

  if (!isReady) {
    return null;
  }

  if (!showInstall || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-slide-up">
      <div className="rounded-3xl border border-white/10 bg-[#181818] shadow-[0_20px_40px_rgba(0,0,0,0.35)] p-5 text-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1db954]/10 text-[#1db954]">
            <Download className="h-6 w-6" strokeWidth={2.1} />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#1db954]">Get the app</p>
              <h3 className="mt-1 text-lg font-semibold">Install Healers</h3>
              <p className="mt-1 text-sm text-gray-400">
                Save Healers to your device for offline listening and quicker launches.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center justify-center rounded-full bg-[#1db954] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#1ed760] focus:outline-none focus:ring-2 focus:ring-[#1db954]/60 focus:ring-offset-2 focus:ring-offset-[#181818]"
              >
                Install now
              </button>
              <button
                onClick={handleDismiss}
                className="text-sm font-medium text-gray-300 transition hover:text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-500 transition hover:text-white"
            aria-label="Dismiss install banner"
          >
            <X className="h-5 w-5" strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
