import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { updateNote, removeNote } from '../services/firebaseService';
import config from '../config/environment';

const StickyNote = ({ note, userId, isOwnNote }) => {
  const { state, actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const noteRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const lastSavedPosition = useRef(note.position);
  const saveTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = (e) => {
    if (!isOwnNote) return;
    
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - note.position.x,
      y: e.clientY - note.position.y
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    
    // Get container bounds
    const container = noteRef.current?.parentElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const noteWidth = 256; // w-64
      const noteHeight = 200; // Approximate height
      
      // Constrain position within container bounds
      const constrainedX = Math.max(0, Math.min(newX, containerRect.width - noteWidth));
      const constrainedY = Math.max(0, Math.min(newY, containerRect.height - noteHeight));
      
      const newPosition = { x: constrainedX, y: constrainedY };
      
      // Update note position in real-time for visual feedback
      actions.updateNote(userId, note.id, {
        position: newPosition
      });
      
      // Debounced save during dragging (only for own notes)
      if (isOwnNote) {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Set new timeout to save position
        saveTimeoutRef.current = setTimeout(async () => {
          const lastPosition = lastSavedPosition.current;
          if (newPosition.x !== lastPosition.x || newPosition.y !== lastPosition.y) {
            setIsSavingPosition(true);
            try {
              await updateNote(note.id, {
                position: newPosition
              });
              lastSavedPosition.current = newPosition;
              console.log('Note position saved during drag:', newPosition);
            } catch (error) {
              console.error('Failed to save note position during drag:', error);
            } finally {
              setIsSavingPosition(false);
            }
          }
        }, 500); // Save after 500ms of no movement
      }
    } else {
      // Fallback if container not found
      actions.updateNote(userId, note.id, {
        position: { x: newX, y: newY }
      });
    }
  };

  const handleMouseUp = async () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    // Save the final position to Firebase
    if (isOwnNote && note.position) {
      const currentPosition = note.position;
      const lastPosition = lastSavedPosition.current;
      
      // Only save if position actually changed
      if (currentPosition.x !== lastPosition.x || currentPosition.y !== lastPosition.y) {
        setIsSavingPosition(true);
        try {
          await updateNote(note.id, {
            position: currentPosition
          });
          lastSavedPosition.current = currentPosition;
          console.log('Note position saved:', currentPosition);
        } catch (error) {
          console.error('Failed to save note position:', error);
          // Revert to last saved position on error
          actions.updateNote(userId, note.id, {
            position: lastPosition
          });
        } finally {
          setIsSavingPosition(false);
        }
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateNote(note.id, {
        title: editTitle,
        content: editContent
      });
      // Note will be automatically updated via real-time subscription
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await removeNote(note.id);
        // Note will be automatically removed via real-time subscription
      } catch (error) {
        console.error('Failed to delete note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  // Use note colors from environment config
  const noteColors = config.ui.noteColors.map(color => `bg-${color}-100 border-${color}-300`);
  const colorClass = noteColors[note.id % noteColors.length];

  return (
    <div
      id={`note-${note.id}`}
      ref={noteRef}
      className={`absolute w-64 p-4 rounded-lg shadow-lg border-2 cursor-move transition-all duration-200 ${
        isDragging ? 'scale-105 shadow-2xl z-50' : 'hover:scale-102'
      } ${isSavingPosition ? 'ring-2 ring-blue-500' : ''} ${colorClass}`}
      style={{
        left: note.position.x,
        top: note.position.y,
        transform: isDragging ? 'scale(1.05)' : 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-2 py-1 text-lg font-bold bg-transparent border-b border-gray-400 focus:outline-none focus:border-gray-600"
            placeholder="Note title"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-2 py-1 bg-transparent border border-gray-300 rounded focus:outline-none focus:border-gray-600 resize-none"
            rows="4"
            placeholder="Note content"
          />
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800 break-words">
              {note.title}
            </h3>
            {isOwnNote && (
              <div className="flex space-x-1 ml-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                  title="Edit note"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                  title="Delete note"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
                     <div className="text-gray-700 whitespace-pre-wrap break-words">
             {note.content}
           </div>
           <div className="mt-2 flex items-center justify-between">
             {isSavingPosition && (
               <div className="flex items-center space-x-1 text-xs text-blue-600">
                 <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>Saving position...</span>
               </div>
             )}
             {!isOwnNote && (
               <div className="text-xs text-gray-500">
                 Click and drag to move (if you own this note)
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default StickyNote;
