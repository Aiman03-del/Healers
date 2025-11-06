import { Outlet, useLocation, Link } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { SearchBar } from "../components/features/search";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";

export default function HomeLayout() {
  const location = useLocation();
  const [search, setSearch] = useState("");

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const tabs = [
    {
      path: "/",
      label: "All",
      icon: null,
    },
    {
      path: "/trending",
      label: "Trending Now",
      icon: null,
    },
    {
      path: "/new-releases",
      label: "New Releases",
      icon: null,
    },
    {
      path: "/for-you",
      label: "Made For You",
      icon: null,
    },
  ];

  const activeTab = useMemo(() => {
    return tabs.find(tab => location.pathname === tab.path) || tabs[0];
  }, [location.pathname]);

  return (
    <MainLayout>
      <div className="space-y-6 pb-20 md:pb-16">
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search songs or artists..."
        />

        {/* Tabs Navigation - Spotify Style */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`px-4 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Content Area - Nested Routes */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet context={{ search }} />
        </motion.div>
      </div>
    </MainLayout>
  );
}

