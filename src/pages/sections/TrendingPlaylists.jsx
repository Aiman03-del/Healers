import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaFire, FaMusic, FaPlay } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { MainLayout } from "../../components/layout";
import { SearchBar } from "../../components/features/search";
import { Loading } from "../../components/common";
import useAxios from "../../hooks/useAxios";
import toast from "react-hot-toast";

export default function TrendingPlaylists() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useAxios();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingPlaylists = async () => {
      try {
        const res = await get("/api/playlists/public/trending?limit=100");
        setPlaylists(res.data.playlists || []);
      } catch (error) {
        console.error("Error fetching trending playlists:", error);
        toast.error("Failed to load trending playlists");
      } finally {
        setLoading(false);
      }
    };
    fetchTrendingPlaylists();
  }, []);

  const filteredPlaylists = search
    ? playlists.filter((playlist) => {
        return (
          playlist.name.toLowerCase().includes(search.toLowerCase()) ||
          (playlist.description &&
            playlist.description.toLowerCase().includes(search.toLowerCase()))
        );
      })
    : playlists;

  return (
    <MainLayout>
      <div className="space-y-8 pb-42 md:pb-32">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trending playlists..."
        />

        {loading ? (
          <Loading message="Loading trending playlists..." />
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Trending Playlists
                </h1>
                <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold flex items-center gap-1">
                  <FaFire className="text-xs" />
                  Hot
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Most popular playlists right now
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {filteredPlaylists.map((playlist, idx) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => navigate(`/public/playlist/${playlist._id}`)}
                    className="relative group cursor-pointer flex-shrink-0"
                  >
                    <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/80 to-fuchsia-900/60 rounded-xl overflow-hidden border border-purple-500/20 transition-all flex flex-row h-32 w-80">

                      {/* Cover Image - Left Side */}
                      <div className="relative w-32 h-full flex-shrink-0">
                        {playlist.firstSongCover ? (
                          <img
                            src={playlist.firstSongCover}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-700 via-fuchsia-700 to-pink-700 flex items-center justify-center">
                            <BiSolidPlaylist className="text-4xl text-white/80" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white flex items-center justify-center">
                            <FaPlay className="text-lg ml-0.5" />
                          </div>
                        </div>

                        {/* Play count badge */}
                        {playlist.playCount > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold flex items-center gap-1">
                            <FaFire className="text-xs" />
                            {playlist.playCount}
                          </div>
                        )}
                      </div>

                      {/* Content - Right Side */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-white group-hover:text-yellow-300 transition-colors mb-1">
                            {playlist.name}
                          </h3>
                          {playlist.description ? (
                            <p className="text-sm text-purple-200 line-clamp-2">
                              {playlist.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-purple-300 flex items-center gap-1">
                            <FaMusic className="text-xs" />
                            {playlist.songs?.length || 0} songs
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {filteredPlaylists.length === 0 && (
                <div className="text-center py-12">
                  <BiSolidPlaylist className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">
                    {search ? 'No playlists found' : 'No trending playlists available'}
                  </p>
                </div>
              )}
            </motion.section>
          </>
        )}
      </div>
    </MainLayout>
  );
}

