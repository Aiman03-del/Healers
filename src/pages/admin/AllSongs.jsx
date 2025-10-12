// src/pages/admin/AllSongs.jsx
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FaEdit, 
  FaTrash, 
  FaMusic, 
  FaSearch,
  FaTimes,
  FaPlay,
  FaCompactDisc,
  FaMicrophone,
  FaGuitar,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import useAxios from '../../hooks/useAxios';

// Helper to convert seconds to mm:ss
function formatDuration(sec) {
  if (!sec && sec !== 0) return '';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper to convert mm:ss to seconds
function parseDuration(str) {
  if (!str) return 0;
  if (/^\d+:\d{1,2}$/.test(str)) {
    const [min, sec] = str.split(':').map(Number);
    return min * 60 + sec;
  }
  // fallback: try parse as number
  return parseInt(str, 10) || 0;
}

const AllSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // <-- Add search state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    artist: '',
    genre: '',
    cover: '',
    audio: '',
    duration: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const { get, put, del } = useAxios();

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSongs(search);
    }, 400);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line
  }, [search]);

  // Fetch songs (with optional search)
  const fetchSongs = async (query = "") => {
    setLoading(true);
    try {
      const res = await get(`/api/songs${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setSongs(res.data.songs || []);
    } catch (err) {
      setSongs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line
  }, []);

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    try {
      await del(`/api/songs/${pendingDeleteId}`);
      setSongs((prev) => prev.filter((s) => s._id !== pendingDeleteId));
      toast.success('Song deleted!');
    } catch (err) {
      toast.error('Failed to delete song');
    }
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const handleEdit = (song) => {
    setEditId(song._id);
    setEditForm({
      title: song.title,
      artist: song.artist,
      genre: Array.isArray(song.genre) ? song.genre.join(', ') : song.genre,
      cover: song.cover,
      audio: song.audio,
      duration: formatDuration(song.duration),
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      const updatedSong = {
        ...editForm,
        genre: editForm.genre.split(',').map((g) => g.trim()),
        duration: parseDuration(editForm.duration),
      };
      const res = await put(`/api/songs/${id}`, updatedSong);
      setSongs((prev) =>
        prev.map((s) => (s._id === id ? { ...s, ...res.data.song } : s))
      );
      setEditId(null);
      toast.success('Song updated!');
    } catch (err) {
      toast.error('Failed to update song');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-fuchsia-900 py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background gradient overlay */}
      <div
        className="fixed inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-2xl opacity-60" />
              <div className="relative bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-full p-4 sm:p-5 md:p-6">
                <FaMusic className="text-3xl sm:text-4xl md:text-5xl text-white" />
              </div>
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
            <span className="bg-gradient-to-r from-purple-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
              All Songs Library
            </span>
          </h1>
          <p className="text-purple-300 text-sm sm:text-base md:text-lg">
            Manage your music collection 🎵
          </p>
        </div>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-lg" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, artist, or genre..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-sm border-2 border-purple-400/50 text-white placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={handleDeleteCancel}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-gradient-to-br from-gray-900/95 via-purple-900/95 to-fuchsia-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border-2 border-red-500/50 p-6 sm:p-8 w-full max-w-md relative">
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl pointer-events-none" />
                  
                  <div className="relative z-10">
                    {/* Warning Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center mb-4 sm:mb-6"
                    >
                      <FaExclamationTriangle className="text-2xl sm:text-3xl text-white" />
                    </motion.div>

                    <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-center text-white">
                      Delete Song?
                    </h2>
                    <p className="text-sm sm:text-base text-purple-200 text-center mb-6 sm:mb-8">
                      Are you sure you want to delete this song? This action cannot be undone.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-4 py-3 rounded-xl bg-white/10 border-2 border-purple-400/50 text-white hover:bg-white/20 transition-all font-semibold"
                        onClick={handleDeleteCancel}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white transition-all font-semibold shadow-lg"
                        onClick={handleDeleteConfirm}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="animate-pulse bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-fuchsia-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border-2 border-purple-500/30"
              >
                <div className="aspect-square rounded-xl bg-gray-700/50 mb-4" />
                <div className="h-4 w-3/4 bg-gray-700/50 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-700/50 rounded mb-3" />
                <div className="flex gap-2 mb-3">
                  <div className="h-6 w-16 bg-gray-700/50 rounded-full" />
                  <div className="h-6 w-16 bg-gray-700/50 rounded-full" />
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700/50" />
                  <div className="w-10 h-10 rounded-full bg-gray-700/50" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            {/* Songs Count */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 sm:mb-6 text-center"
            >
              <p className="text-purple-300 text-sm sm:text-base">
                {songs.length === 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <FaMusic />
                    No songs found
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaCompactDisc className="animate-spin" style={{ animationDuration: '3s' }} />
                    {songs.length} {songs.length === 1 ? 'song' : 'songs'} in library
                  </span>
                )}
              </p>
            </motion.div>

            {/* Songs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {songs.map((song, index) => (
                <motion.div
                  key={song._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="relative bg-gradient-to-br from-gray-900/80 via-purple-900/80 to-fuchsia-900/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl hover:shadow-2xl border-2 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 overflow-hidden group"
                >
                  {/* Glassmorphism overlay */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl pointer-events-none" />
                  
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 transition-all duration-300" />

                  <div className="relative z-10 p-4 sm:p-6">
                      {editId === song._id ? (
                        /* Edit Mode */
                        <form
                          className="w-full space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleEditSave(song._id);
                          }}
                        >
                          {/* Cover Preview */}
                          <div className="relative mx-auto w-full aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-purple-400 mb-3">
                            {editForm.cover ? (
                              <img
                                src={editForm.cover}
                                alt="cover"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <FaMusic className="text-4xl text-purple-400" />
                              </div>
                            )}
                          </div>

                          {/* Form Fields */}
                          <input
                            name="cover"
                            value={editForm.cover}
                            onChange={handleEditChange}
                            placeholder="Cover Image URL"
                            className="w-full p-2 rounded-lg bg-white/10 border border-purple-400/50 text-white text-xs placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                          />
                          <input
                            name="title"
                            value={editForm.title}
                            onChange={handleEditChange}
                            placeholder="Song Title"
                            className="w-full p-2 rounded-lg bg-white/10 border border-purple-400/50 text-white text-sm placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                            required
                          />
                          <input
                            name="artist"
                            value={editForm.artist}
                            onChange={handleEditChange}
                            placeholder="Artist Name"
                            className="w-full p-2 rounded-lg bg-white/10 border border-purple-400/50 text-white text-sm placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                            required
                          />
                          <input
                            name="genre"
                            value={editForm.genre}
                            onChange={handleEditChange}
                            placeholder="Genres (comma separated)"
                            className="w-full p-2 rounded-lg bg-white/10 border border-purple-400/50 text-white text-xs placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                          />
                          <input
                            name="duration"
                            value={editForm.duration}
                            onChange={handleEditChange}
                            placeholder="Duration (mm:ss)"
                            className="w-full p-2 rounded-lg bg-white/10 border border-purple-400/50 text-white text-xs placeholder-purple-300/50 focus:ring-2 focus:ring-fuchsia-400 focus:outline-none"
                          />
                          
                          {/* Audio Preview */}
                          {editForm.audio && (
                            <audio 
                              controls 
                              src={editForm.audio} 
                              className="w-full rounded-lg" 
                              style={{ height: '40px' }}
                            />
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="submit"
                              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-lg"
                            >
                              <FaCheckCircle />
                              Save
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-purple-400/50 text-white hover:bg-white/20 font-semibold flex items-center justify-center gap-2"
                              onClick={handleEditCancel}
                            >
                              <FaTimes />
                              Cancel
                            </motion.button>
                          </div>
                        </form>
                      ) : (
                        /* Normal View */
                        <>
                          {/* Cover Image */}
                          <div className="relative mx-auto w-full aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-purple-400 mb-4 group/cover">
                            {song.cover ? (
                              <>
                                <img
                                  src={song.cover}
                                  alt={song.title}
                                  className="w-full h-full object-cover transform group-hover/cover:scale-110 transition-transform duration-300"
                                />
                                {/* Play Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/50 transition-all flex items-center justify-center">
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1 }}
                                    className="opacity-0 group-hover/cover:opacity-100 transition-opacity"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-xl">
                                      <FaPlay className="text-white ml-0.5" />
                                    </div>
                                  </motion.div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                <FaMusic className="text-5xl text-purple-400/50" />
                              </div>
                            )}
                          </div>

                          {/* Song Info */}
                          <div className="text-center mb-3">
                            <h3 className="font-bold text-base sm:text-lg text-white truncate mb-1">
                              {song.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-purple-200 flex items-center justify-center gap-1 truncate">
                              <FaMicrophone className="text-xs" />
                              {song.artist}
                            </p>
                          </div>

                          {/* Genres */}
                          {song.genre && song.genre.length > 0 && (
                            <div className="flex flex-wrap justify-center gap-1 mb-3">
                              {song.genre.slice(0, 3).map((g, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-600/80 to-fuchsia-600/80 text-white font-semibold"
                                >
                                  {g}
                                </span>
                              ))}
                              {song.genre.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-purple-300">
                                  +{song.genre.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Duration */}
                          <div className="flex items-center justify-center gap-2 text-xs text-purple-300 mb-3">
                            <FaCompactDisc className="text-sm" />
                            <span>{formatDuration(song.duration) || 'N/A'}</span>
                          </div>

                          {/* Audio Player */}
                          {song.audio && (
                            <div className="mb-3">
                              <audio 
                                controls 
                                src={song.audio} 
                                className="w-full rounded-lg"
                                style={{ height: '40px' }}
                              />
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t border-purple-500/30">
                            <motion.button
                              whileHover={{ scale: 1.05, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600/80 to-fuchsia-600/80 hover:from-purple-600 hover:to-fuchsia-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                              onClick={() => handleEdit(song)}
                              aria-label="Edit"
                            >
                              <FaEdit />
                              <span className="hidden sm:inline">Edit</span>
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-600/80 to-pink-600/80 hover:from-red-600 hover:to-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
                              onClick={() => handleDeleteClick(song._id)}
                              aria-label="Delete"
                            >
                              <FaTrash />
                              <span className="hidden sm:inline">Delete</span>
                            </motion.button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          )}
      </motion.div>

      {/* Floating music notes decoration */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="fixed top-20 right-10 text-purple-400/20 text-6xl pointer-events-none hidden lg:block"
      >
        ♪
      </motion.div>
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="fixed bottom-20 left-10 text-fuchsia-400/20 text-7xl pointer-events-none hidden lg:block"
      >
        ♫
      </motion.div>
    </div>
  );
};

export default AllSongs;
