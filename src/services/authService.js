import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

/**
 * Sign in with Google
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Update user profile if needed
    if (!user.displayName) {
      await updateProfile(user, {
        displayName: user.email?.split('@')[0] || 'User'
      });
    }
    
    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      avatar: user.photoURL || `https://via.placeholder.com/40/6366f1/ffffff?text=${(user.displayName || 'U').charAt(0).toUpperCase()}`
    };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign out
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const userData = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        avatar: user.photoURL || `https://via.placeholder.com/40/6366f1/ffffff?text=${(user.displayName || 'U').charAt(0).toUpperCase()}`
      };
      callback(userData);
    } else {
      callback(null);
    }
  });
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (user) {
    return {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      avatar: user.photoURL || `https://via.placeholder.com/40/6366f1/ffffff?text=${(user.displayName || 'U').charAt(0).toUpperCase()}`
    };
  }
  return null;
};
