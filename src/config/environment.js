// Environment configuration for StickyNotes!
// All environment variables are prefixed with REACT_APP_ for security

const config = {
  // App Configuration
  app: {
    name: process.env.REACT_APP_NAME || 'StickyNotes!',
    version: process.env.REACT_APP_VERSION || '1.0.0',
    description: process.env.REACT_APP_DESCRIPTION || 'Real-time collaborative sticky notes',
  },

  // Firebase Configuration (for future integration)
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCHxeDeCZUeMvgf7GrsmmLXLegr9onh8ig",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "stickynotes-74a44.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "stickynotes-74a44",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "stickynotes-74a44.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "355493547687",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:355493547687:web:c293fe0cda370ea502d582",
  },

  // Mock Data Configuration (disabled for Firebase)
  mock: {
    enabled: process.env.REACT_APP_MOCK_ENABLED === 'true' || false, // Default to false for Firebase
    delayMs: parseInt(process.env.REACT_APP_MOCK_DELAY_MS) || 500,
  },

  // Demo Spaces
  demoSpaces: [
    process.env.REACT_APP_DEMO_SPACE_1 || 'abc123',
    process.env.REACT_APP_DEMO_SPACE_2 || 'demo456',
  ],

  // UI Configuration
  ui: {
    maxNotesPerUser: parseInt(process.env.REACT_APP_MAX_NOTES_PER_USER) || 100,
    noteColors: (process.env.REACT_APP_NOTE_COLORS || 'yellow,blue,green,pink,purple,orange').split(','),
  },

  // Development Settings
  development: {
    debugMode: process.env.REACT_APP_DEBUG_MODE === 'true',
    logLevel: process.env.REACT_APP_LOG_LEVEL || 'info',
  },

  // Utility functions
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// Validation function to check if required config is present
export const validateConfig = () => {
  const errors = [];

  // Check if Firebase config is complete (when not in mock mode)
  if (!config.mock.enabled) {
    const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId'];
    requiredFirebaseFields.forEach(field => {
      if (!config.firebase[field]) {
        errors.push(`Missing required Firebase configuration: ${field}`);
      }
    });
  }

  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    return false;
  }

  return true;
};

// Debug function to log configuration (only in development)
export const logConfig = () => {
  if (config.development.debugMode && config.isDevelopment) {
    console.log('StickyNotes! Configuration:', {
      app: config.app,
      mock: config.mock,
      firebase: {
        projectId: config.firebase.projectId,
        authDomain: config.firebase.authDomain
      },
      demoSpaces: config.demoSpaces,
      ui: config.ui,
      environment: process.env.NODE_ENV,
    });
  }
};

export default config;
