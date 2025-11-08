// src/components/layout/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { avatarFromEmail } from "../../utils/avatarFromEmail";
import {
  FaListUl,
  FaHome,
  FaTachometerAlt,
  FaUser,
  FaSignOutAlt,
  FaMusic,
  FaDownload,
  FaCheckCircle,
  FaShareAlt,
} from "react-icons/fa";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useRef, useEffect, Suspense } from "react";
import logo from "../../assets/healers.png";
import { USER_ROLES, THEMES } from "../../constants";
import toast from "react-hot-toast";

const NotificationCenter = React.lazy(() => import("../features/notifications/NotificationCenter"));

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdown, setDropdown] = useState(false);
  const avatarRef = useRef();

  // New: mobile menu state and ref for outside clicks
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileRef = useRef();

  // New: ref for the hamburger button so outside-click handler won't close menu when clicking the button
  const hamburgerRef = useRef();

  // Theme state lifted up via window (for global access)
  const [theme, setTheme] = useState(() => window.__theme || THEMES.DARK);
  useEffect(() => {
    window.__theme = theme;
    document.body.className =
      theme === THEMES.LIGHT ? "bg-white text-white" : "bg-gray-900 text-white";
  }, [theme]);

  // PWA Install prompt state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle install click with confirmation
  const handleInstallClick = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'আপনি কি Healers App টি আপনার ডিভাইসে ইনস্টল করতে চান?\n\nইনস্টল করলে আপনি:\n• অফলাইন ব্যবহার করতে পারবেন\n• হোম স্ক্রিন থেকে সরাসরি অ্যাক্সেস করতে পারবেন\n• দ্রুত লোডিং পাবেন'
    );

    if (!confirmed) {
      return;
    }

    if (!deferredPrompt) {
      // If no deferred prompt, try to show browser's install prompt
      toast.error('App installation is not available. Please use your browser\'s menu to install.');
      return;
    }

    try {
      // Show install prompt
      deferredPrompt.prompt();
      
      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('🎉 App installed successfully!');
        setIsInstalled(true);
      } else {
        toast('Installation cancelled', { icon: '' });
      }
      
      // Clear the prompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Failed to install app. Please try again.');
    }
  };

  // Handle share click
  const handleShareClick = async () => {
    const shareData = {
      title: 'Healers - Music Streaming',
      text: '🎵 Check out Healers - Your personal music streaming platform for healing through music! Listen to unlimited songs, create playlists, and discover new music. 🎧✨',
      url: window.location.origin,
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Thanks for sharing! 🎉');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Link copied to clipboard! 📋');
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.origin);
          toast.success('Link copied to clipboard! 📋');
        } catch {
          toast.error('Failed to share');
        }
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      // Close profile dropdown if clicked outside avatarRef
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setDropdown(false);
      }
      // Close mobile menu if clicking outside BOTH the mobile panel and the hamburger button
      if (
        mobileOpen &&
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        // allow clicks on hamburger button without immediately closing the menu
        !(hamburgerRef.current && hamburgerRef.current.contains(e.target))
      ) {
        setMobileOpen(false);
      }
    }
    if (dropdown || mobileOpen)
      document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdown, mobileOpen]);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  return (
    <nav
      className="w-full relative bg-[#121212] border-b border-gray-800 z-[9998]"
      role="navigation"
      aria-label="Main navigation"
      style={{ position: "sticky", top: 0, zIndex: 9998 }}
    >

      {/* wrapper to center content and control responsive paddings */}
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative"
          >
            <img
              src={logo}
              alt="Healers"
              className="w-10 h-10 object-cover rounded-full relative z-10"
              loading="eager"
              width={40}
              height={40}
            />
          </motion.div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xl font-bold text-white tracking-wide">
              Healers
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FaMusic className="text-[10px]" /> Feel the rhythm
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {/* Desktop / tablet inline links: show from md and up */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              label="Home"
              active={location.pathname === "/"}
            />
            {user &&
              (user.type === USER_ROLES.ADMIN ||
                user.type === USER_ROLES.STAFF) && (
                <NavLink
                  to="/dashboard"
                  label="Dashboard"
                  active={location.pathname.startsWith("/dashboard")}
                />
              )}
            {user && (
              <NavLink
                to="/playlists"
                label="Playlists"
                active={location.pathname === "/playlists"}
              />
            )}
          </div>

          {/* Share Button for non-logged users */}
          {!user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareClick}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm transition-all hover:scale-105"
              aria-label="Share app"
            >
              <FaShareAlt />
              <span>Share</span>
            </motion.button>
          )}

          {/* Notification Center */}
          {user && (
            <Suspense fallback={null}>
              <NotificationCenter />
            </Suspense>
          )}

          {/* User avatar / Login (always visible) - Spotify Style */}
          {user ? (
            <div className="relative" ref={avatarRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDropdown((v) => !v)}
                className="focus:outline-none relative group"
                aria-label="User menu"
              >
                <img
                  src={user.image || avatarFromEmail(user.email)}
                  alt="avatar"
                  className="w-8 h-8 rounded-full relative z-10 object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.target.src = avatarFromEmail(user.email);
                  }}
                />
              </motion.button>
              <AnimatePresence>
                {dropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-[#282828] rounded-lg shadow-2xl z-[9999] py-2 overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    {/* User profile section with image - Spotify Style */}
                    <div className="px-4 py-4 border-b border-gray-700 flex items-center gap-3">
                      <img
                        src={user.image || avatarFromEmail(user.email)}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = avatarFromEmail(user.email);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-semibold truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {user.type || "User"}
                        </p>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 text-white hover:bg-white/10 transition-colors font-medium"
                        onClick={() => setDropdown(false)}
                      >
                        <FaUser />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/playlists"
                        className="flex items-center gap-3 px-4 py-2.5 text-white hover:bg-white/10 transition-colors font-medium"
                        onClick={() => setDropdown(false)}
                      >
                        <FaListUl />
                        <span>My Playlists</span>
                      </Link>

                      {/* PWA Install Button in Dropdown - Always show if not installed */}
                      {!isInstalled && (
                        <button
                          onClick={() => {
                            handleInstallClick();
                            setDropdown(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-white hover:bg-white/10 transition-colors font-medium"
                        >
                          <FaDownload />
                          <span>Install App</span>
                        </button>
                      )}
                      
                      {/* Show installed status if app is installed */}
                      {isInstalled && (
                        <div className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-400 cursor-default">
                          <FaCheckCircle />
                          <span>App Installed</span>
                        </div>
                      )}

                      {/* Share App Button */}
                      <button
                        onClick={() => {
                          handleShareClick();
                          setDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <FaShareAlt />
                        <span>Share App</span>
                      </button>

                      <div className="my-2 border-t border-gray-700" />

                      <button
                        onClick={() => {
                          logout();
                          setDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-white hover:bg-white/10 transition-colors font-medium"
                      >
                        <FaSignOutAlt />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold transition-all hover:scale-105"
              >
                Login
              </Link>
            </motion.div>
          )}

          {/* Mobile hamburger: visible on small and sm screens (hidden from md upwards) - Spotify Style */}
          <motion.button
            ref={hamburgerRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2 ml-2 rounded-full text-gray-400 hover:text-white transition-colors focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {/* Use SVG icons to reliably show hamburger vs X */}
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.svg
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </motion.svg>
              ) : (
                <motion.svg
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile menu panel (only on small and small-medium screens) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden absolute left-0 right-0 top-full bg-[#181818] border-t border-gray-800 z-[9997] overflow-hidden shadow-2xl"
            style={{ zIndex: 9997 }}
          >
            <div className="px-4 py-5 space-y-1 max-h-[70vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
                  location.pathname === "/"
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                }`}
              >
                <FaHome />
                <span className="text-base">Home</span>
              </Link>

              {user &&
                (user.type === USER_ROLES.ADMIN ||
                  user.type === USER_ROLES.STAFF) && (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
                      location.pathname.startsWith("/dashboard")
                        ? "bg-white/10"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <FaTachometerAlt />
                    <span className="text-base">Dashboard</span>
                  </Link>
                )}

              {user && (
                <Link
                  to="/playlists"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
                    location.pathname === "/playlists"
                      ? "bg-white/10"
                      : "hover:bg-white/10"
                  }`}
                >
                  <FaListUl />
                  <span className="text-base">My Playlists</span>
                </Link>
              )}

              {!user ? (
                <div className="pt-3 space-y-2">
                  {/* Share Button for Non-logged Mobile Users */}
                  <button
                    onClick={() => {
                      handleShareClick();
                      setMobileOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-white text-black font-bold transition-all hover:scale-105"
                  >
                    <FaShareAlt />
                    Share App
                  </button>
                  
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-full bg-white text-black font-bold transition-all hover:scale-105"
                  >
                    Login
                  </Link>
                </div>
              ) : (
                <div className="pt-3 mt-2 border-t border-gray-700 space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white font-medium"
                  >
                    <FaUser />
                    <span className="text-base">Profile</span>
                  </Link>

                  {/* PWA Install Button for Mobile Users - Always show if not installed */}
                  {!isInstalled && (
                    <button
                      onClick={() => {
                        handleInstallClick();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors font-medium w-full text-left"
                    >
                      <FaDownload />
                      <span className="text-base">Install App</span>
                    </button>
                  )}
                  
                  {/* Show installed status if app is installed */}
                  {isInstalled && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 cursor-default font-medium w-full text-left">
                      <FaCheckCircle />
                      <span className="text-base">App Installed</span>
                    </div>
                  )}

                  {/* Share App Button for Mobile */}
                  <button
                    onClick={() => {
                      handleShareClick();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white font-medium w-full text-left"
                  >
                    <FaShareAlt />
                    <span className="text-base">Share App</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white font-medium w-full text-left"
                  >
                    <FaSignOutAlt />
                    <span className="text-base">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// Enhanced NavLink component with active state - Spotify Style
function NavLink({ to, label, active = false }) {
  return (
    <Link
      to={to}
      className="relative inline-flex items-center gap-2 px-3 py-2 group"
    >
      {/* Label - Spotify Style */}
      <span
        className={`hidden md:inline relative font-semibold text-sm transition-colors ${
          active
            ? "text-white"
            : "text-gray-400 group-hover:text-white"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

export default Navbar;
