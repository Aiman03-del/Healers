// src/components/layout/DashboardLayout/DashboardLayout.jsx
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useEffect, useState } from "react";
import axios from "axios";
import {  FaBars, FaTimes } from "react-icons/fa";
import { DashboardSidebar } from '../';

const DashboardLayout = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const fetchStats = async () => {
      try {
        const [songsRes, usersRes, topSongsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/songs`),
          axios.get(`${API_BASE_URL}/api/users`),
          axios.get(`${API_BASE_URL}/api/songs?sort=playCount&limit=5`),
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
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-900 text-white">
      {/* Sidebar for desktop */}
      <aside
        className="sticky top-0 h-[60px] md:h-screen w-full md:w-64 bg-gradient-to-b from-purple-900 via-gray-900 to-gray-800 p-0 shadow-2xl border-b md:border-b-0 md:border-r border-purple-900 flex md:flex-col z-30"
      >
        <div className="hidden md:block w-full h-full">
          <DashboardSidebar onLogout={logout} />
        </div>
        {/* Mobile sidebar toggle area (empty for desktop) */}
        <div className="md:hidden w-full h-full"></div>
      </aside>
      {/* Sidebar for mobile (slide-in) */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${sidebarOpen ? "block" : "pointer-events-none"}`}
        {...(!sidebarOpen ? { inert: true } : {})}
      >
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setSidebarOpen(false)}
        />
        {/* Sidebar panel */}
        <aside
          className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-gradient-to-b from-purple-900 via-gray-900 to-gray-800 shadow-2xl border-r border-purple-900 flex flex-col z-50 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-2xl text-purple-200 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
          <DashboardSidebar onLogout={logout} />
        </aside>
      </div>
      {/* Toggle button (hamburger) */}
      <button
        className="fixed top-4 left-4 z-50 bg-purple-700 text-white p-2 rounded-full shadow-lg hover:bg-purple-800 transition md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
        style={{ display: sidebarOpen ? "none" : "block" }}
      >
        <FaBars />
      </button>
      {/* Main */}
      <main className="flex-1 w-full px-2 py-2 sm:px-4 sm:py-4 md:px-8 md:py-8 transition-all duration-300 overflow-x-auto">
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
        ? 'bg-purple-700 text-white shadow'
        : 'hover:bg-purple-800/60 text-purple-200'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

export default DashboardLayout;