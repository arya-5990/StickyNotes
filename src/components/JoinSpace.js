import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { joinSpace, createSpace, getDemoSpaces } from '../services/firebaseService';

const JoinSpace = () => {
  const { state, actions } = useApp();
  const [spaceId, setSpaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinSpace = async () => {
    if (!spaceId.trim()) {
      setError('Please enter a space ID');
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

    setIsLoading(true);
    setError('');

    try {
      await createSpace(spaceId);
      const spaceData = await joinSpace(spaceId, state.user);
      actions.setSpaceData(spaceData);
      actions.setCurrentSpace(spaceId);
      actions.setError(null);
    } catch (err) {
      setError(`Failed to create space: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinSpace();
    }
  };

  // Get demo spaces from config
  // const demoSpaces = getDemoSpaces();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join a Space</h1>
          <p className="text-gray-600">Enter a space ID to collaborate with others</p>
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
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleJoinSpace}
              disabled={isLoading || !spaceId.trim()}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Joining...' : 'Join Space'}
            </button>
            <button
              onClick={handleCreateSpace}
              disabled={isLoading || !spaceId.trim()}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating...' : 'Create Space'}
            </button>
          </div>
        </div>

        {/* <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">Try these demo spaces:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoSpaces.map((demoId) => (
              <button
                key={demoId}
                onClick={() => setSpaceId(demoId)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {demoId}
              </button>
            ))}
          </div>
        </div> */}

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
