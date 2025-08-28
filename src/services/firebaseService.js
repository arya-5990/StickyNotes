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
import { db } from '../config/firebase';

// Firestore collections
const SPACES_COLLECTION = 'spaces';
const USERS_COLLECTION = 'users';
const NOTES_COLLECTION = 'notes';

/**
 * Get space data with real-time updates
 */
export const getSpaceData = async (spaceId) => {
  try {
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
    
    // Get notes for each user
    for (const userId in users) {
      const notesQuery = query(
        collection(db, NOTES_COLLECTION),
        where('spaceId', '==', spaceId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const notesSnapshot = await getDocs(notesQuery);
      const notes = [];
      
      notesSnapshot.forEach((noteDoc) => {
        notes.push({
          id: noteDoc.id,
          ...noteDoc.data()
        });
      });
      
      users[userId].notes = notes;
    }
    
    return { users };
  } catch (error) {
    console.error('Error getting space data:', error);
    throw error;
  }
};

/**
 * Listen to space data changes in real-time
 */
export const subscribeToSpace = (spaceId, callback) => {
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
      }
    },
    (error) => {
      console.error('Space subscription error:', error);
    }
  );
  
  return unsubscribe;
};

/**
 * Add a new note
 */
export const addNote = async (spaceId, userId, note) => {
  try {
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
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    return { success: true };
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
    await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    return { success: true };
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
    await setDoc(doc(db, SPACES_COLLECTION, spaceId), {
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { success: true, spaceId };
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
  } catch (error) {
    console.error('Error joining space:', error);
    throw error;
  }
};

/**
 * Get user's notes in real-time
 */
export const subscribeToUserNotes = (spaceId, userId, callback) => {
  const notesQuery = query(
    collection(db, NOTES_COLLECTION),
    where('spaceId', '==', spaceId),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
    const notes = [];
    snapshot.forEach((doc) => {
      notes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(notes);
  }, (error) => {
    console.error('Notes subscription error:', error);
  });
  
  return unsubscribe;
};

/**
 * Get all spaces for a user
 */
export const getUserSpaces = async (userId) => {
  try {
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
  } catch (error) {
    console.error('Error getting user spaces:', error);
    throw error;
  }
};
