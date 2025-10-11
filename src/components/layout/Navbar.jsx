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
} from "react-icons/fa";
import { FaSun, FaMoon } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import logo from "../../assets/healers.png";
import { USER_ROLES, THEMES } from "../../constants";

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
      className="w-full relative bg-gradient-to-r from-gray-900 via-purple-900 to-fuchsia-900 backdrop-blur-xl border-b border-purple-500/30 shadow-2xl z-[9998]"
      role="navigation"
      aria-label="Main navigation"
      style={{ position: "sticky", top: 0, zIndex: 9998 }}
    >
      {/* Animated gradient overlay for shine effect */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none"
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      {/* wrapper to center content and control responsive paddings */}
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 relative z-10">
        <Link to="/" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              src={logo}
              alt="Healers"
              className="w-12 h-12 object-cover rounded-full border-2 border-purple-400 shadow-lg relative z-10"
            />
          </motion.div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent tracking-wide">
              Healers
            </span>
            <span className="text-xs text-purple-300 flex items-center gap-1">
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
            <NavLink
              to="/playlists"
              label="Playlists"
              active={location.pathname === "/playlists"}
            />
          </div>

          {/* Theme toggle (always visible) */}
          <button
            className="p-2 rounded-lg cursor-pointer flex items-center justify-center"
            onClick={() =>
              setTheme(theme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)
            }
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === THEMES.DARK ? (
                <motion.span
                  key="sun"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="text-yellow-400 text-xl"
                >
                  <FaSun />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="text-purple-300 text-xl"
                >
                  <FaMoon />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User avatar / Login (always visible) */}
          {user ? (
            <div className="relative" ref={avatarRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDropdown((v) => !v)}
                className="focus:outline-none relative group"
                aria-label="User menu"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                <img
                  src={user.image || avatarFromEmail(user.email)}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border-3 border-fuchsia-400 shadow-2xl relative z-10 ring-2 ring-purple-500/50 group-hover:ring-fuchsia-400 transition-all duration-300 object-cover"
                  onError={(e) => {
                    e.target.src = avatarFromEmail(user.email);
                  }}
                />
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900 z-20 animate-pulse" />
              </motion.button>
              <AnimatePresence>
                {dropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{
                      duration: 0.2,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="absolute right-0 mt-3 w-64 bg-gradient-to-br from-gray-900 via-purple-900 to-fuchsia-900 border-2 border-purple-500/40 rounded-2xl shadow-2xl backdrop-blur-xl z-[9999] py-2 overflow-hidden"
                    style={{ zIndex: 9999 }}
                  >
                    {/* Glassmorphism overlay */}
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

                    {/* User profile section with image */}
                    <div className="relative px-4 py-4 border-b border-purple-500/30 flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-500 rounded-full blur-sm opacity-60" />
                        <img
                          src={user.image || avatarFromEmail(user.email)}
                          alt="Profile"
                          className="w-14 h-14 rounded-full border-3 border-purple-400 shadow-lg relative z-10 object-cover"
                          onError={(e) => {
                            e.target.src = avatarFromEmail(user.email);
                          }}
                        />
                        {/* Online indicator */}
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900 z-20" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-purple-200 mb-0.5">
                          Signed in as
                        </p>
                        <p className="text-sm text-white font-bold truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-purple-300 capitalize">
                          {user.type || "User"}
                        </p>
                      </div>
                    </div>

                    <div className="relative py-2">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg hover:bg-purple-600/40 text-white transition-all duration-200 font-semibold group"
                        onClick={() => setDropdown(false)}
                      >
                        <FaUser className="group-hover:scale-110 transition-transform" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/playlists"
                        className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg hover:bg-purple-600/40 text-white transition-all duration-200 font-semibold group"
                        onClick={() => setDropdown(false)}
                      >
                        <FaListUl className="group-hover:scale-110 transition-transform" />
                        <span>My Playlists</span>
                      </Link>

                      <div className="my-2 mx-4 border-t border-purple-500/30" />

                      <button
                        onClick={() => {
                          logout();
                          setDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 mx-2 w-[calc(100%-1rem)] text-left rounded-lg hover:bg-red-900/40 text-red-300 hover:text-red-200 transition-all duration-200 font-semibold group"
                      >
                        <FaSignOutAlt className="group-hover:scale-110 group-hover:translate-x-1 transition-transform" />
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-lg hover:shadow-fuchsia-500/50 transition-all duration-300 border-2 border-purple-400/50"
              >
                Login
              </Link>
            </motion.div>
          )}

          {/* Mobile hamburger: visible on small and sm screens (hidden from md upwards) */}
          <motion.button
            ref={hamburgerRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden p-2.5 ml-2 rounded-xl bg-gradient-to-br from-purple-700 to-fuchsia-700 hover:from-purple-600 hover:to-fuchsia-600 border-2 border-purple-400/50 shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden absolute left-0 right-0 top-full bg-gradient-to-b from-gray-900/98 via-purple-900/98 to-fuchsia-900/98 backdrop-blur-2xl border-t border-purple-500/30 z-[9997] overflow-hidden shadow-2xl"
            style={{ zIndex: 9997 }}
          >
            <div className="px-4 py-5 space-y-1.5 max-h-[70vh] overflow-y-auto">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.05 }}
              >
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white font-semibold group ${
                    location.pathname === "/"
                      ? "bg-gradient-to-r from-purple-700 to-fuchsia-700 shadow-lg"
                      : "hover:bg-white/10"
                  }`}
                >
                  <FaHome className="group-hover:scale-110 transition-transform" />
                  <span className="text-base">Home</span>
                </Link>
              </motion.div>

              {user &&
                (user.type === USER_ROLES.ADMIN ||
                  user.type === USER_ROLES.STAFF) && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white font-semibold group ${
                        location.pathname.startsWith("/dashboard")
                          ? "bg-gradient-to-r from-purple-700 to-fuchsia-700 shadow-lg"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <FaTachometerAlt className="group-hover:scale-110 transition-transform" />
                      <span className="text-base">Dashboard</span>
                    </Link>
                  </motion.div>
                )}

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Link
                  to="/playlists"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white font-semibold group ${
                    location.pathname === "/playlists"
                      ? "bg-gradient-to-r from-purple-700 to-fuchsia-700 shadow-lg"
                      : "hover:bg-white/10"
                  }`}
                >
                  <FaListUl className="group-hover:scale-110 transition-transform" />
                  <span className="text-base">My Playlists</span>
                </Link>
              </motion.div>

              {!user ? (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="pt-3"
                >
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold shadow-lg hover:shadow-fuchsia-500/50 transition-all duration-300 border-2 border-purple-400/50"
                  >
                    Login
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="pt-3 mt-2 border-t border-purple-500/30 space-y-1.5"
                >
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-600/40 transition-all duration-200 text-white font-semibold group"
                  >
                    <FaUser className="group-hover:scale-110 transition-transform" />
                    <span className="text-base">Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/40 transition-all duration-200 text-red-300 hover:text-red-200 font-semibold w-full text-left group"
                  >
                    <FaSignOutAlt className="group-hover:scale-110 group-hover:translate-x-1 transition-transform" />
                    <span className="text-base">Logout</span>
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// Enhanced NavLink component with active state
function NavLink({ to, label, active = false }) {
  return (
    <Link
      to={to}
      className="relative inline-flex items-center gap-2 px-3 py-2 group"
    >
      {/* Label with underline effect */}
      <span
        className={`hidden md:inline relative font-semibold text-base transition-all duration-300 ${
          active
            ? "text-white"
            : "text-purple-200 group-hover:text-white"
        }`}
      >
        {label}
        
        {/* Animated underline */}
        <span
          className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 transition-all duration-300 ${
            active
              ? "w-full"
              : "w-0 group-hover:w-full"
          }`}
        />
        
        {/* Glow effect on active */}
        {active && (
          <motion.span
            layoutId="activeNavLink"
            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-fuchsia-400 to-purple-400 blur-sm"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </span>
    </Link>
  );
}

export default Navbar;
