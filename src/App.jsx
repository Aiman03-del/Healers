// src/App.jsx
import { Routes, Route } from "react-router-dom";
import React, { useState, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";
import { THEMES, USER_ROLES } from "./constants";
import { Loading } from "./components/common";

// Lazy load pages for better performance
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const PlaylistDetails = lazy(() => import("./pages/PlaylistDetails").then(m => ({ default: m.PlaylistDetails })));
const AdminPanel = lazy(() => import("./pages/AdminPanel").then(m => ({ default: m.AdminPanel })));
const MyPlaylists = lazy(() => import("./pages/MyPlaylists"));
const PublicPlaylist = lazy(() => import("./pages/PublicPlaylist"));
const MyProfile = lazy(() => import("./pages/MyProfile"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));

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

  return (
    <>
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}
      <main className="min-h-[calc(100vh-12.5vh)]">
        <Suspense fallback={<Loading message="Loading page..." />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/forbidden" element={<Forbidden />} />
          {/* All other routes require authentication */}
          <Route
            path="*"
            element={
              <PrivateRoute>
                <Routes>
                  <Route path="/" element={<Home />} />
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
                    {/* ড্যাশবোর্ডে গেলে স্টাটিস্টিক্স দেখাবে */}
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
                  <Route
                    path="/public/playlist/:id"
                    element={<PublicPlaylist />}
                  />
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
        toastOptions={{
          duration: 3500,
          style: {
            background:
              theme === THEMES.LIGHT
                ? "linear-gradient(90deg, #ede9fe 0%, #fce7f3 100%)"
                : "linear-gradient(90deg, #7c3aed 0%, #a21caf 100%)",
            color: theme === THEMES.LIGHT ? "#333" : "#fff",
            border: "none",
            boxShadow: "0 4px 24px 0 rgba(124,58,237,0.15)",
            fontWeight: 500,
            fontSize: "1rem",
            borderRadius: "0.75rem",
            padding: "1rem 1.5rem",
            letterSpacing: "0.01em",
          },
          success: {
            icon: "✓",
            style: {
              background:
                theme === THEMES.LIGHT
                  ? "linear-gradient(90deg, #bbf7d0 0%, #bae6fd 100%)"
                  : "linear-gradient(90deg, #16a34a 0%, #22d3ee 100%)",
              color: theme === THEMES.LIGHT ? "#222" : "#fff",
            },
          },
          error: {
            icon: "✗",
            style: {
              background:
                theme === THEMES.LIGHT
                  ? "linear-gradient(90deg, #fee2e2 0%, #fef3c7 100%)"
                  : "linear-gradient(90deg, #dc2626 0%, #f59e42 100%)",
              color: theme === THEMES.LIGHT ? "#222" : "#fff",
            },
          },
        }}
        gutter={16}
        containerStyle={{
          marginTop: "1.5rem",
          zIndex: 9999,
        }}
        // Confetti on success toast
        toast={(t) => {
          if (t.type === "success") handleToast("success");
        }}
      />
    </>
  );
}

export default App;
