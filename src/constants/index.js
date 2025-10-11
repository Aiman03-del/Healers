// src/utils/constants.js

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_ENDPOINTS = {
  USERS: '/api/users',
  AUTH_LOGIN: '/api/auth/login',
  PLAYLISTS: '/api/playlists',
  SONGS: '/api/songs',
};

// Playlist Names
export const PLAYLIST_NAMES = {
  LIKED_SONGS: 'Liked Songs',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  USER: 'user',
};

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// 🎨 Brand Colors (Only 3 colors!)
export const COLORS = {
  // Primary - Text & Main UI (Purple - Most Used)
  primary: {
    DEFAULT: '#7c3aed',     // purple-600 - Main brand color
    light: '#a78bfa',       // purple-400 - Lighter variant
    dark: '#6d28d9',        // purple-700 - Darker variant
  },
  
  // Secondary - Backgrounds & Cards (Gray - 2nd Most Used)
  secondary: {
    DEFAULT: '#18181b',     // gray-900 - Dark backgrounds
    light: '#27272a',       // gray-800 - Card backgrounds
    lighter: '#3f3f46',     // gray-700 - Borders
  },
  
  // Accent - Buttons & CTAs (Fuchsia - Action Color)
  accent: {
    DEFAULT: '#a21caf',     // fuchsia-700 - Primary buttons
    light: '#c026d3',       // fuchsia-600 - Hover state
    gradient: 'linear-gradient(90deg, #7c3aed 0%, #a21caf 100%)', // purple to fuchsia
  },
  
  // Text colors (derived from primary & secondary)
  text: {
    primary: '#ffffff',     // White text on dark
    secondary: '#a1a1aa',   // gray-400 - Muted text
    dark: '#09090b',        // gray-950 - Text on light backgrounds
  },
};

// Loop Modes
export const LOOP_MODES = {
  NO_LOOP: 0,
  LOOP_ONE: 1,
  LOOP_ALL: 2,
};

// Toast Messages
export const TOAST_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT: 'Logged out!',
  REGISTER_SUCCESS: 'Registration successful!',
  LIKE_ADDED: 'Added to Liked Songs',
  LIKE_REMOVED: 'Removed from Liked Songs',
  LIKE_FAILED: 'Failed to update like',
  PLAYLIST_CREATED: 'Playlist created successfully!',
  PLAYLIST_DELETED: 'Playlist deleted successfully!',
  SONG_ADDED: 'Song added to playlist!',
  SONG_REMOVED: 'Song removed from playlist!',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ONBOARDING: '/onboarding',
  FORBIDDEN: '/forbidden',
  PROFILE: '/profile',
  PLAYLISTS: '/playlists',
  PLAYLIST_DETAILS: '/playlist/:playlistId',
  PUBLIC_PLAYLIST: '/public/playlist/:id',
  ADMIN: '/admin',
  DASHBOARD: '/dashboard',
  DASHBOARD_ADD_SONG: '/dashboard/add-song',
  DASHBOARD_SONGS: '/dashboard/songs',
  DASHBOARD_STATISTICS: '/dashboard/statistics',
  DASHBOARD_MANAGE_USERS: '/dashboard/manage-users',
};

