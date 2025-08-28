import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import JoinSpace from './components/JoinSpace';
import Space from './components/Space';
import { validateConfig, logConfig } from './config/environment';
import './App.css';

const AppContent = () => {
  const { state } = useApp();

  // Initialize configuration on app start
  useEffect(() => {
    // Validate configuration
    const isValid = validateConfig();
    if (!isValid) {
      console.warn('Configuration validation failed. Some features may not work properly.');
    }

    // Log configuration in debug mode
    logConfig();
  }, []);

  // Show login if no user
  if (!state.user) {
    return <Login />;
  }

  // Show join space if no current space
  if (!state.currentSpace) {
    return <JoinSpace />;
  }

  // Show space if user is in a space
  return <Space />;
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
