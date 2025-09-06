import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      // Hide notification after 3 seconds
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show anything if online and no recent status change
  if (isOnline && !showNotification) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    } ${
      showNotification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <>
            <Wifi size={16} />
            <span className="text-sm font-medium">Back online!</span>
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span className="text-sm font-medium">You're offline</span>
          </>
        )}
      </div>
      {!isOnline && (
        <p className="text-xs mt-1 opacity-90">
          You can still browse cached content
        </p>
      )}
    </div>
  );
};

export default OfflineIndicator;