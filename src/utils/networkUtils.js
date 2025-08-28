import { doc, getDoc } from 'firebase/firestore';
import { db, forceFirebaseReconnect } from '../config/firebase';

/**
 * Test Firebase connectivity with retry logic
 */
export const testFirebaseConnectivity = async (maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Testing Firebase connectivity (attempt ${attempt}/${maxRetries})...`);
      
      // Try to read a test document
      const testDoc = doc(db, 'test', 'connectivity');
      await getDoc(testDoc);
      
      console.log('✅ Firebase connectivity test passed');
      return { success: true, message: 'Firebase is connected' };
    } catch (error) {
      console.error(`❌ Firebase connectivity test failed (attempt ${attempt}):`, error);
      
      // If it's an offline error and we have retries left, try to reconnect
      if ((error.message.includes('offline') || error.code === 'unavailable') && attempt < maxRetries) {
        console.log('Attempting to force Firebase reconnection...');
        await forceFirebaseReconnect();
        continue;
      }
      
      let message = 'Unknown connection error';
      
      if (error.message.includes('offline')) {
        message = 'Firebase client is offline - please refresh the page';
      } else if (error.message.includes('permission')) {
        message = 'Permission denied - check Firebase rules';
      } else if (error.message.includes('network')) {
        message = 'Network connectivity issue';
      } else if (error.message.includes('quota')) {
        message = 'Firebase quota exceeded';
      } else if (error.code === 'unavailable') {
        message = 'Firebase service unavailable';
      }
      
      return { 
        success: false, 
        message,
        error: error.message,
        code: error.code,
        attempt
      };
    }
  }
};

/**
 * Check if the browser is online
 */
export const isBrowserOnline = () => {
  return navigator.onLine;
};

/**
 * Get network information
 */
export const getNetworkInfo = () => {
  return {
    online: navigator.onLine,
    connectionType: navigator.connection?.effectiveType || 'unknown',
    downlink: navigator.connection?.downlink || 'unknown',
    rtt: navigator.connection?.rtt || 'unknown',
    userAgent: navigator.userAgent
  };
};

/**
 * Monitor network status changes
 */
export const createNetworkMonitor = (onStatusChange) => {
  const handleOnline = () => onStatusChange({ online: true });
  const handleOffline = () => onStatusChange({ online: false });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Force Firebase to stay online
 */
export const ensureFirebaseOnline = async () => {
  try {
    await forceFirebaseReconnect();
    return true;
  } catch (error) {
    console.error('Failed to ensure Firebase is online:', error);
    return false;
  }
};
