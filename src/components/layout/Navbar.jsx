// src/components/layout/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { avatarFromEmail } from "../../utils/avatarFromEmail";
import {
  ListMusic,
  Home,
  LayoutDashboard,
  User,
  LogOut,
  Music2,
  Download,
  CheckCircle2,
  Share2,
  MessageCircle,
} from "lucide-react";
import React, { useState, useRef, useEffect, Suspense } from "react";
import logoPng from "../../assets/healers.png";
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
      'Would you like to install the Healers app on your device?\n\nOnce installed you can:\n• Listen offline\n• Launch directly from your home screen\n• Enjoy faster loading'
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
        toast.success('App installed successfully.');
        setIsInstalled(true);
      } else {
        toast('Installation cancelled.');
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
      text: 'Check out Healers - your personal music streaming platform for healing through music. Listen to unlimited songs, create playlists, and discover new music.',
      url: window.location.origin,
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Thanks for sharing!');
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        // Fallback: Copy to clipboard
        try {
          await navigator.clipboard.writeText(window.location.origin);
          toast.success('Link copied to clipboard!');
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
          <div className="relative transition-transform duration-150 ease-out group-hover:scale-105 active:scale-95">
            <picture>
              <source srcSet={logoPng} type="image/png" />
              <img
                src={logoPng}
                alt="Healers"
                className="w-10 h-10 object-cover rounded-full relative z-10 bg-[#1a1a1a]"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={40}
                height={40}
              />
            </picture>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xl font-bold text-white tracking-wide">
              Healers
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Music2 className="w-3.5 h-3.5" strokeWidth={2.4} /> Feel the rhythm
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
            <NavLink
              to="/about"
              label="About"
              active={location.pathname.startsWith("/about")}
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
            {user && (
              <NavLink
                to="/feedback"
                label="Feedback"
                active={location.pathname === "/feedback"}
              />
            )}
          </div>

          {/* Share Button for non-logged users */}
          {!user && (
            <button
              onClick={handleShareClick}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
              aria-label="Share app"
            >
              <Share2 className="w-4 h-4" strokeWidth={2.4} />
              <span>Share</span>
            </button>
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
              <button
                onClick={() => setDropdown((v) => !v)}
                className="focus:outline-none relative group transition-transform duration-150 ease-out hover:scale-105 active:scale-95"
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
              </button>
              {dropdown && (
                  <div
                    className="absolute right-0 mt-3 w-64 bg-[#282828] rounded-lg shadow-2xl z-[9999] py-2 overflow-hidden animate-dropdown"
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
                        <User className="w-4 h-4" strokeWidth={2.2} />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/playlists"
                        className="flex items-center gap-3 px-4 py-2.5 text-white hover:bg-white/10 transition-colors font-medium"
                        onClick={() => setDropdown(false)}
                      >
                        <ListMusic className="w-4 h-4" strokeWidth={2.2} />
                        <span>My Playlists</span>
                      </Link>
                      <Link
                        to="/feedback"
                        className="flex items-center gap-3 px-4 py-2.5 text-white hover:bg-white/10 transition-colors font-medium"
                        onClick={() => setDropdown(false)}
                      >
                        <MessageCircle className="w-4 h-4" strokeWidth={2.2} />
                        <span>Feedback</span>
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
                          <Download className="w-4 h-4" strokeWidth={2.2} />
                          <span>Install App</span>
                        </button>
                      )}
                      
                      {/* Show installed status if app is installed */}
                      {isInstalled && (
                        <div className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-gray-400 cursor-default">
                          <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
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
                        <Share2 className="w-4 h-4" strokeWidth={2.2} />
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
                        <LogOut className="w-4 h-4" strokeWidth={2.2} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="transition-transform duration-150 ease-out hover:scale-105 active:scale-95">
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-full bg-white text-black font-bold transition-all hover:scale-105"
              >
                Login
              </Link>
            </div>
          )}

          {/* Mobile hamburger: visible on small and sm screens (hidden from md upwards) - Spotify Style */}
          <button
            ref={hamburgerRef}
            className="md:hidden p-2 ml-2 rounded-full text-gray-400 hover:text-white transition-all duration-150 ease-out focus:outline-none hover:scale-105 active:scale-95"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <svg
                key="close"
                className="w-6 h-6 text-white transition-transform duration-150 ease-out rotate-0"
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
              </svg>
            ) : (
              <svg
                key="menu"
                className="w-6 h-6 text-white transition-transform duration-150 ease-out rotate-0"
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
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel (only on small and small-medium screens) */}
      {mobileOpen && (
          <div
            ref={mobileRef}
            className="md:hidden absolute left-0 right-0 top-full bg-[#181818] border-t border-gray-800 z-[9997] overflow-hidden shadow-2xl animate-dropdown"
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
                <Home className="w-5 h-5" strokeWidth={2.2} />
                <span className="text-base">Home</span>
              </Link>

              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
                  location.pathname.startsWith("/about")
                    ? "bg-white/10"
                    : "hover:bg-white/10"
                }`}
              >
                <User className="w-5 h-5" strokeWidth={2.2} />
                <span className="text-base">About</span>
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
                    <LayoutDashboard className="w-5 h-5" strokeWidth={2.2} />
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
                  <ListMusic className="w-5 h-5" strokeWidth={2.2} />
                  <span className="text-base">My Playlists</span>
                </Link>
              )}

              {user && (
                <Link
                  to="/feedback"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-white font-medium ${
                    location.pathname === "/feedback"
                      ? "bg-white/10"
                      : "hover:bg-white/10"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" strokeWidth={2.2} />
                  <span className="text-base">Feedback</span>
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
                    <Share2 className="w-4 h-4" strokeWidth={2.2} />
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
                    <User className="w-5 h-5" strokeWidth={2.2} />
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
                      <Download className="w-5 h-5" strokeWidth={2.2} />
                      <span className="text-base">Install App</span>
                    </button>
                  )}
                  
                  {/* Show installed status if app is installed */}
                  {isInstalled && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 cursor-default font-medium w-full text-left">
                      <CheckCircle2 className="w-5 h-5" strokeWidth={2.2} />
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
                    <Share2 className="w-5 h-5" strokeWidth={2.2} />
                    <span className="text-base">Share App</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white font-medium w-full text-left"
                  >
                    <LogOut className="w-5 h-5" strokeWidth={2.2} />
                    <span className="text-base">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
