// src/services/api.js
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants';

// Create axios instance with base configuration
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always include credentials for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login');
      // You can dispatch a logout action here if needed
    }
    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // User APIs
  users: {
    create: (userData) => API.post(API_ENDPOINTS.USERS, userData),
    getById: (uid) => API.get(`${API_ENDPOINTS.USERS}/${uid}`),
    update: (uid, userData) => API.put(`${API_ENDPOINTS.USERS}/${uid}`, userData),
    delete: (uid) => API.delete(`${API_ENDPOINTS.USERS}/${uid}`),
  },

  // Auth APIs
  auth: {
    login: (idToken) => API.post(API_ENDPOINTS.AUTH_LOGIN, { idToken }),
    logout: () => API.post('/api/auth/logout'),
  },

  // Playlist APIs
  playlists: {
    getAll: () => API.get(API_ENDPOINTS.PLAYLISTS),
    getById: (id) => API.get(`${API_ENDPOINTS.PLAYLISTS}/${id}`),
    getByUser: (userId) => API.get(`${API_ENDPOINTS.PLAYLISTS}/user/${userId}`),
    create: (playlistData) => API.post(API_ENDPOINTS.PLAYLISTS, playlistData),
    update: (id, playlistData) => API.put(`${API_ENDPOINTS.PLAYLISTS}/${id}`, playlistData),
    delete: (id) => API.delete(`${API_ENDPOINTS.PLAYLISTS}/${id}`),
    addSong: (id, songId) => API.put(`${API_ENDPOINTS.PLAYLISTS}/${id}/add`, { songId }),
    removeSong: (id, songId) => API.put(`${API_ENDPOINTS.PLAYLISTS}/${id}/remove`, { songId }),
  },

  // Song APIs
  songs: {
    getAll: () => API.get(API_ENDPOINTS.SONGS),
    getById: (id) => API.get(`${API_ENDPOINTS.SONGS}/${id}`),
    create: (songData) => API.post(API_ENDPOINTS.SONGS, songData),
    update: (id, songData) => API.put(`${API_ENDPOINTS.SONGS}/${id}`, songData),
    delete: (id) => API.delete(`${API_ENDPOINTS.SONGS}/${id}`),
    search: (query) => API.get(`${API_ENDPOINTS.SONGS}/search?q=${query}`),
  },
};

export default API;
