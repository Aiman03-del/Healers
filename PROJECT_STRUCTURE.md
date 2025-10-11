# 📁 Healers Project Structure

This document describes the organized folder structure of the Healers application.

## 🗂️ Overview

The project follows a feature-based architecture with clear separation of concerns, making it easy to maintain and scale.

```
healers-app/
├── src/
│   ├── components/           # All UI components
│   │   ├── common/          # Reusable generic components
│   │   ├── layout/          # Layout components (Navbar, Sidebar, etc.)
│   │   └── features/        # Feature-specific components
│   │       ├── audio/       # Audio player components
│   │       ├── playlists/   # Playlist-related components
│   │       ├── songs/       # Song card and related components
│   │       └── search/      # Search functionality components
│   ├── pages/               # Page components (routes)
│   │   └── admin/          # Admin-specific pages
│   ├── context/             # React Context providers
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services and external integrations
│   ├── config/              # App configuration (Firebase, etc.)
│   ├── constants/           # Constants, enums, and static data
│   ├── utils/               # Utility functions
│   ├── assets/              # Static assets (images, fonts, etc.)
│   └── Routes/              # Route guards and protection
├── public/                  # Public static files
└── ...config files
```

## 📂 Detailed Structure

### `src/components/`

Organized by usage pattern and feature:

#### `common/`
Generic, reusable UI components that can be used anywhere:
- `ErrorBoundary.jsx` - Catches and displays React errors
- `Loading.jsx` - Loading spinner component
- `Modal.jsx` - Generic modal component

#### `layout/`
Components that define the app structure:
- `Navbar.jsx` - Top navigation bar
- `DashboardSidebar.jsx` - Dashboard sidebar navigation
- `MainLayout.jsx` - Main app layout wrapper
- `DashboardLayout/` - Dashboard layout wrapper

#### `features/`
Feature-specific components grouped by domain:

**`audio/`**
- `AudioPlayer.jsx` - Main audio player with controls

**`playlists/`**
- `AddToPlaylistModal.jsx` - Modal to add songs to playlists
- `PlaylistModal.jsx` - Playlist creation/edit modal

**`songs/`**
- `SongCard.jsx` - Individual song card component

**`search/`**
- `SearchBar.jsx` - Search functionality component

### `src/pages/`

Page-level components corresponding to routes:
- `Home.jsx` - Home page
- `HomeContent.jsx` - Home page content
- `Login.jsx` - Login page
- `Register.jsx` - Registration page
- `MyProfile.jsx` - User profile page
- `MyPlaylists.jsx` - User playlists page
- `PlaylistDetails.jsx` - Single playlist view
- `PublicPlaylist.jsx` - Public playlist share page
- `Onboarding.jsx` - New user onboarding
- `NotFound.jsx` - 404 page
- `Forbidden.jsx` - 403 access denied page

**`admin/`**
Admin-only pages:
- `AddSong.jsx` - Add new songs
- `AllSongs.jsx` - Manage all songs
- `ManageUsers.jsx` - User management
- `Statistics.jsx` - Analytics dashboard
- `DashboardHome.jsx` - Dashboard home

### `src/context/`

React Context providers for global state:
- `AuthContext.jsx` - Authentication state and methods
- `AudioContext.jsx` - Audio player state and controls

### `src/hooks/`

Custom React hooks:
- `useAxios.js` - Axios wrapper hook for API calls

### `src/services/`

External services and API integrations:
- `api.js` - Centralized API service with axios instance
- `index.js` - Barrel export for services

### `src/config/`

Application configuration:
- `firebase.js` - Firebase configuration and initialization
- `index.js` - Barrel export for configs

### `src/constants/`

Application constants and enums:
- `index.js` - All constants (API URLs, messages, roles, etc.)

### `src/utils/`

Utility functions:
- `avatarFromEmail.js` - Generate avatar from email
- `upload.js` - File upload utilities

### `src/Routes/`

Route protection components:
- `PrivateRoute.jsx` - Requires authentication
- `RoleRoute.jsx` - Requires specific user role

## 🎯 Import Patterns

### Using Barrel Exports

Each folder has an `index.js` that exports all components, allowing clean imports:

```javascript
// ✅ Good - Clean import from barrel export
import { ErrorBoundary, Loading, Modal } from '@/components/common';
import { Navbar, MainLayout } from '@/components/layout';
import { AudioPlayer } from '@/components/features/audio';
import { apiService } from '@/services';
import { THEMES, USER_ROLES } from '@/constants';

// ❌ Avoid - Direct imports without using barrel exports
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Loading from '@/components/common/Loading';
```

### Import Examples

```javascript
// Components
import { ErrorBoundary, Loading } from './components/common';
import { Navbar, DashboardLayout } from './components/layout';
import { AudioPlayer } from './components/features/audio';
import { SongCard } from './components/features/songs';
import { SearchBar } from './components/features/search';

// Services & Config
import { apiService } from './services';
import { auth } from './config';
import { THEMES, USER_ROLES, TOAST_MESSAGES } from './constants';

// Context & Hooks
import { useAuth } from './context/AuthContext';
import { useAudio } from './context/AudioContext';
import useAxios from './hooks/useAxios';
```

## 🔄 Adding New Components

### Step 1: Choose the Right Location

- **Reusable UI component** → `components/common/`
- **Layout component** → `components/layout/`
- **Feature-specific** → `components/features/{feature}/`
- **New page** → `pages/`

### Step 2: Create the Component

```bash
# Example: Adding a new feature component
touch src/components/features/comments/CommentList.jsx
```

### Step 3: Export from Barrel File

```javascript
// src/components/features/comments/index.js
export { default as CommentList } from './CommentList';
```

### Step 4: Import and Use

```javascript
import { CommentList } from './components/features/comments';
```

## 📊 Benefits of This Structure

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Clear organization makes code easy to find
3. **Reusability**: Common components are separated and reusable
4. **Collaboration**: Team members know where to put new code
5. **Testing**: Easy to test individual features in isolation
6. **Code Splitting**: Feature-based structure enables lazy loading

## 🔍 Finding Components

Use this quick reference:

| Need | Location |
|------|----------|
| Generic UI component | `components/common/` |
| Navigation/Layout | `components/layout/` |
| Audio features | `components/features/audio/` |
| Playlist features | `components/features/playlists/` |
| Song displays | `components/features/songs/` |
| Search functionality | `components/features/search/` |
| A new page/route | `pages/` |
| Admin page | `pages/admin/` |
| API call | `services/api.js` |
| Configuration | `config/` |
| Constants/Enums | `constants/` |
| Utility function | `utils/` |

## 🚀 Best Practices

1. **Keep components small**: Single responsibility principle
2. **Use barrel exports**: Makes imports cleaner
3. **Colocate related files**: Keep feature files together
4. **Consistent naming**: Use PascalCase for components
5. **Document complex logic**: Add comments where needed
6. **Avoid deep nesting**: Maximum 3-4 levels deep

---

**Last Updated**: October 2025
**Maintained By**: Healers Development Team

