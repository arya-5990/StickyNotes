import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { onAuthStateChange } from '../services/authService';
import { subscribeToSpace } from '../services/firebaseService';

// Initial state
const initialState = {
  user: null,
  currentSpace: null,
  spaceData: null,
  isLoading: false,
  error: null,
  unsubscribe: null
};

// Action types
const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_CURRENT_SPACE: 'SET_CURRENT_SPACE',
  SET_SPACE_DATA: 'SET_SPACE_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_NOTE: 'ADD_NOTE',
  REMOVE_NOTE: 'REMOVE_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  SET_UNSUBSCRIBE: 'SET_UNSUBSCRIBE'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case ACTIONS.SET_CURRENT_SPACE:
      return { ...state, currentSpace: action.payload };
    case ACTIONS.SET_SPACE_DATA:
      return { ...state, spaceData: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case ACTIONS.ADD_NOTE:
      if (!state.spaceData) return state;
      const { userId, note } = action.payload;
      const updatedUsers = {
        ...state.spaceData.users,
        [userId]: {
          ...state.spaceData.users[userId],
          notes: [...(state.spaceData.users[userId]?.notes || []), note]
        }
      };
      return {
        ...state,
        spaceData: {
          ...state.spaceData,
          users: updatedUsers
        }
      };
    case ACTIONS.REMOVE_NOTE:
      if (!state.spaceData) return state;
      const { userId: removeUserId, noteId } = action.payload;
      const usersAfterRemove = {
        ...state.spaceData.users,
        [removeUserId]: {
          ...state.spaceData.users[removeUserId],
          notes: state.spaceData.users[removeUserId].notes.filter(note => note.id !== noteId)
        }
      };
      return {
        ...state,
        spaceData: {
          ...state.spaceData,
          users: usersAfterRemove
        }
      };
    case ACTIONS.UPDATE_NOTE:
      if (!state.spaceData) return state;
      const { userId: updateUserId, noteId: updateNoteId, updates } = action.payload;
      const usersAfterUpdate = {
        ...state.spaceData.users,
        [updateUserId]: {
          ...state.spaceData.users[updateUserId],
          notes: state.spaceData.users[updateUserId].notes.map(note =>
            note.id === updateNoteId ? { ...note, ...updates } : note
          )
        }
      };
      return {
        ...state,
        spaceData: {
          ...state.spaceData,
          users: usersAfterUpdate
        }
      };
    case ACTIONS.SET_UNSUBSCRIBE:
      return { ...state, unsubscribe: action.payload };
    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      console.log('Auth state changed:', user ? 'User authenticated' : 'User signed out');
      dispatch({ type: ACTIONS.SET_USER, payload: user });
    });

    return () => unsubscribe();
  }, []);

  // Cleanup space subscription when changing spaces or user authentication changes
  useEffect(() => {
    // Clean up existing subscription
    if (state.unsubscribe) {
      state.unsubscribe();
      dispatch({ type: ACTIONS.SET_UNSUBSCRIBE, payload: null });
    }

    // Only subscribe to space if user is authenticated and has a current space
    if (state.user && state.currentSpace) {
      console.log('Setting up space subscription for:', state.currentSpace);
      
      try {
        const unsubscribe = subscribeToSpace(state.currentSpace, (spaceData) => {
          console.log('Space data updated:', spaceData);
          dispatch({ type: ACTIONS.SET_SPACE_DATA, payload: spaceData });
        });
        
        dispatch({ type: ACTIONS.SET_UNSUBSCRIBE, payload: unsubscribe });
      } catch (error) {
        console.error('Error setting up space subscription:', error);
        dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      }
    } else if (state.currentSpace && !state.user) {
      console.log('User not authenticated, cannot subscribe to space');
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Please sign in to access the space' });
    }
  }, [state.currentSpace, state.user]);

  // Actions
  const actions = {
    setCurrentSpace: (spaceId) => {
      console.log('Setting current space to:', spaceId);
      dispatch({ type: ACTIONS.SET_CURRENT_SPACE, payload: spaceId });
    },
    setSpaceData: (data) => dispatch({ type: ACTIONS.SET_SPACE_DATA, payload: data }),
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    setError: (error) => dispatch({ type: ACTIONS.SET_ERROR, payload: error }),
    addNote: (userId, note) => dispatch({ type: ACTIONS.ADD_NOTE, payload: { userId, note } }),
    addNoteOptimistic: (userId, note) => dispatch({ type: ACTIONS.ADD_NOTE, payload: { userId, note } }),
    removeNote: (userId, noteId) => dispatch({ type: ACTIONS.REMOVE_NOTE, payload: { userId, noteId } }),
    updateNote: (userId, noteId, updates) => dispatch({ type: ACTIONS.UPDATE_NOTE, payload: { userId, noteId, updates } })
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
