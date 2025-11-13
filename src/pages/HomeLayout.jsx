import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { MainLayout } from "../components/layout";
import { SearchBar } from "../components/features/search";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import useAxios from "../hooks/useAxios";
import { Play } from "lucide-react";

export default function HomeLayout() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const suggestionRef = useRef(null);
  const navigate = useNavigate();
  const { get } = useAxios();
  const getRef = useRef(get);
  useEffect(() => {
    getRef.current = get;
  }, [get]);

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

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    setLoadingSuggestions(true);

    const handler = setTimeout(async () => {
      try {
        const response = await getRef.current(
          `/api/songs?q=${encodeURIComponent(search.trim())}&limit=6&fields=title,artist,cover`
        );
        if (!cancelled) {
          setSuggestions(response?.data?.songs || []);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSuggestions(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target)
      ) {
        setIsFocused(false);
      }
    };

    if (isFocused) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFocused]);

  const handleSuggestionSelect = (song) => {
    setSearch("");
    setSuggestions([]);
    setIsFocused(false);
    navigate(`/songs/${song._id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6 pb-20 md:pb-16">
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setIsFocused(true)}
          placeholder="Search songs or artists..."
        >
          {isFocused && search.trim() && (
            <div
              ref={suggestionRef}
              className="absolute left-0 right-0 top-full mt-3 rounded-2xl border border-white/5 bg-[#181818] shadow-2xl overflow-hidden z-30"
            >
              {loadingSuggestions ? (
                <div className="px-4 py-3 text-sm text-gray-400">
                  Searching...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No matches found
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {suggestions.map((song) => (
                    <li key={song._id}>
                      <button
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 focus:bg-white/10 focus:outline-none transition"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionSelect(song)}
                      >
                        <img
                          src={song.cover || "/healers.webp"}
                          alt={song.title}
                          className="h-10 w-10 rounded object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = "/healers.webp";
                            e.target.onerror = null;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {song.artist}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#1db954]/10 text-[#1db954] p-2">
                          <Play className="h-3.5 w-3.5" strokeWidth={2.2} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </SearchBar>

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
        <div key={location.pathname} className="animate-fade-slide">
          <Outlet context={{ search }} />
        </div>
      </div>
    </MainLayout>
  );
}

