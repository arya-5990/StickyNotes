import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import StickyNote from './StickyNote';
import { addNote } from '../services/firebaseService';
import config from '../config/environment';

const Space = () => {
  const { state, actions } = useApp();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [lastAddedNoteId, setLastAddedNoteId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Get users from space data
  const users = state.spaceData?.users ? Object.entries(state.spaceData.users) : [];
  const currentUser = state.user;

  // Function to calculate position for new note to avoid overlapping
  const calculateNotePosition = (existingNotes) => {
    const noteWidth = 256; // w-64 = 16rem = 256px
    const noteHeight = 200; // Approximate height
    const padding = 20;
    const containerWidth = 600; // Container width minus padding
    const containerHeight = 400; // Container height minus padding
    
    // If no existing notes, start at the top-left
    if (existingNotes.length === 0) {
      return { x: padding, y: padding };
    }
    
    // Create a grid of possible positions
    const cols = Math.floor(containerWidth / (noteWidth + padding));
    const rows = Math.floor(containerHeight / (noteHeight + padding));
    
    // Try to find an empty position in the grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * (noteWidth + padding) + padding;
        const y = row * (noteHeight + padding) + padding;
        
        // Check if this position is occupied
        const isOccupied = existingNotes.some(note => {
          const noteX = note.position?.x || 0;
          const noteY = note.position?.y || 0;
          
          // Check if notes overlap (with some tolerance)
          const horizontalOverlap = Math.abs(noteX - x) < (noteWidth + padding);
          const verticalOverlap = Math.abs(noteY - y) < (noteHeight + padding);
          
          return horizontalOverlap && verticalOverlap;
        });
        
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    
    // If no empty position found in grid, use a spiral pattern
    const index = existingNotes.length;
    const spiralRadius = Math.floor(index / 4) * 50;
    const spiralAngle = (index % 4) * Math.PI / 2;
    
    const spiralX = 100 + spiralRadius * Math.cos(spiralAngle);
    const spiralY = 100 + spiralRadius * Math.sin(spiralAngle);
    
    // Ensure position is within bounds
    return {
      x: Math.max(padding, Math.min(spiralX, containerWidth - noteWidth - padding)),
      y: Math.max(padding, Math.min(spiralY, containerHeight - noteHeight - padding))
    };
  };

  // Effect to scroll to newly added note
  useEffect(() => {
    if (lastAddedNoteId) {
      const noteElement = document.getElementById(`note-${lastAddedNoteId}`);
      if (noteElement) {
        noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        noteElement.classList.add('animate-pulse', 'ring-2', 'ring-blue-500');
        setTimeout(() => {
          noteElement.classList.remove('animate-pulse', 'ring-2', 'ring-blue-500');
        }, 2000);
      }
      setLastAddedNoteId(null);
    }
  }, [lastAddedNoteId, state.spaceData]);

  // Effect to fix overlapping notes on load
  useEffect(() => {
    if (state.spaceData?.users) {
      Object.entries(state.spaceData.users).forEach(([userId, userData]) => {
        if (userData.notes && userData.notes.length > 0) {
          const notes = [...userData.notes];
          let hasOverlapping = false;
          
          // Check for overlapping notes
          for (let i = 0; i < notes.length; i++) {
            for (let j = i + 1; j < notes.length; j++) {
              const note1 = notes[i];
              const note2 = notes[j];
              
              const noteWidth = 256;
              const noteHeight = 200;
              const padding = 20;
              
              const horizontalOverlap = Math.abs(note1.position?.x - note2.position?.x) < (noteWidth + padding);
              const verticalOverlap = Math.abs(note1.position?.y - note2.position?.y) < (noteHeight + padding);
              
              if (horizontalOverlap && verticalOverlap) {
                hasOverlapping = true;
                // Reposition the second note
                const newPosition = calculateNotePosition(notes.slice(0, j));
                actions.updateNote(userId, note2.id, { position: newPosition });
                notes[j] = { ...note2, position: newPosition };
              }
            }
          }
          
          if (hasOverlapping) {
            console.log('Fixed overlapping notes for user:', userId);
          }
        }
      });
    }
  }, [state.spaceData]);

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    setIsAddingNote(true);
    
    try {
      // Calculate position for new note to avoid overlapping
      const currentUserNotes = state.spaceData?.users?.[currentUser.id]?.notes || [];
      const newPosition = calculateNotePosition(currentUserNotes);

      const newNote = {
        title: newNoteTitle,
        content: newNoteContent,
        position: newPosition
      };

      // Add note optimistically for immediate UI feedback
      const tempNote = {
        id: `temp-${Date.now()}`,
        ...newNote,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      actions.addNoteOptimistic(currentUser.id, tempNote);

      const addedNote = await addNote(state.currentSpace, currentUser.id, newNote);
      
      // Store the note ID to highlight it when it appears
      setLastAddedNoteId(addedNote.id);
      
      // Clear form and close modal
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
      
      // Show success message
      console.log('Note added successfully:', addedNote.id);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      
    } catch (error) {
      console.error('Failed to add note:', error);
      // Show user-friendly error message
      if (error.message.includes('Maximum notes limit reached')) {
        alert(`You've reached the maximum number of notes (${config.ui.maxNotesPerUser}). Please delete some notes before adding new ones.`);
      } else {
        alert(`Failed to add note: ${error.message}`);
      }
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddNote();
    }
  };

  if (!state.spaceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading space...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Space: {state.currentSpace}
              </h1>
              <span className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                {users.length} users
              </span>
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live updates</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {showAddNote ? 'Cancel' : '+ Add Note'}
              </button>
              <button
                onClick={() => actions.setCurrentSpace(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Leave Space
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Note added successfully!</span>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Note</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Note content"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                onKeyPress={handleKeyPress}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-transparent resize-none"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleAddNote}
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim() || isAddingNote}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isAddingNote ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Note'
                  )}
                </button>
                <button
                  onClick={() => setShowAddNote(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Press Ctrl+Enter to save quickly
              </p>
              <p className="text-xs text-blue-500 text-center">
                Note limit: {config.ui.maxNotesPerUser} per user
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Grid Layout */}
      <div className="max-w-7xl mx-auto p-4">
        <div 
          className="grid gap-4"
          style={{
            gridTemplateColumns: `repeat(${users.length}, 1fr)`,
            minHeight: 'calc(100vh - 120px)'
          }}
        >
          {users.map(([userId, userData]) => (
            <div
              key={userId}
              className={`bg-white rounded-lg shadow-sm border-2 ${
                userId === currentUser.id 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              {/* User Header */}
              <div className={`p-4 border-b ${
                userId === currentUser.id 
                  ? 'bg-blue-100 border-blue-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    userId === currentUser.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-400 text-white'
                  }`}>
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${
                      userId === currentUser.id ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {userData.name}
                      {userId === currentUser.id && ' (You)'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {userData.notes.length} / {config.ui.maxNotesPerUser} notes
                    </p>
                  </div>
                </div>
              </div>

                             {/* Notes Container */}
               <div className="p-4 relative min-h-[400px] overflow-hidden">
                 {userData.notes.length === 0 ? (
                   <div className="text-center text-gray-500 py-8">
                     <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <p>No notes yet</p>
                     {userId === currentUser.id && (
                       <p className="text-sm">Click "Add Note" to get started!</p>
                     )}
                   </div>
                 ) : (
                   <div className="relative w-full h-full">
                     {userData.notes.map((note) => (
                       <StickyNote
                         key={note.id}
                         note={note}
                         userId={userId}
                         isOwnNote={userId === currentUser.id}
                       />
                     ))}
                   </div>
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Space;
