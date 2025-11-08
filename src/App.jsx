// src/App.jsx
import { Routes, Route } from "react-router-dom";
import React, { useState, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { THEMES, USER_ROLES } from "./constants";
import { Loading, InstallPWA } from "./components/common";

// Lazy load pages/components for better performance
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register"));
const HomeLayout = lazy(() => import("./pages/HomeLayout"));
const HomeDefault = lazy(() => import("./pages/HomeDefault"));
const PlaylistDetails = lazy(() => import("./pages/PlaylistDetails").then(m => ({ default: m.PlaylistDetails })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(m => ({ default: m.AdminPanel })));
const MyPlaylists = lazy(() => import("./pages/MyPlaylists"));
const PublicPlaylist = lazy(() => import("./pages/PublicPlaylist"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const Confetti = lazy(() => import("react-confetti"));

// Section pages (nested)
const TrendingSongsNested = lazy(() => import("./pages/sections/TrendingSongsNested"));
const NewReleasesNested = lazy(() => import("./pages/sections/NewReleasesNested"));
const ForYouNested = lazy(() => import("./pages/sections/ForYouNested"));

// Section pages (standalone)
const TrendingSongs = lazy(() => import("./pages/sections/TrendingSongs"));
const NewReleases = lazy(() => import("./pages/sections/NewReleases"));
const ForYou = lazy(() => import("./pages/sections/ForYou"));
const RecentlyPlayed = lazy(() => import("./pages/sections/RecentlyPlayed"));
const TrendingPlaylists = lazy(() => import("./pages/sections/TrendingPlaylists"));

// Lazy load layout and routes
const DashboardLayout = lazy(() => import("./components/layout").then(m => ({ default: m.DashboardLayout })));
const PrivateRoute = lazy(() => import("./Routes/PrivateRoute"));
const RoleRoute = lazy(() => import("./Routes/RoleRoute"));

// Lazy load admin pages
const AddSong = lazy(() => import("./pages/admin/AddSong"));
const AllSongs = lazy(() => import("./pages/admin/AllSongs"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const Statistics = lazy(() => import("./pages/admin/Statistics"));

function App() {
  const [theme, setTheme] = useState(THEMES.DARK);
  const [showConfetti, setShowConfetti] = useState(false);

  // Listen for toast and show confetti on success
  const handleToast = (type) => {
    if (type === "success") {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1200);
    }
  };

  // Add a theme class to body
  React.useEffect(() => {
    document.body.className =
      theme === THEMES.LIGHT ? "bg-white text-gray-900" : "bg-gray-900 text-white";
  }, [theme]);

  const isLightTheme = theme === THEMES.LIGHT;

  return (
    <>
      {showConfetti && (
        <Suspense fallback={null}>
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 0}
            height={typeof window !== "undefined" ? window.innerHeight : 0}
            recycle={false}
            numberOfPieces={220}
          />
        </Suspense>
      )}
      <InstallPWA />
      <main className="min-h-[calc(100vh-12.5vh)]">
        <Suspense fallback={<Loading message="Loading page..." />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/forbidden" element={<Forbidden />} />
            {/* Public homepage with nested routes - accessible without login */}
            <Route path="/" element={<HomeLayout />}>
              <Route index element={<HomeDefault />} />
              <Route path="trending" element={<TrendingSongsNested />} />
              <Route path="new-releases" element={<NewReleasesNested />} />
              <Route path="for-you" element={<ForYouNested />} />
            </Route>
            {/* Public playlist - accessible without login */}
            <Route
              path="/public/playlist/:id"
              element={<PublicPlaylist />}
            />
            {/* Section pages - accessible without login */}
            <Route path="/trending" element={<TrendingSongs />} />
            <Route path="/new-releases" element={<NewReleases />} />
            <Route path="/for-you" element={<ForYou />} />
            <Route path="/recently-played" element={<RecentlyPlayed />} />
            <Route path="/trending-playlists" element={<TrendingPlaylists />} />
          {/* All other routes require authentication */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <Routes>
                  <Route
                    path="/playlist/:playlistId"
                    element={<PlaylistDetails />}
                  />
                  <Route path="/profile" element={<MyProfile />} /> {/* 🆕 */}
                  <Route
                    path="/admin"
                    element={
                      <RoleRoute allowed={[USER_ROLES.ADMIN]}>
                        <AdminPanel />
                      </RoleRoute>
                    }
                  />
                  {/* Dashboard: only staff and admin */}
                  <Route
                    path="/dashboard"
                    element={
                      <RoleRoute allowed={[USER_ROLES.ADMIN, USER_ROLES.STAFF]}>
                        <DashboardLayout />
                      </RoleRoute>
                    }
                  >
                    <Route index element={<Statistics />} />{" "}
                    {/* Show statistics by default on dashboard */}
                    <Route path="add-song" element={<AddSong />} />
                    <Route path="songs" element={<AllSongs />} />
                    <Route path="statistics" element={<Statistics />} />
                    {/* Manage Users: only admin */}
                    <Route
                      path="manage-users"
                      element={
                        <RoleRoute allowed={[USER_ROLES.ADMIN]} redirect="/dashboard">
                          <ManageUsers />
                        </RoleRoute>
                      }
                    />
                  </Route>
                  <Route path="/playlists" element={<MyPlaylists />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PrivateRoute>
            }
          />
          </Routes>
        </Suspense>
      </main>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={18}
        toastOptions={{
          duration: 3200,
          className: "spotify-toast",
   
          style: {
            background: isLightTheme ? "rgba(255,255,255,0.98)" : "rgba(18,18,18,0.96)",
            color: isLightTheme ? "#0f0f0f" : "#f9fafb",
            borderRadius: "14px",
            padding: "0.85rem 1.1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            border: isLightTheme
              ? "1px solid rgba(17,25,40,0.08)"
              : "1px solid rgba(255,255,255,0.05)",
            boxShadow: isLightTheme
              ? "0 20px 40px rgba(15,23,42,0.15)"
              : "0 24px 48px rgba(0,0,0,0.45)",
            backdropFilter: "blur(18px)",
            fontWeight: 600,
            letterSpacing: "0.01em",
            fontSize: "0.95rem",
            minWidth: "260px",
            '--toast-progress-background': '#1DB954',
          },
          success: {
            style: {
              borderLeft: "4px solid #1DB954",
              boxShadow: isLightTheme
                ? "0 18px 42px rgba(29,185,84,0.18)"
                : "0 22px 40px rgba(17, 17, 17, 0.65)",
            },
          },
          error: {
            
          
            style: {
              borderLeft: "4px solid #E91444",
            },
          },
          loading: {
            
            style: {
              borderLeft: "4px solid #1ED760",
            },
          },
        }}
        containerStyle={{
          marginTop: "1.5rem",
          marginRight: "1.5rem",
          zIndex: 9999,
        }}
        toast={(t) => {
          if (t.type === "success") handleToast("success");
        }}
      />
    </>
  );
}

export default App;
