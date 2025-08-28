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
  const [newNoteColor, setNewNoteColor] = useState('yellow');
  const [newNoteFont, setNewNoteFont] = useState('handwriting');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [lastAddedNoteId, setLastAddedNoteId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Get users from space data
  const users = state.spaceData?.users ? Object.entries(state.spaceData.users) : [];
  const currentUser = state.user;

  // Helper function to get font class
  const getFontClass = (font) => {
    const fontStyles = {
      handwriting: 'font-handwriting',
      cursive: 'font-cursive',
      typewriter: 'font-mono',
      serif: 'font-serif',
      sans: 'font-sans'
    };
    return fontStyles[font] || fontStyles.handwriting;
  };

  // Function to calculate position for new note in grid system
  const calculateNotePosition = (existingNotes) => {
    const noteWidth = 256; // w-64 = 16rem = 256px
    const noteHeight = 200; // Approximate height
    const gridSpacing = 20; // Space between grid cells
    const containerWidth = 600; // Container width minus padding
    const containerHeight = 400; // Container height minus padding
    
    // Calculate grid dimensions
    const cols = Math.floor(containerWidth / (noteWidth + gridSpacing));
    const rows = Math.floor(containerHeight / (noteHeight + gridSpacing));
    
    // If no existing notes, start at the top-left grid position
    if (existingNotes.length === 0) {
      return { x: gridSpacing, y: gridSpacing };
    }
    
    // Try to find an empty grid position
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * (noteWidth + gridSpacing) + gridSpacing;
        const y = row * (noteHeight + gridSpacing) + gridSpacing;
        
        // Check if this grid position is occupied
        const isOccupied = existingNotes.some(note => {
          const noteX = note.position?.x || 0;
          const noteY = note.position?.y || 0;
          
          // Check if notes are in the same grid cell (with tolerance)
          const horizontalMatch = Math.abs(noteX - x) < (noteWidth / 2);
          const verticalMatch = Math.abs(noteY - y) < (noteHeight / 2);
          
          return horizontalMatch && verticalMatch;
        });
        
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    
    // If no empty grid position found, add to the next available position
    const nextIndex = existingNotes.length;
    const nextRow = Math.floor(nextIndex / cols);
    const nextCol = nextIndex % cols;
    
    const nextX = nextCol * (noteWidth + gridSpacing) + gridSpacing;
    const nextY = nextRow * (noteHeight + gridSpacing) + gridSpacing;
    
    // Ensure position is within bounds
    return {
      x: Math.max(gridSpacing, Math.min(nextX, containerWidth - noteWidth - gridSpacing)),
      y: Math.max(gridSpacing, Math.min(nextY, containerHeight - noteHeight - gridSpacing))
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

  // Effect to fix overlapping notes on load and ensure grid alignment
  useEffect(() => {
    if (state.spaceData?.users) {
      Object.entries(state.spaceData.users).forEach(([userId, userData]) => {
        if (userData.notes && userData.notes.length > 0) {
          const notes = [...userData.notes];
          let hasOverlapping = false;
          const gridSpacing = 20;
          const noteWidth = 256;
          const noteHeight = 200;
          
          // Check for overlapping notes and misaligned grid positions
          for (let i = 0; i < notes.length; i++) {
            for (let j = i + 1; j < notes.length; j++) {
              const note1 = notes[i];
              const note2 = notes[j];
              
              // Check if notes are in the same grid cell
              const horizontalMatch = Math.abs(note1.position?.x - note2.position?.x) < (noteWidth / 2);
              const verticalMatch = Math.abs(note1.position?.y - note2.position?.y) < (noteHeight / 2);
              
              if (horizontalMatch && verticalMatch) {
                hasOverlapping = true;
                // Reposition the second note to next available grid position
                const newPosition = calculateNotePosition(notes.slice(0, j));
                actions.updateNote(userId, note2.id, { position: newPosition });
                notes[j] = { ...note2, position: newPosition };
              }
            }
            
            // Also check if note is properly aligned to grid
            const note = notes[i];
            const gridX = Math.round(note.position?.x / (noteWidth + gridSpacing)) * (noteWidth + gridSpacing);
            const gridY = Math.round(note.position?.y / (noteHeight + gridSpacing)) * (noteHeight + gridSpacing);
            
            if (Math.abs(note.position?.x - gridX) > 5 || Math.abs(note.position?.y - gridY) > 5) {
              // Note is not properly aligned to grid, fix it
              const alignedPosition = { x: gridX, y: gridY };
              actions.updateNote(userId, note.id, { position: alignedPosition });
              notes[i] = { ...note, position: alignedPosition };
              console.log('Fixed grid alignment for note:', note.id);
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
         color: newNoteColor,
         font: newNoteFont,
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
       setNewNoteColor('yellow');
       setNewNoteFont('handwriting');
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
               
               {/* Color Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Note Color</label>
                 <div className="grid grid-cols-4 gap-2">
                   {['yellow', 'pink', 'blue', 'green', 'orange', 'purple', 'red', 'teal'].map((color) => (
                     <button
                       key={color}
                       onClick={() => setNewNoteColor(color)}
                       className={`w-8 h-8 rounded-full border-2 transition-all ${
                         newNoteColor === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:scale-105'
                       }`}
                       style={{
                         backgroundColor: {
                           yellow: '#fef3c7',
                           pink: '#fce7f3',
                           blue: '#dbeafe',
                           green: '#dcfce7',
                           orange: '#fed7aa',
                           purple: '#f3e8ff',
                           red: '#fee2e2',
                           teal: '#ccfbf1'
                         }[color]
                       }}
                       title={color.charAt(0).toUpperCase() + color.slice(1)}
                     />
                   ))}
                 </div>
               </div>
               
               {/* Font Selection */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Note Font</label>
                 <select
                   value={newNoteFont}
                   onChange={(e) => setNewNoteFont(e.target.value)}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 >
                   <option value="handwriting" className="font-handwriting">Handwriting</option>
                   <option value="cursive" className="font-cursive">Cursive</option>
                   <option value="typewriter" className="font-mono">Typewriter</option>
                   <option value="serif" className="font-serif">Serif</option>
                   <option value="sans" className="font-sans">Sans</option>
                 </select>
               </div>
               
               {/* Preview */}
               <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                 <div 
                   className="p-3 rounded-lg border-2 shadow-sm"
                   style={{
                     backgroundColor: {
                       yellow: '#fef3c7',
                       pink: '#fce7f3',
                       blue: '#dbeafe',
                       green: '#dcfce7',
                       orange: '#fed7aa',
                       purple: '#f3e8ff',
                       red: '#fee2e2',
                       teal: '#ccfbf1'
                     }[newNoteColor],
                     borderColor: {
                       yellow: '#fbbf24',
                       pink: '#f472b6',
                       blue: '#60a5fa',
                       green: '#34d399',
                       orange: '#fb923c',
                       purple: '#a78bfa',
                       red: '#f87171',
                       teal: '#5eead4'
                     }[newNoteColor]
                   }}
                 >
                   <div className={`text-sm ${getFontClass(newNoteFont)}`}>
                     <div className="font-bold mb-1">{newNoteTitle || 'Note Title'}</div>
                     <div>{newNoteContent || 'Note content will appear here...'}</div>
                   </div>
                 </div>
               </div>
               
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
                 {/* Grid Background */}
                 <div className="absolute inset-0 pointer-events-none">
                   <div 
                     className="w-full h-full"
                     style={{
                       backgroundImage: `
                         linear-gradient(to right, #f3f4f6 1px, transparent 1px),
                         linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
                       `,
                       backgroundSize: '276px 220px', // noteWidth + gridSpacing = 256 + 20
                       backgroundPosition: '20px 20px'
                     }}
                   />
                 </div>
                 
                 {userData.notes.length === 0 ? (
                   <div className="text-center text-gray-500 py-8 relative z-10">
                     <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <p>No notes yet</p>
                     {userId === currentUser.id && (
                       <p className="text-sm">Click "Add Note" to get started!</p>
                     )}
                   </div>
                 ) : (
                   <div className="relative w-full h-full z-10">
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
