# 🎵 Healers - Music Streaming Application

A modern, feature-rich music streaming web application built with React, Firebase, and Tailwind CSS. Healers provides a seamless music listening experience with playlist management, user authentication, and an intuitive audio player.

![Healers](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-19.1.0-61dafb)
![Firebase](https://img.shields.io/badge/Firebase-11.10.0-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Feature Highlights

| Category | Capabilities |
| --- | --- |
| 🎧 Immersive Listening | Rich Web Audio player with queue control, shuffle & loop modes, volume slider, scrubbable progress bar, and mobile-first gestures. |
| 💿 Music Discovery | Trending charts, genre-based mixes, “Made for You” recommendations, and recently played history tailored to each listener. |
| 📚 Powerful Playlists | Create, edit, and share playlists; auto-manage “Liked Songs”; invite friends; toggle public/private access; instant socket updates. |
| 🤝 Community Voices | Users can submit reviews with ratings; admins receive actionable notifications with Approve/Decline workflow before feedback appears publicly. |
| 🔔 Real-time Notifications | Socket-driven alert center for playlist invites, review moderation, and system messages with quick actions and read receipts. |
| 👥 Account & Roles | Firebase auth, Google OAuth, profile personalization, role-based gates for Admin, Staff, and Users, plus onboarding warmups. |
| 🛡️ Admin Toolkit | Dashboard analytics, user management, CRUD for songs & playlists, media uploads with ImageKit, and instant broadcast events. |
| 📱 PWA & Branding | Installable app with offline-ready shell, maskable icons using `healers.png`, optimized favicons, and Spotify-inspired dark theming. |
| 🎨 Delightful UI | Responsive Tailwind layout, Framer Motion animations, confetti celebrations, theming toggle, and accessible toast feedback. |

## 🚀 Tech Stack

### Frontend
- **React 19.1.0** - UI framework
- **React Router DOM 7.6.3** - Routing
- **Tailwind CSS 4.1.11** - Styling
- **DaisyUI 5.0.43** - UI components
- **Framer Motion 12.23.0** - Animations

### Backend & Services
- **Firebase 11.10.0** - Authentication & hosting
- **Axios 1.10.0** - HTTP client
- **ImageKit.io** - Image hosting

### Development Tools
- **Vite 7.0.0** - Build tool
- **ESLint 9.29.0** - Linting
- **SWC** - Fast compilation

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Backend API server (see Backend Setup)

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/healers-app.git
cd healers-app
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
```

### Step 4: Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Backend Setup

Healers requires a backend API server. The backend should provide the following endpoints:

### Required API Endpoints

#### Authentication
- `POST /api/auth/login` - User login with Firebase token
- `POST /api/auth/logout` - User logout

#### Users
- `GET /api/users/:uid` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:uid` - Update user
- `DELETE /api/users/:uid` - Delete user

#### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get song by ID
- `POST /api/songs` - Create new song (Admin only)
- `PUT /api/songs/:id` - Update song (Admin only)
- `DELETE /api/songs/:id` - Delete song (Admin only)
- `GET /api/songs/search?q=query` - Search songs

#### Playlists
- `GET /api/playlists` - Get all public playlists
- `GET /api/playlists/:id` - Get playlist by ID
- `GET /api/playlists/user/:userId` - Get user's playlists
- `POST /api/playlists` - Create new playlist
- `PUT /api/playlists/:id` - Update playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `PUT /api/playlists/:id/add` - Add song to playlist
- `PUT /api/playlists/:id/remove` - Remove song from playlist

## 📁 Project Structure

```
healers-app/
├── src/
│   ├── assets/           # Static assets (images, audio)
│   ├── components/       # Reusable components
│   │   ├── AudioPlayer.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── Modal.jsx
│   │   ├── Navbar.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SongCard.jsx
│   │   └── ...
│   ├── context/          # React Context providers
│   │   ├── AudioContext.jsx
│   │   └── AuthContext.jsx
│   ├── hooks/            # Custom React hooks
│   │   └── useAxios.js
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout/
│   │   └── MainLayout.jsx
│   ├── pages/            # Page components
│   │   ├── admin/        # Admin pages
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ...
│   ├── Routes/           # Route guards
│   │   ├── PrivateRoute.jsx
│   │   └── RoleRoute.jsx
│   ├── utils/            # Utility functions
│   │   ├── api.js        # API service
│   │   ├── constants.js  # App constants
│   │   ├── avatarFromEmail.js
│   │   └── upload.js
│   ├── App.jsx           # Main App component
│   ├── main.jsx          # Entry point
│   ├── firebase.js       # Firebase configuration
│   └── index.css         # Global styles
├── public/               # Public assets
├── .env                  # Environment variables (create this)
├── .gitignore
├── package.json
├── vite.config.js
├── eslint.config.js
├── tailwind.config.js
└── README.md
```

## 🎯 Usage

### For Users
1. **Sign up/Login**: Create an account or login with Google
2. **Browse songs**: Explore the music library
3. **Play music**: Click on any song to start playing
4. **Create playlists**: Organize your favorite songs
5. **Like songs**: Build your "Liked Songs" collection
6. **Share playlists**: Share your playlists with others

### For Admins
1. **Access dashboard**: Navigate to `/dashboard`
2. **Add songs**: Upload new songs with cover images
3. **Manage users**: View and manage user accounts
4. **View statistics**: Check app usage statistics

## 🔒 User Roles

- **User**: Basic access to browse and play music
- **Staff**: Can access dashboard and manage songs
- **Admin**: Full access including user management

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🌐 Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Build the project:
```bash
npm run build
```

4. Deploy:
```bash
firebase deploy
```

### Other Platforms
- **Vercel**: Connect your GitHub repo and deploy
- **Netlify**: Drag and drop the `dist` folder
- **AWS S3**: Upload the `dist` folder to S3 bucket

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 🐛 Known Issues

- Console error on unauthorized access is intended for error tracking
- Theme persistence across page reloads needs localStorage integration

## 📝 Environment Variables

Create a `.env` file with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_API_BASE_URL` | Backend API base URL | Yes |

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- React team for the amazing framework
- Firebase for authentication and hosting
- Tailwind CSS for the utility-first CSS framework
- All open-source contributors

## 📧 Contact

For any questions or suggestions, please reach out:
- Email: your.email@example.com
- GitHub: [@yourusername](https://github.com/yourusername)

---

Made with ❤️ by Healers Team
# Healers
