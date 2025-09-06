import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = window.navigator.standalone === true;
    
    if (isStandalone || isInApp) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show our custom install prompt
      setShowPrompt(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('FamilyVine PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || !showPrompt || sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Install FamilyVine
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Add FamilyVine to your home screen for quick access and offline viewing of your family tree.
          </p>
          
          <div className="flex space-x-3 mt-3">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              Install App
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;