import config from '../config/environment';

// Mock data structure
const mockData = {
  "spaces": {
    "abc123": {
      "users": {
        "user1": { 
          "name": "Alice", 
          "notes": [
            { "id": 1, "title": "Welcome!", "content": "This is my first sticky note!", "position": { x: 50, y: 50 } },
            { "id": 2, "title": "Todo", "content": "Buy groceries\nCall mom\nFinish project", "position": { x: 200, y: 100 } }
          ] 
        },
        "user2": { 
          "name": "Bob", 
          "notes": [
            { "id": 3, "title": "Ideas", "content": "New app concept\nDesign improvements", "position": { x: 50, y: 50 } }
          ] 
        },
        "user3": { 
          "name": "Charlie", 
          "notes": [] 
        }
      }
    },
    "demo456": {
      "users": {
        "user1": { 
          "name": "Alice", 
          "notes": [
            { "id": 4, "title": "Demo Space", "content": "This is a different space!", "position": { x: 50, y: 50 } }
          ] 
        }
      }
    }
  }
};

// Simulate network delay using environment config
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Firebase-like functions
export const getSpaceData = async (spaceId) => {
  await delay(config.mock.delayMs); // Use configured delay
  
  if (!mockData.spaces[spaceId]) {
    throw new Error('Space not found');
  }
  
  return mockData.spaces[spaceId];
};

export const addNote = async (spaceId, userId, note) => {
  await delay(config.mock.delayMs * 0.6); // 60% of base delay
  
  if (!mockData.spaces[spaceId]) {
    throw new Error('Space not found');
  }
  
  if (!mockData.spaces[spaceId].users[userId]) {
    throw new Error('User not found in space');
  }
  
  // Check note limit from config
  if (mockData.spaces[spaceId].users[userId].notes.length >= config.ui.maxNotesPerUser) {
    throw new Error(`Maximum notes limit reached (${config.ui.maxNotesPerUser})`);
  }
  
  const newNote = {
    ...note,
    id: Date.now(),
    position: note.position || { x: 50, y: 50 }
  };
  
  mockData.spaces[spaceId].users[userId].notes.push(newNote);
  return newNote;
};

export const removeNote = async (spaceId, userId, noteId) => {
  await delay(config.mock.delayMs * 0.4); // 40% of base delay
  
  if (!mockData.spaces[spaceId]?.users[userId]) {
    throw new Error('Space or user not found');
  }
  
  const userNotes = mockData.spaces[spaceId].users[userId].notes;
  const noteIndex = userNotes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    throw new Error('Note not found');
  }
  
  userNotes.splice(noteIndex, 1);
  return { success: true };
};

export const updateNote = async (spaceId, userId, noteId, updates) => {
  await delay(config.mock.delayMs * 0.4); // 40% of base delay
  
  if (!mockData.spaces[spaceId]?.users[userId]) {
    throw new Error('Space or user not found');
  }
  
  const userNotes = mockData.spaces[spaceId].users[userId].notes;
  const noteIndex = userNotes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) {
    throw new Error('Note not found');
  }
  
  mockData.spaces[spaceId].users[userId].notes[noteIndex] = {
    ...mockData.spaces[spaceId].users[userId].notes[noteIndex],
    ...updates
  };
  
  return mockData.spaces[spaceId].users[userId].notes[noteIndex];
};

export const createSpace = async (spaceId) => {
  await delay(config.mock.delayMs * 0.8); // 80% of base delay
  
  if (mockData.spaces[spaceId]) {
    throw new Error('Space already exists');
  }
  
  mockData.spaces[spaceId] = {
    users: {}
  };
  
  return { success: true, spaceId };
};

export const joinSpace = async (spaceId, user) => {
  await delay(config.mock.delayMs * 0.6); // 60% of base delay
  
  if (!mockData.spaces[spaceId]) {
    throw new Error('Space not found');
  }
  
  if (!mockData.spaces[spaceId].users[user.id]) {
    mockData.spaces[spaceId].users[user.id] = {
      name: user.name,
      notes: []
    };
  }
  
  return mockData.spaces[spaceId];
};

// Get demo spaces from config
export const getDemoSpaces = () => {
  return config.demoSpaces;
};

// Check if mock mode is enabled
export const isMockEnabled = () => {
  return config.mock.enabled;
};
