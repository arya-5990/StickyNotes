import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import StickyNote from './StickyNote';
import { addNote } from '../services/firebaseService';
import config from '../config/environment';

const Space = () => {
  const { state, actions } = useApp();
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Get users from space data
  const users = state.spaceData?.users ? Object.entries(state.spaceData.users) : [];
  const currentUser = state.user;

  const handleAddNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    try {
      const newNote = {
        title: newNoteTitle,
        content: newNoteContent,
        position: { x: 50, y: 50 }
      };

      await addNote(state.currentSpace, currentUser.id, newNote);
      // Note will be automatically added via real-time subscription
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNote(false);
    } catch (error) {
      console.error('Failed to add note:', error);
      // Show user-friendly error message
      if (error.message.includes('Maximum notes limit reached')) {
        alert(`You've reached the maximum number of notes (${config.ui.maxNotesPerUser}). Please delete some notes before adding new ones.`);
      } else {
        alert(`Failed to add note: ${error.message}`);
      }
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
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
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
              <div className="p-4 relative min-h-[400px]">
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
                  userData.notes.map((note) => (
                    <StickyNote
                      key={note.id}
                      note={note}
                      userId={userId}
                      isOwnNote={userId === currentUser.id}
                    />
                  ))
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
