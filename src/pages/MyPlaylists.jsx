import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useAxios from "../hooks/useAxios";
import { FaTrashAlt, FaRegSadTear, FaCheckCircle, FaPlay, FaMusic, FaPlus, FaFolder, FaEdit, FaEye, FaClock, FaFire } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { MdPlaylistPlay } from "react-icons/md";
import { MainLayout } from '../components/layout';
import { motion, AnimatePresence } from "framer-motion";

const MyPlaylists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get, post, del } = useAxios();
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchPlaylists = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
    const res = await get(`/api/playlists/user/${user.uid}`);
    setPlaylists(res.data);
    } catch (error) {
      toast.error("Failed to fetch playlists");
      setPlaylists([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    try {
    await post('/api/playlists', {
      ...form,
      userId: user.uid,
    });
      toast.success("Playlist created successfully!");
    setForm({ name: '', description: '' });
    setShowCreateForm(false); // Close form after success
    fetchPlaylists();
    } catch (error) {
      toast.error("Failed to create playlist");
    }
  };

  const handleDelete = async (id, name) => {
    toast(
      (t) => (
        <span className="flex items-center gap-2">
          Delete "{name}"?
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await del(`/api/playlists/${id}?uid=${user.uid}`);
                toast.success(<span className="flex items-center gap-2"><FaCheckCircle className="text-green-500" />Deleted!</span>);
                fetchPlaylists();
              } catch {
                toast.error(<span className="flex items-center gap-2"><FaRegSadTear className="text-red-400" />Not authorized!</span>);
              }
            }}
            className="ml-2 sm:ml-4 px-2 sm:px-3 py-1 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 bg-gray-700 text-white text-xs sm:text-sm rounded hover:bg-gray-800 transition"
          >
            No
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  // Calculate stats
  const totalSongs = playlists.reduce((acc, pl) => acc + (pl.songs?.length || 0), 0);
  const totalPlays = playlists.reduce((acc, pl) => acc + (pl.playCount || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-32 md:pb-32 px-2 sm:px-4 lg:px-6">
        {/* Hero Banner - Spotify Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 sm:mt-6 md:mt-10 relative bg-gradient-to-b from-[#1db954]/20 via-transparent to-transparent rounded-lg overflow-hidden"
        >
          <div className="relative px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-16">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {/* Title with Create Button - Spotify Style */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white flex items-center gap-2 sm:gap-3">
                <BiSolidPlaylist className="text-3xl sm:text-4xl md:text-5xl text-white flex-shrink-0" />
                <span>My Playlists</span>
        </h1>
                
                {/* Create New Playlist Button - Spotify Style */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-all whitespace-nowrap"
                >
                  <FaPlus className="text-base sm:text-lg" />
                  <span className="text-sm sm:text-base">Create New</span>
                </motion.button>
              </div>
              
              {/* Subtitle - Spotify Style */}
              <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 max-w-2xl">
                Create and manage your personalized music collections
              </p>
              
              {/* Stats Cards - Spotify Style */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-[#181818] rounded-lg flex items-center gap-2 hover:bg-[#282828] transition-colors"
                >
                  <FaFolder className="text-gray-400 text-sm sm:text-base md:text-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">{playlists.length}</div>
                    <div className="text-gray-400 text-xs sm:text-sm truncate">Playlists</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-[#181818] rounded-lg flex items-center gap-2 hover:bg-[#282828] transition-colors"
                >
                  <FaMusic className="text-gray-400 text-sm sm:text-base md:text-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">{totalSongs}</div>
                    <div className="text-gray-400 text-xs sm:text-sm truncate">Songs</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-[#181818] rounded-lg flex items-center gap-2 hover:bg-[#282828] transition-colors"
                >
                  <FaFire className="text-gray-400 text-sm sm:text-base md:text-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">{totalPlays}</div>
                    <div className="text-gray-400 text-xs sm:text-sm truncate">Plays</div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-[#181818] rounded-lg flex items-center gap-2 hover:bg-[#282828] transition-colors col-span-2 sm:col-span-1"
                >
                  <FaClock className="text-gray-400 text-sm sm:text-base md:text-lg flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-bold text-lg sm:text-xl md:text-2xl">
                      {playlists.length > 0 ? new Date(playlists[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm truncate">Latest</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Create Playlist Modal - Popup Style */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateForm(false);
                setForm({ name: '', description: '' });
              }}
            >
        <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#282828] rounded-lg shadow-2xl border border-gray-800 w-full max-w-md"
            >
                {/* Close Button - Spotify Style */}
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setForm({ name: '', description: '' });
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white z-10"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Modal Content - Spotify Style */}
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">Create New Playlist</h2>
                    <p className="text-gray-400 text-sm mt-1">Add a name and description</p>
            </div>
            
                  {/* Form - Spotify Style */}
                  <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                  Playlist Name *
                </label>
          <input
            type="text"
            name="name"
                  placeholder="e.g., My Favorite Songs"
                        className="w-full p-3 text-base rounded-lg bg-white/10 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 outline-none transition-all"
            value={form.name}
            onChange={handleChange}
            required
                        autoFocus
          />
              </div>
              <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                  Description (Optional)
                </label>
                <textarea
            name="description"
                  placeholder="What's this playlist about?"
                        className="w-full p-3 text-base rounded-lg bg-white/10 border border-gray-700 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 outline-none transition-all resize-none"
            value={form.description}
            onChange={handleChange}
                  rows="3"
          />
              </div>
                    <div className="flex gap-3 pt-2">
              <motion.button
            type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                        className="flex-1 bg-white text-black font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 hover:scale-105"
          >
                <FaPlus />
                Create Playlist
              </motion.button>
                      <motion.button
                        type="button"
                        onClick={() => {
                          setShowCreateForm(false);
                          setForm({ name: '', description: '' });
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 rounded-full bg-transparent border border-gray-700 text-white font-semibold transition-all hover:border-gray-600"
                      >
                        Cancel
                      </motion.button>
                    </div>
        </form>
          </div>
        </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlists Grid - Ultra Responsive */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="max-w-full sm:max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              <MdPlaylistPlay className="text-gray-400 text-2xl sm:text-3xl" />
              <span>Your Collection</span>
            </h2>
            <div className="text-gray-400 text-xs sm:text-sm">
              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                  </div>
                  </div>

          {loading ? (
            // Loading skeleton - Responsive grid
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-800/50 rounded-xl sm:rounded-2xl h-64 sm:h-72 md:h-80" />
                </div>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            // Empty state - Spotify Style
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#181818] rounded-lg shadow-xl p-6 sm:p-8 md:p-12 text-center border border-gray-800"
            >
              <BiSolidPlaylist className="text-6xl sm:text-7xl md:text-8xl text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No Playlists Yet</h3>
              <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-md mx-auto">
                Create your first playlist to start organizing your music!
              </p>
                  <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-white text-black font-bold rounded-full hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                <FaPlus />
                Create Your First Playlist
              </button>
            </motion.div>
          ) : (
            // Playlist cards grid - Ultra responsive
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              <AnimatePresence>
                {playlists.map((pl, index) => (
                  <motion.div
                    key={pl._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="relative group"
                    onMouseEnter={() => setHoveredCard(pl._id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <motion.div
                      whileHover={{ y: -4, scale: 1.01 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="relative bg-[#181818] rounded-lg shadow-lg hover:bg-[#282828] overflow-hidden transition-all duration-200 cursor-pointer h-full flex flex-col group"
                      onClick={() => navigate(`/playlist/${pl._id}`)}
                    >
                      <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-1">
                        {/* Album Cover / Playlist Image - Spotify Style */}
                        <div className="relative mb-3 sm:mb-4">
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-[#282828] shadow-lg group-hover:shadow-xl transition-shadow">
                            {pl.songs && pl.songs[0]?.cover ? (
                              <img 
                                src={pl.songs[0].cover} 
                                alt={pl.name}
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BiSolidPlaylist className="text-4xl sm:text-5xl md:text-6xl text-white/80" />
                              </div>
                            )}
                            
                            {/* Gradient overlay on image */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          </div>
                          
                          {/* Play button overlay - Shows on hover - Spotify Style */}
                          <AnimatePresence>
                            {hoveredCard === pl._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg"
                                whileTap={{ scale: 0.95 }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  className="bg-[#1db954] text-white p-3 sm:p-4 rounded-full shadow-2xl"
                                >
                                  <FaPlay className="text-lg sm:text-xl md:text-2xl ml-0.5" />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Song count badge - Top right - Spotify Style */}
                          {pl.songs && pl.songs.length > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/70 text-white text-xs font-bold shadow-lg flex items-center gap-1"
                            >
                              <FaMusic className="text-xs" />
                              <span>{pl.songs.length}</span>
                            </motion.div>
                          )}

                          {/* Play count badge - Top left - Spotify Style */}
                          {pl.playCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 left-2 px-2 py-1 rounded-full bg-[#1db954] text-white text-xs font-bold shadow-lg flex items-center gap-1"
                            >
                              <FaFire className="text-xs" />
                              <span>{pl.playCount}</span>
                            </motion.div>
                          )}
                        </div>

                        {/* Playlist Info - Spotify Style */}
                        <div className="space-y-1 sm:space-y-2 flex-1 flex flex-col">
                          <h3 className="font-semibold text-sm sm:text-base md:text-lg text-white truncate group-hover:underline transition-colors">
                            {pl.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 flex-1">
                            {pl.description || "No description"}
                          </p>
                        </div>

                        {/* Actions footer - Spotify Style */}
                        <div className="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-700">
                          <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <div className="flex items-center gap-1 text-gray-400">
                              <FaMusic className="text-xs" />
                              <span className="font-medium">{pl.songs?.length || 0}</span>
                            </div>
                            {pl.createdAt && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <FaClock className="text-xs" />
                                <span className="text-xs hidden sm:inline">
                                  {new Date(pl.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Action buttons - Spotify Style */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/playlist/${pl._id}`);
                              }}
                              className="p-1.5 sm:p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all"
                              title="View playlist"
                            >
                              <FaEye className="text-xs sm:text-sm" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(pl._id, pl.name);
                              }}
                              className="p-1.5 sm:p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-all"
                              title="Delete playlist"
                            >
                              <FaTrashAlt className="text-xs sm:text-sm" />
                            </motion.button>
                </div>
              </div>
            </div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Enhanced CSS animations */}
      <style>{`
        @keyframes shine {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
        
        /* Custom scrollbar for playlists */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #535353;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #727272;
        }

        /* Extra small devices support */
        @media (max-width: 374px) {
          .text-responsive {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default MyPlaylists;
