// src/components/layout/DashboardLayout/DashboardLayout.jsx
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from "react";
import {  FaBars, FaTimes } from "react-icons/fa";
import { DashboardSidebar } from '../';
import useAxios from '../../../hooks/useAxios';

const DashboardLayout = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const { get } = useAxios();

  // Sidebar open/close state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Analytics state
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    topSongs: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [songsRes, usersRes, topSongsRes] = await Promise.all([
          get('/api/songs'),
          get('/api/users'),
          get('/api/songs?sort=playCount&limit=5'),
        ]);
        setStats({
          totalSongs: songsRes.data.songs?.length || 0,
          totalUsers: usersRes.data.users?.length || 0,
          topSongs: (topSongsRes.data.songs || []).slice(0, 5),
        });
      } catch {
        setStats({ totalSongs: 0, totalUsers: 0, topSongs: [] });
      }
    };
    fetchStats();
  }, [get]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#121212] text-white">
      {/* Sidebar for desktop - Spotify Style */}
      <aside
        className="sticky top-0 h-[60px] md:h-screen w-full md:w-64 bg-[#000000] p-0 shadow-2xl border-b md:border-b-0 md:border-r border-gray-800 flex md:flex-col z-30"
      >
        <div className="hidden md:block w-full h-full">
          <DashboardSidebar onLogout={logout} />
        </div>
        {/* Mobile sidebar toggle area (empty for desktop) */}
        <div className="md:hidden w-full h-full"></div>
      </aside>
      {/* Sidebar for mobile (slide-in) - Spotify Style */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${sidebarOpen ? "block" : "pointer-events-none"}`}
        {...(!sidebarOpen ? { inert: true } : {})}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/60 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar panel - Spotify Style */}
        <aside
          className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-[#000000] shadow-2xl border-r border-gray-800 flex flex-col z-50 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close button - Spotify Style */}
          <button
            className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
          <DashboardSidebar onLogout={logout} />
        </aside>
      </div>
      {/* Toggle button (hamburger) - Spotify Style */}
      <button
        className="fixed top-4 left-4 z-50 bg-[#181818] text-white p-2 rounded-full shadow-lg hover:bg-[#282828] transition md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        style={{ display: sidebarOpen ? "none" : "block" }}
      >
        <FaBars />
      </button>
      {/* Main - Spotify Style */}
      <main className="flex-1 w-full px-2 py-2 sm:px-4 sm:py-4 md:px-8 md:py-8 transition-all duration-300 overflow-x-auto bg-[#121212]">
        <div className="w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const SidebarLink = ({ to, label, icon, location }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
      location.pathname === to
        ? 'bg-white/10 text-white'
        : 'hover:bg-white/10 text-gray-400 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default DashboardLayout;