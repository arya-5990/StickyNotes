import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { joinSpace, createSpace } from '../services/firebaseService';
import { signInWithGoogle } from '../services/authService';
import ConnectivityTest from './ConnectivityTest';

const JoinSpace = () => {
  const { state, actions } = useApp();
  const [spaceId, setSpaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [firebaseStatus, setFirebaseStatus] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(''); // Clear error when back online
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('You are currently offline. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      setError('');
    } catch (err) {
      setError(`Failed to sign in: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSpace = async () => {
    if (!spaceId.trim()) {
      setError('Please enter a space ID');
      return;
    }

    if (!isOnline) {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }

    if (!state.user) {
      setError('Please sign in first to join a space');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Try to join existing space
      const spaceData = await joinSpace(spaceId, state.user);
      actions.setSpaceData(spaceData);
      actions.setCurrentSpace(spaceId);
      actions.setError(null);
    } catch (err) {
      if (err.message === 'Space not found') {
        // Ask user if they want to create the space
        if (window.confirm(`Space "${spaceId}" doesn't exist. Would you like to create it?`)) {
          try {
            await createSpace(spaceId);
            const newSpaceData = await joinSpace(spaceId, state.user);
            actions.setSpaceData(newSpaceData);
            actions.setCurrentSpace(spaceId);
            actions.setError(null);
          } catch (createErr) {
            setError(`Failed to create space: ${createErr.message}`);
          }
        }
      } else if (err.message.includes('offline') || err.message.includes('network')) {
        setError('Connection issue detected. Please check your internet connection and try again.');
      } else {
        setError(`Failed to join space: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!spaceId.trim()) {
      setError('Please enter a space ID');
      return;
    }

    if (!isOnline) {
      setError('You are currently offline. Please check your internet connection.');
      return;
    }

    if (!state.user) {
      setError('Please sign in first to create a space');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await createSpace(spaceId);
      const spaceData = await joinSpace(spaceId, state.user);
      actions.setSpaceData(spaceData);
      actions.setCurrentSpace(spaceId);
      actions.setError(null);
    } catch (err) {
      if (err.message.includes('offline') || err.message.includes('network')) {
        setError('Connection issue detected. Please check your internet connection and try again.');
      } else {
        setError(`Failed to create space: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinSpace();
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  // Show sign-in prompt if user is not authenticated
  if (!state.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to StickyNotes!</h1>
            <p className="text-gray-600">Sign in to start collaborating with others</p>
          </div>

          {/* Network Status Indicator */}
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
            isOnline 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center justify-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {isOnline ? 'Connected to internet' : 'No internet connection'}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              disabled={isLoading || !isOnline}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
                {error.includes('offline') && (
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={handleRefreshPage}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Diagnostics Button */}
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {showDiagnostics ? 'Hide' : 'Show'} Connection Diagnostics
            </button>

            {/* Diagnostics Panel */}
            {showDiagnostics && (
              <ConnectivityTest onStatusChange={setFirebaseStatus} />
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => actions.setCurrentSpace(null)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Space</h1>
          <p className="text-gray-600">Enter a space ID to collaborate with others</p>
          <div className="mt-2 text-sm text-gray-500">
            Signed in as: {state.user.name}
          </div>
        </div>

        {/* Network Status Indicator */}
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          isOnline 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <div className="flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isOnline ? 'Connected to internet' : 'No internet connection'}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="spaceId" className="block text-sm font-medium text-gray-700 mb-2">
              Space ID
            </label>
            <input
              type="text"
              id="spaceId"
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., abc123, demo456"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading || !isOnline}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              {error.includes('offline') && (
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={handleRefreshPage}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                  >
                    Refresh Page
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleJoinSpace}
              disabled={isLoading || !spaceId.trim() || !isOnline}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Space'}
            </button>
            <button
              onClick={handleCreateSpace}
              disabled={isLoading || !spaceId.trim() || !isOnline}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Space'}
            </button>
          </div>

          {/* Diagnostics Button */}
          <button
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {showDiagnostics ? 'Hide' : 'Show'} Connection Diagnostics
          </button>

          {/* Diagnostics Panel */}
          {showDiagnostics && (
            <ConnectivityTest onStatusChange={setFirebaseStatus} />
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => actions.setCurrentSpace(null)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default JoinSpace;
