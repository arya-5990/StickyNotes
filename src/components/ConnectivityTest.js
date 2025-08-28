import React, { useState, useEffect } from 'react';
import { testFirebaseConnectivity, getNetworkInfo } from '../utils/networkUtils';
import { forceFirebaseReconnect } from '../config/firebase';

const ConnectivityTest = ({ onStatusChange }) => {
  const [status, setStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(getNetworkInfo());

  const runTest = async () => {
    setIsTesting(true);
    try {
      const result = await testFirebaseConnectivity();
      setStatus(result);
      if (onStatusChange) {
        onStatusChange(result);
      }
    } catch (error) {
      setStatus({
        success: false,
        message: 'Test failed',
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleForceReconnect = async () => {
    setIsTesting(true);
    try {
      await forceFirebaseReconnect();
      await runTest();
    } catch (error) {
      setStatus({
        success: false,
        message: 'Reconnection failed',
        error: error.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Update network info when connection changes
    const updateNetworkInfo = () => {
      setNetworkInfo(getNetworkInfo());
    };

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
    };
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Connection Status</h3>
      
      {/* Network Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Network:</span>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              networkInfo.online ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {networkInfo.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        {networkInfo.online && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Type: {networkInfo.connectionType}</div>
            <div>Speed: {networkInfo.downlink} Mbps</div>
            <div>RTT: {networkInfo.rtt} ms</div>
          </div>
        )}
      </div>

      {/* Firebase Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Firebase:</span>
          {status ? (
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                status.success ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                {status.success ? 'Connected' : 'Error'}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">Unknown</span>
          )}
        </div>
        
        {status && !status.success && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {status.message}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={runTest}
          disabled={isTesting}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={handleForceReconnect}
          disabled={isTesting}
          className="flex-1 bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTesting ? 'Reconnecting...' : 'Force Reconnect'}
        </button>
      </div>
    </div>
  );
};

export default ConnectivityTest;
