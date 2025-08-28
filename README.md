# StickyNotes! - Real-time Collaborative Sticky Notes

A React application that allows users to collaborate on sticky notes in real-time spaces. Built with React, TailwindCSS, and **Firebase** for real-time collaboration.

## Features

- **✅ Firebase Google Authentication**: Real Google sign-in system
- **✅ Real-time Collaboration**: Live updates using Firestore
- **✅ Dynamic Spaces**: Join existing spaces or create new ones with unique IDs
- **✅ Dynamic Layout**: Screen automatically divides into equal sections based on number of users
- **✅ Draggable Notes**: Move sticky notes within your section
- **✅ Rich Note Editing**: Add, edit, and delete notes with title and content
- **✅ Responsive Design**: Modern UI built with TailwindCSS
- **✅ Environment Configuration**: Flexible configuration via environment variables

## Tech Stack

- **Frontend**: React 19 with functional components and hooks
- **State Management**: Context API with useReducer
- **Styling**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Real-time updates)
- **Drag & Drop**: Custom mouse event handling
- **Configuration**: Environment-based settings management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project (already configured)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stickynotesweb
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (optional):
```bash
# Copy the example environment file
cp env.example .env.local

# Edit .env.local if you want to override Firebase settings
# Firebase is already configured and working by default
```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Integration

The app is now fully integrated with Firebase:

### **Authentication**
- Google Sign-in using Firebase Auth
- Automatic user profile management
- Secure session handling

### **Database**
- Firestore for real-time data storage
- Automatic data synchronization
- Optimistic updates for better UX

### **Real-time Features**
- Live note updates across all users
- Real-time space collaboration
- Automatic data persistence

### **Security**
- Firestore security rules implemented
- User-based access control
- Secure data operations

## Environment Configuration

The app uses environment variables for configuration. Create a `.env.local` file in the root directory:

### Basic Configuration
```bash
# App Configuration
REACT_APP_NAME=StickyNotes!
REACT_APP_VERSION=1.0.0
REACT_APP_DESCRIPTION=Real-time collaborative sticky notes

# Firebase Configuration (already configured)
REACT_APP_FIREBASE_API_KEY=AIzaSyCHxeDeCZUeMvgf7GrsmmLXLegr9onh8ig
REACT_APP_FIREBASE_AUTH_DOMAIN=stickynotes-74a44.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=stickynotes-74a44
# ... other Firebase config

# UI Configuration
REACT_APP_MAX_NOTES_PER_USER=100
REACT_APP_NOTE_COLORS=yellow,blue,green,pink,purple,orange

# Development Settings
REACT_APP_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=info
```

### Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_NAME` | StickyNotes! | Application name |
| `REACT_APP_MAX_NOTES_PER_USER` | 100 | Maximum notes per user |
| `REACT_APP_NOTE_COLORS` | yellow,blue,green,pink,purple,orange | Available note colors |
| `REACT_APP_DEBUG_MODE` | false | Enable debug information |

## Usage

### 1. Login
- Click "Sign in with Google" to authenticate with Firebase
- Your Google account will be used for collaboration

### 2. Join a Space
- Enter a space ID (e.g., "abc123", "demo456")
- Click "Join Space" or "Create Space"
- Spaces are automatically created in Firestore

### 3. Collaborate
- View notes from all users in real-time
- Add new notes using the "+ Add Note" button
- Edit your notes by clicking the edit icon
- Drag notes around within your section
- Delete notes using the trash icon
- **All changes sync automatically across all users!**

## Project Structure

```
src/
├── components/
│   ├── Login.js          # Firebase authentication
│   ├── JoinSpace.js      # Space joining/creation
│   ├── Space.js          # Main collaboration interface
│   └── StickyNote.js     # Individual note component
├── config/
│   ├── environment.js    # Environment configuration
│   └── firebase.js       # Firebase configuration
├── context/
│   └── AppContext.js     # Global state management
├── services/
│   ├── authService.js    # Firebase authentication
│   ├── firebaseService.js # Firestore operations
│   └── mockDataService.js # Mock services (disabled)
├── App.js                # Main app component
└── index.js              # App entry point
```

## State Management

The app uses React Context API with a reducer pattern:

- **User State**: Firebase authentication state
- **Space State**: Current space ID and real-time data
- **Notes State**: Live Firestore updates and management

## Data Structure

The app uses Firestore with the following collections:

```javascript
// Spaces collection
spaces/{spaceId} = {
  createdAt: timestamp,
  updatedAt: timestamp
}

// Users collection
users/{userId} = {
  name: string,
  email: string,
  avatar: string,
  spaceId: string,
  joinedAt: timestamp
}

// Notes collection
notes/{noteId} = {
  title: string,
  content: string,
  position: { x: number, y: number },
  spaceId: string,
  userId: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Firebase Setup

The app is already configured with Firebase, but if you want to use your own project:

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)
2. **Enable Authentication** with Google sign-in
3. **Enable Firestore** database
4. **Update environment variables** with your Firebase config
5. **Deploy security rules** using the provided `firestore.rules`

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [x] Real Firebase integration ✅
- [x] Real-time collaboration ✅
- [x] Google authentication ✅
- [ ] User avatars and profiles
- [ ] Note categories and tags
- [ ] Rich text editing
- [ ] File attachments
- [ ] Mobile app
- [ ] Offline support
- [ ] User presence indicators
- [ ] Note sharing between spaces
