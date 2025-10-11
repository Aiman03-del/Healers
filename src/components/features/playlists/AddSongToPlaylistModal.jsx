import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import useAxios from "../../../hooks/useAxios";
import { FaSearch, FaTimes, FaPlus, FaMusic, FaFire, FaStar, FaCheckCircle } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";

const AddSongToPlaylistModal = ({ playlistId, onClose, onSongAdded }) => {
  const { user } = useAuth();
  const { get, put } = useAxios();
  const [searchQuery, setSearchQuery] = useState("");
  const [allSongs, setAllSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [suggestedSongs, setSuggestedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [existingSongIds, setExistingSongIds] = useState([]); // Track songs already in playlist
  const modalRef = useRef();
  const searchInputRef = useRef();

  useEffect(() => {
    fetchSongsAndSuggestions();
  }, [user]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const fetchSongsAndSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch current playlist to get existing songs
      const playlistRes = await get(`/api/playlists/${playlistId}`);
      const existingSongs = playlistRes.data.songs || [];
      const existingIds = existingSongs.map(s => s._id || s.id).filter(Boolean);
      setExistingSongIds(existingIds);

      // Fetch all songs
      const songsRes = await get("/api/songs");
      const allSongsData = songsRes.data.songs || [];
      
      // Filter out songs that are already in the playlist
      const availableSongs = allSongsData.filter(song => 
        !existingIds.includes(song._id)
      );
      
      setAllSongs(availableSongs);
      setFilteredSongs(availableSongs);

      // Fetch user's listening history/activity to get preferred genres
      if (user?.uid) {
        try {
          const activityRes = await get(`/api/activity/user/${user.uid}`);
          const activities = activityRes.data.activities || [];
          
          // Get user's playlists to understand preferences
          const playlistsRes = await get(`/api/playlists/user/${user.uid}`);
          const playlists = playlistsRes.data || [];
          
          // Calculate genre preferences based on user's playlist songs
          const genreCount = {};
          const playedSongIds = new Set();
          
          // Count genres from user's playlists
          playlists.forEach(playlist => {
            if (playlist.songs && Array.isArray(playlist.songs)) {
              playlist.songs.forEach(song => {
                if (song.genre && Array.isArray(song.genre)) {
                  song.genre.forEach(g => {
                    genreCount[g] = (genreCount[g] || 0) + 1;
                  });
                }
              });
            }
          });

          // Get song IDs from play activities
          activities.forEach(activity => {
            if (activity.action === "Played song" && activity.metadata?.songId) {
              playedSongIds.add(activity.metadata.songId);
            }
          });

          // Get top 3 genres
          const topGenres = Object.entries(genreCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

          // Filter and suggest songs (only from available songs)
          let suggested = [];
          
          if (topGenres.length > 0) {
            // Get songs matching user's preferred genres (from available songs only)
            const genreMatchedSongs = availableSongs.filter(song => 
              song.genre && 
              Array.isArray(song.genre) && 
              song.genre.some(g => topGenres.includes(g))
            );
            
            // Prioritize songs with higher play counts
            const sortedByPopularity = genreMatchedSongs.sort((a, b) => 
              (b.playCount || 0) - (a.playCount || 0)
            );
            
            // Mix popular songs with random songs from preferred genres
            const popular = sortedByPopularity.slice(0, 3);
            const remaining = sortedByPopularity.slice(3);
            
            // Shuffle remaining and take 2
            const shuffled = remaining.sort(() => Math.random() - 0.5).slice(0, 2);
            
            suggested = [...popular, ...shuffled];
          }
          
          // If not enough suggestions, add random popular songs from available
          if (suggested.length < 5) {
            const remainingSongs = availableSongs
              .filter(s => !suggested.find(sg => sg._id === s._id))
              .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
              .slice(0, 5 - suggested.length);
            
            suggested = [...suggested, ...remainingSongs];
          }
          
          // Limit to 5 suggestions
          setSuggestedSongs(suggested.slice(0, 5));
        } catch (error) {
          console.error("Error fetching user preferences:", error);
          // Fallback: suggest popular songs from available
          const popular = availableSongs
            .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
            .slice(0, 5);
          setSuggestedSongs(popular);
        }
      } else {
        // No user, suggest popular songs from available
        const popular = availableSongs
          .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
          .slice(0, 5);
        setSuggestedSongs(popular);
      }
    } catch (error) {
      toast.error("Failed to load songs");
      setAllSongs([]);
      setFilteredSongs([]);
    }
    setLoading(false);
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSongs(allSongs);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = allSongs.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.genre && song.genre.some(g => g.toLowerCase().includes(query)))
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, allSongs]);

  const handleAddSong = async (songId) => {
    setAdding(songId);
    try {
      const res = await put(`/api/playlists/${playlistId}/add`, { songId });
      if (res.data.message === "Already added" || res.data.message === "Song already in playlist") {
        toast.error("Song already in this playlist");
      } else {
        toast.success("Song added to playlist!");
        
        // Update local state to remove the added song from available songs
        setExistingSongIds(prev => [...prev, songId]);
        setAllSongs(prev => prev.filter(s => s._id !== songId));
        setFilteredSongs(prev => prev.filter(s => s._id !== songId));
        setSuggestedSongs(prev => prev.filter(s => s._id !== songId));
        
        if (onSongAdded) onSongAdded();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to add song";
      toast.error(errorMessage);
    }
    setAdding(null);
  };

  const SongItem = ({ song, isSuggested = false }) => (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-purple-500/20 hover:border-purple-400/40 transition-all group"
    >
      {/* Album Cover */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-gradient-to-br from-purple-700 to-fuchsia-700 flex-shrink-0 relative">
        <img 
          src={song.cover} 
          alt={song.title}
          className="w-full h-full object-cover"
        />
        {isSuggested && (
          <div className="absolute top-0.5 right-0.5">
            <FaStar className="text-yellow-400 text-xs drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-sm sm:text-base truncate">
          {song.title}
        </h4>
        <p className="text-purple-200 text-xs sm:text-sm truncate">
          {song.artist}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {song.genre && song.genre.slice(0, 2).map((g, i) => (
            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-200">
              {g}
            </span>
          ))}
          {song.playCount > 0 && (
            <span className="text-xs text-orange-400 flex items-center gap-1">
              <FaFire className="text-xs" />
              {song.playCount}
            </span>
          )}
        </div>
      </div>

      {/* Add Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handleAddSong(song._id)}
        disabled={adding === song._id}
        className="px-3 py-2 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
      >
        {adding === song._id ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="hidden sm:inline">Adding...</span>
          </>
        ) : (
          <>
            <FaPlus />
            <span className="hidden sm:inline">Add</span>
          </>
        )}
      </motion.button>
    </motion.div>
  );

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={modalRef}
        className="relative bg-gradient-to-br from-gray-900 via-purple-900/90 to-fuchsia-900/80 rounded-2xl shadow-2xl border border-purple-500/30 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl shadow-lg">
              <BiSolidPlaylist className="text-white text-xl sm:text-2xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Add Song to Playlist</h2>
              <p className="text-xs sm:text-sm text-purple-200">
              Search or select from suggestions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 border-b border-purple-500/20">
          <div className="relative">
            <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-purple-300" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by song, artist, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/40 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-purple-200">Loading songs...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Suggested Songs Section */}
              {searchQuery === "" && suggestedSongs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      Suggested for You
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-purple-200 -mt-2">
                    Based on your listening preferences
                  </p>
                  <div className="space-y-2">
                    {suggestedSongs.map(song => (
                      <SongItem key={song._id} song={song} isSuggested={true} />
                    ))}
                  </div>
                </div>
              )}

              {/* All/Filtered Songs Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FaMusic className="text-purple-400" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {searchQuery ? "Search Results" : "All Songs"}
                    </h3>
                  </div>
                  <span className="text-xs sm:text-sm text-purple-300">
                    {filteredSongs.length} songs
                  </span>
                </div>
                
                {filteredSongs.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FaCheckCircle className="text-4xl sm:text-5xl text-green-400/70 mx-auto mb-3" />
                    <p className="text-white text-sm sm:text-base font-semibold mb-1">
                      {searchQuery ? "No matching songs found" : "All songs added!"}
                    </p>
                    <p className="text-purple-300/70 text-xs sm:text-sm mt-1">
                      {searchQuery 
                        ? "Try a different search term" 
                        : "You've added all available songs to this playlist"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {filteredSongs.slice(0, 20).map(song => (
                      <SongItem key={song._id} song={song} />
                    ))}
                    {filteredSongs.length > 20 && (
                      <p className="text-center text-purple-300 text-xs sm:text-sm py-2">
                        Showing 20 of {filteredSongs.length} songs
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </motion.div>
  );
};

export default AddSongToPlaylistModal;

