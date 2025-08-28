import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, forceFirebaseReconnect } from '../config/firebase';

// Firestore collections
const SPACES_COLLECTION = 'spaces';
const USERS_COLLECTION = 'users';
const NOTES_COLLECTION = 'notes';

/**
 * Check if user is authenticated before making Firestore calls
 */
const checkAuth = () => {
  if (!auth.currentUser) {
    throw new Error('User must be authenticated to perform this operation');
  }
  return auth.currentUser;
};

/**
 * Retry function for Firebase operations with reconnection logic
 */
const retryOperation = async (operation, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Firebase operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      // If it's a network error, try to restore connectivity
      if (error.message.includes('offline') || error.message.includes('network') || error.code === 'unavailable') {
        try {
          console.log('Attempting to force Firebase reconnection...');
          await forceFirebaseReconnect();
        } catch (networkError) {
          console.warn('Failed to restore network:', networkError);
        }
      }
      
      if (i === maxRetries - 1) {
        throw error;
      }
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

/**
 * Get space data with real-time updates
 */
export const getSpaceData = async (spaceId) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      const spaceDoc = await getDoc(doc(db, SPACES_COLLECTION, spaceId));
      if (!spaceDoc.exists()) {
        throw new Error('Space not found');
      }
      
      const spaceData = spaceDoc.data();
      
      // Get users in the space
      const usersQuery = query(
        collection(db, USERS_COLLECTION),
        where('spaceId', '==', spaceId)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = {};
      
      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        users[userDoc.id] = {
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          notes: []
        };
      });
      
      // Get all notes for the space and group by user
      const allNotesQuery = query(
        collection(db, NOTES_COLLECTION),
        where('spaceId', '==', spaceId)
      );
      
      const allNotesSnapshot = await getDocs(allNotesQuery);
      const allNotes = [];
      
      allNotesSnapshot.forEach((noteDoc) => {
        allNotes.push({
          id: noteDoc.id,
          ...noteDoc.data()
        });
      });
      
      // Group notes by user and sort by creation date
      for (const userId in users) {
        const userNotes = allNotes
          .filter(note => note.userId === userId)
          .sort((a, b) => {
            const aTime = a.createdAt?.toDate?.() || a.createdAt || 0;
            const bTime = b.createdAt?.toDate?.() || b.createdAt || 0;
            return bTime - aTime; // Descending order
          });
        
        users[userId].notes = userNotes;
      }
      
      return { users };
    });
  } catch (error) {
    console.error('Error getting space data:', error);
    throw error;
  }
};

/**
 * Listen to space data changes in real-time
 */
export const subscribeToSpace = (spaceId, callback) => {
  // Check authentication before subscribing
  if (!auth.currentUser) {
    console.error('Cannot subscribe to space: user not authenticated');
    return () => {}; // Return empty unsubscribe function
  }

  console.log('Setting up space subscription for:', spaceId);

  const unsubscribe = onSnapshot(
    doc(db, SPACES_COLLECTION, spaceId),
    async (doc) => {
      if (doc.exists()) {
        try {
          const spaceData = await getSpaceData(spaceId);
          callback(spaceData);
        } catch (error) {
          console.error('Error in space subscription:', error);
        }
      } else {
        console.log('Space document does not exist:', spaceId);
        callback({ users: {} });
      }
    },
    (error) => {
      console.error('Space subscription error:', error);
      // Return empty data on error
      callback({ users: {} });
    }
  );
  
  return unsubscribe;
};

/**
 * Add a new note
 */
export const addNote = async (spaceId, userId, note) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      const noteData = {
        ...note,
        spaceId,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteData);
      
      return {
        id: docRef.id,
        ...noteData
      };
    });
  } catch (error) {
    console.error('Error adding note:', error);
    throw error;
  }
};

/**
 * Update an existing note
 */
export const updateNote = async (noteId, updates) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      const noteRef = doc(db, NOTES_COLLECTION, noteId);
      await updateDoc(noteRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    });
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

/**
 * Delete a note
 */
export const removeNote = async (noteId) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
      return { success: true };
    });
  } catch (error) {
    console.error('Error removing note:', error);
    throw error;
  }
};

/**
 * Create a new space
 */
export const createSpace = async (spaceId) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      await setDoc(doc(db, SPACES_COLLECTION, spaceId), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, spaceId };
    });
  } catch (error) {
    console.error('Error creating space:', error);
    throw error;
  }
};

/**
 * Join a space (add user to space)
 */
export const joinSpace = async (spaceId, user) => {
  try {
    // Check authentication
    const currentUser = checkAuth();
    
    return await retryOperation(async () => {
      // Check if space exists
      const spaceDoc = await getDoc(doc(db, SPACES_COLLECTION, spaceId));
      if (!spaceDoc.exists()) {
        throw new Error('Space not found');
      }
      
      // Add or update user in the space
      const userRef = doc(db, USERS_COLLECTION, user.id);
      await setDoc(userRef, {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        spaceId,
        joinedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Get updated space data
      return await getSpaceData(spaceId);
    });
  } catch (error) {
    console.error('Error joining space:', error);
    throw error;
  }
};

/**
 * Get user's notes in real-time
 */
export const subscribeToUserNotes = (spaceId, userId, callback) => {
  // Check authentication before subscribing
  if (!auth.currentUser) {
    console.error('Cannot subscribe to notes: user not authenticated');
    return () => {}; // Return empty unsubscribe function
  }

  const notesQuery = query(
    collection(db, NOTES_COLLECTION),
    where('spaceId', '==', spaceId)
  );
  
  const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
    const notes = [];
    snapshot.forEach((doc) => {
      const noteData = doc.data();
      // Only include notes for the specific user
      if (noteData.userId === userId) {
        notes.push({
          id: doc.id,
          ...noteData
        });
      }
    });
    
    // Sort by creation date (descending)
    notes.sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || a.createdAt || 0;
      const bTime = b.createdAt?.toDate?.() || b.createdAt || 0;
      return bTime - aTime;
    });
    
    callback(notes);
  }, (error) => {
    console.error('Notes subscription error:', error);
    callback([]); // Return empty array on error
  });
  
  return unsubscribe;
};

/**
 * Get all spaces for a user
 */
export const getUserSpaces = async (userId) => {
  try {
    // Check authentication
    const user = checkAuth();
    
    return await retryOperation(async () => {
      const userQuery = query(
        collection(db, USERS_COLLECTION),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(userQuery);
      const spaces = [];
      
      snapshot.forEach((doc) => {
        spaces.push({
          id: doc.data().spaceId,
          ...doc.data()
        });
      });
      
      return spaces;
    });
  } catch (error) {
    console.error('Error getting user spaces:', error);
    throw error;
  }
};
