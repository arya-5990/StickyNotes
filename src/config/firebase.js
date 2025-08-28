// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHxeDeCZUeMvgf7GrsmmLXLegr9onh8ig",
  authDomain: "stickynotes-74a44.firebaseapp.com",
  projectId: "stickynotes-74a44",
  storageBucket: "stickynotes-74a44.firebasestorage.app",
  messagingSenderId: "355493547687",
  appId: "1:355493547687:web:c293fe0cda370ea502d582",
  measurementId: "G-0P5G79CYKE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Auth Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to emulators in development (if needed)
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

// Enhanced Firebase connection management
let connectionInitialized = false;

const initializeFirebaseConnection = async () => {
  if (connectionInitialized) {
    console.log('Firebase connection already initialized');
    return true;
  }

  try {
    console.log('Initializing Firebase connection...');
    
    // Force enable network
    await enableNetwork(db);
    
    // Wait a moment for connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    connectionInitialized = true;
    console.log('Firebase connection initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase connection:', error);
    connectionInitialized = false;
    return false;
  }
};

// Force reconnection function
export const forceFirebaseReconnect = async () => {
  try {
    console.log('Forcing Firebase reconnection...');
    connectionInitialized = false;
    
    // Disable network first
    await disableNetwork(db);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Re-enable network
    await enableNetwork(db);
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    connectionInitialized = true;
    console.log('Firebase reconnection completed');
    return true;
  } catch (error) {
    console.error('Failed to force Firebase reconnection:', error);
    connectionInitialized = false;
    return false;
  }
};

// Initialize connection on app start
initializeFirebaseConnection();

// Log Firebase initialization
console.log('Firebase initialized with project:', firebaseConfig.projectId);

export default app;
