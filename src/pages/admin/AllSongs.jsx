// src/pages/admin/AllSongs.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaMusic,
  FaSearch,
  FaTimes,
  FaPlay,
  FaCompactDisc,
  FaMicrophone,
  FaEye,
} from 'react-icons/fa';
import useAxios from '../../hooks/useAxios';

const formatDuration = (sec) => {
  if (!sec && sec !== 0) return '';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const AllSongs = () => {
  const navigate = useNavigate();
  const { get } = useAxios();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => fetchSongs(search), 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchSongs = async (query = '') => {
    setLoading(true);
    try {
      const res = await get(
        `/api/songs${query ? `?q=${encodeURIComponent(query)}` : ''}`
      );
      setSongs(res.data?.songs || []);
    } catch (err) {
      setSongs([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <div className="relative bg-[#181818] rounded-full p-4 sm:p-5 md:p-6">
              <FaMusic className="text-3xl sm:text-4xl md:text-5xl text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3">
            All Songs Library
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">
            Manage your music collection 🎵
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative max-w-2xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, artist, or genre..."
              className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-full bg-white/10 border border-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300 text-sm sm:text-base"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="animate-pulse bg-[#181818] rounded-lg p-4 sm:p-6 border border-gray-800"
              >
                <div className="aspect-square rounded-lg bg-gray-700 mb-4" />
                <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-700 rounded mb-3" />
                <div className="flex gap-2 mb-3">
                  <div className="h-6 w-16 bg-gray-700 rounded-full" />
                  <div className="h-6 w-16 bg-gray-700 rounded-full" />
                </div>
                <div className="flex gap-3 justify-center mt-4">
                  <div className="w-10 h-10 rounded-full bg-gray-700" />
                  <div className="w-10 h-10 rounded-full bg-gray-700" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 sm:mb-6 text-center"
            >
              <p className="text-gray-400 text-sm sm:text-base">
                {songs.length === 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <FaMusic />
                    No songs found
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FaCompactDisc
                      className="animate-spin"
                      style={{ animationDuration: '3s' }}
                    />
                    {songs.length} {songs.length === 1 ? 'song' : 'songs'} in
                    library
                  </span>
                )}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {songs.map((song, index) => (
                <motion.div
                  key={song._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="relative bg-[#181818] rounded-lg shadow-xl hover:bg-[#282828] border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative z-10 p-4 sm:p-6 flex flex-col h-full">
                    <div className="relative mx-auto w-full aspect-square rounded-lg overflow-hidden shadow-lg mb-4 group/cover">
                      {song.cover ? (
                        <>
                          <img
                            src={song.cover}
                            alt={song.title}
                            className="w-full h-full object-cover transform group-hover/cover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/50 transition-all flex items-center justify-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              whileHover={{ scale: 1 }}
                              className="opacity-0 group-hover/cover:opacity-100 transition-opacity"
                            >
                              <div className="w-12 h-12 rounded-full bg-[#1db954] flex items-center justify-center shadow-xl">
                                <FaPlay className="text-white ml-0.5" />
                              </div>
                            </motion.div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-[#282828] flex items-center justify-center">
                          <FaMusic className="text-5xl text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="text-center mb-3">
                      <h3 className="font-semibold text-base sm:text-lg text-white truncate mb-1">
                        {song.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400 flex items-center justify-center gap-1 truncate">
                        <FaMicrophone className="text-xs" />
                        {song.artist}
                      </p>
                    </div>

                    {song.genre && song.genre.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mb-3">
                        {song.genre.slice(0, 3).map((g, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700 font-semibold"
                          >
                            {g}
                          </span>
                        ))}
                        {song.genre.length > 3 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">
                            +{song.genre.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-3">
                      <FaCompactDisc className="text-sm" />
                      <span>{formatDuration(song.duration) || 'N/A'}</span>
                    </div>

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

                    <div className="mt-auto flex gap-2 pt-2 border-t border-gray-700">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 px-3 py-2 rounded-full bg-white text-black hover:scale-105 font-semibold flex items-center justify-center gap-2 transition-all"
                        onClick={() => navigate(`/dashboard/songs/${song._id}`)}
                      >
                        <FaEye />
                        <span className="hidden sm:inline">View details</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default AllSongs;


