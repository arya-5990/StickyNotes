// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export default app;
