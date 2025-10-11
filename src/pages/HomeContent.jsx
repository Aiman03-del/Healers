import { useEffect, useState } from "react";
import { useAudio } from "../context/AudioContext";
import { FaPause, FaPlay, FaMusic, FaFire, FaClock, FaRandom, FaHeart, FaStar } from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import toast from "react-hot-toast";
import useAxios from "../hooks/useAxios";
import { SearchBar } from "../components/features/search";
import { AddToPlaylistModal } from "../components/features/playlists";

function HomeContent() {
  const { playSong, currentSong, isPlaying, pauseSong, queue, setQueue, currentIndex } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [likedSongIds, setLikedSongIds] = useState([]);
  const [likeEffectId, setLikeEffectId] = useState(null);
  const { get, post, put } = useAxios();
  const [search, setSearch] = useState("");
  const [playlistModal, setPlaylistModal] = useState({ open: false, songId: null });
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [forYouSongs, setForYouSongs] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await get("/api/songs");
        setSongs(res.data.songs || []);
      } catch {
        setSongs([]);
      }
      setLoading(false);
    };
    fetchSongs();
  }, []);

  // Fetch trending songs
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await get("/api/songs/trending?limit=6");
        setTrendingSongs(res.data.songs || []);
      } catch {
        setTrendingSongs([]);
      }
    };
    fetchTrending();
  }, []);

  // Fetch new releases
  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const res = await get("/api/songs/new-releases?limit=6");
        setNewReleases(res.data.songs || []);
      } catch {
        setNewReleases([]);
      }
    };
    fetchNewReleases();
  }, []);

  // Fetch personalized recommendations ("For You")
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.uid) return;
      try {
        const res = await get(`/api/recommendations/${user.uid}?limit=6`);
        setForYouSongs(res.data.songs || []);
        setIsPersonalized(res.data.personalized || false);
      } catch {
        setForYouSongs([]);
        setIsPersonalized(false);
      }
    };
    fetchRecommendations();
  }, [user]);

  useEffect(() => {
    const fetchLiked = async () => {
      if (!user?.uid) return;
      try {
        const res = await get(`/api/playlists/user/${user.uid}`);
        const liked = res.data.find(pl => pl.name === "Liked Songs");
        if (liked && liked.songs) {
          setLikedSongIds(liked.songs.map(id => id.toString()));
        }
      } catch {
        setLikedSongIds([]);
      }
    };
    fetchLiked();
  }, [user]);

  useEffect(() => {
    if (playlistModal.open && user?.uid) {
      setPlaylistLoading(true);
      get(`/api/playlists/user/${user.uid}`)
        .then(res => setUserPlaylists(res.data || res))
        .catch(() => setUserPlaylists([]))
        .finally(() => setPlaylistLoading(false));
    }
  }, [playlistModal.open, user]);

  // Load recently played from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentlyPlayed');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentlyPlayed(parsed.slice(0, 6)); // Get last 6
      } catch (e) {
        setRecentlyPlayed([]);
      }
    }
  }, []);

  // Save to recently played and increment play count when a song is played
  useEffect(() => {
    if (currentSong && currentSong._id) {
      const stored = localStorage.getItem('recentlyPlayed');
      let recent = [];
      if (stored) {
        try {
          recent = JSON.parse(stored);
        } catch (e) {
          recent = [];
        }
      }
      // Remove if already exists
      recent = recent.filter(s => s._id !== currentSong._id);
      // Add to beginning
      recent.unshift(currentSong);
      // Keep only last 20
      recent = recent.slice(0, 20);
      localStorage.setItem('recentlyPlayed', JSON.stringify(recent));
      setRecentlyPlayed(recent.slice(0, 6));

      // Increment play count on server
      post(`/api/songs/${currentSong._id}/play`).catch(() => {
        // Silently fail if API call fails
      });
    }
  }, [currentSong]);

  const isSongCurrent = (song) =>
    (currentSong?.id && currentSong.id === song.id) ||
    (currentSong?._id && currentSong._id === song._id);

  const getOrCreateLikedPlaylist = async () => {
    const res = await get(`/api/playlists/user/${user.uid}`);
    let liked = res.data.find(pl => pl.name === "Liked Songs");
    if (!liked) {
      const createRes = await post("/api/playlists", {
        name: "Liked Songs",
        description: "Your liked songs",
        userId: user.uid,
      });
      liked = { _id: createRes.data.id };
    }
    return liked._id;
  };

  const handleLikeSong = async (songId) => {
    setLikeEffectId(songId);
    try {
      const likedPlaylistId = await getOrCreateLikedPlaylist();
      if (likedSongIds.includes(songId)) {
        await put(`/api/playlists/${likedPlaylistId}/remove`, { songId });
        setLikedSongIds(prev => prev.filter(id => id !== songId));
        toast.success("Removed from Liked Songs");
      } else {
        await put(`/api/playlists/${likedPlaylistId}/add`, { songId });
        setLikedSongIds(prev => [...prev, songId]);
        toast.success("Added to Liked Songs");
      }
    } catch {
      toast.error("Failed to update like");
    }
    setTimeout(() => setLikeEffectId(null), 300);
  };

  const handleAddToPlaylist = async (playlistId, songId) => {
    try {
      await put(`/api/playlists/${playlistId}/add`, { songId });
      toast.success("Song added to playlist!");
      setPlaylistModal({ open: false, songId: null });
    } catch {
      toast.error("Failed to add song to playlist");
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      const res = await post("/api/playlists", {
        name: newPlaylistName,
        description: "",
        userId: user.uid,
      });
      await handleAddToPlaylist(res.data.id, playlistModal.songId);
      setNewPlaylistName("");
    } catch {
      toast.error("Failed to create playlist");
    }
  };

  const playNextSong = (song) => {
    // If song is already current, do nothing
    if ((currentSong?.id && currentSong.id === song.id) || (currentSong?._id && currentSong._id === song._id)) return;
    // Remove song if already in queue
    let newQueue = queue.filter(q =>
      (q.id && q.id !== song.id) && (q._id && q._id !== song._id)
    );
    // Insert song after currentIndex
    if (typeof currentIndex === "number" && currentIndex >= 0) {
      newQueue.splice(currentIndex + 1, 0, song);
    } else {
      newQueue.push(song);
    }
    setQueue(newQueue);
    toast.success("Song will play next!");
  };

  // Filter by search only
  const searchResults = songs.filter(song => {
    if (!search) return false;
    return song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase()) ||
      (song.genre && song.genre.some(g => g.toLowerCase().includes(search.toLowerCase())));
  });

  // Play random song
  const playRandomSong = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSong(songs[randomIndex], randomIndex, songs);
    toast.success("Playing random song!");
  };

  // Component for rendering song cards
  const SongCard = ({ song, index, songs: songList }) => {
    const isCurrent = isSongCurrent(song);
    const isLiked = likedSongIds.includes(song._id);
    
    return (
      <motion.div
        key={song._id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, delay: index * 0.02 }}
        className="relative group"
      >
        <motion.div
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-gray-900 via-purple-900/80 to-fuchsia-900/60 dark:from-gray-800 dark:via-purple-800/70 dark:to-fuchsia-800/50 p-3 sm:p-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 flex flex-col overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all duration-200 backdrop-blur-sm"
          style={{
            minHeight: 280,
          }}
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all duration-150 pointer-events-none" />
          
          {/* Play count badge (top-right) */}
          {song.playCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.1 }}
              className="absolute top-3 right-3 z-20 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
            >
              <FaFire className="text-xs" />
              {song.playCount > 999 ? `${(song.playCount / 1000).toFixed(1)}K` : song.playCount}
            </motion.div>
          )}
          {/* Album Cover / Image */}
          <div className="relative w-full aspect-square mb-3 rounded-xl overflow-hidden shadow-2xl group/image">
            {/* Gradient overlay on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            
            <img
              src={song.cover}
              alt={song.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover/image:scale-105 bg-gradient-to-br from-gray-700 to-gray-900"
              loading="lazy"
            />
            
            {/* Currently playing indicator */}
            {isCurrent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className="absolute top-2 left-2 z-20 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Playing
              </motion.div>
            )}

            {/* Floating Play Button Overlay */}
            <motion.button
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all duration-150 z-20"
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                isCurrent && isPlaying
                  ? pauseSong()
                  : playSong(song, index, songList)
              }
              aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white p-4 rounded-full shadow-2xl border-2 border-white/30"
              >
                {isCurrent && isPlaying ? (
                  <FaPause className="text-2xl" />
                ) : (
                  <FaPlay className="text-2xl ml-1" />
                )}
              </motion.div>
            </motion.button>

            {/* Action Buttons Container */}
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2">
              {/* Add to Playlist Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full p-2.5 shadow-xl border-2 bg-white/90 backdrop-blur-sm border-white/60 text-purple-600 hover:text-purple-700 hover:bg-white transition-all duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaylistModal({ open: true, songId: song._id });
                }}
                aria-label="Add to Playlist"
                title="Add to Playlist"
              >
                <BiSolidPlaylist className="text-base" />
              </motion.button>

              {/* ❤️ Like Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full p-2.5 shadow-xl border-2 transition-all duration-150 ${
                  isLiked
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 border-pink-300 text-white"
                    : "bg-white/90 backdrop-blur-sm border-white/60 text-gray-600 hover:text-pink-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeSong(song._id);
                }}
                aria-label={isLiked ? "Unlike" : "Like"}
              >
                <FaHeart className="text-base" />
                <AnimatePresence>
                  {likeEffectId === song._id && (
                    <motion.span
                      className="absolute inset-0"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{
                        scale: [1, 2],
                        opacity: [1, 0],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{
                        background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
                        borderRadius: "50%",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
          {/* Song Info */}
          <div className="relative flex-1 flex flex-col justify-between">
            {/* Title and Artist */}
            <div className="space-y-1">
              <h3 className="font-bold text-sm sm:text-base text-white truncate group-hover:text-yellow-300 transition-colors duration-200">
                {song.title}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200 font-medium truncate flex items-center gap-1">
                <FaMusic className="text-xs opacity-60" />
                {song.artist}
              </p>
            </div>

            {/* Genres */}
            {song.genre && song.genre.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {song.genre.slice(0, 2).map((g, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full bg-purple-600/40 text-purple-100 text-xs font-medium backdrop-blur-sm border border-purple-400/30"
                  >
                    {g}
                  </span>
                ))}
                {song.genre.length > 2 && (
                  <span className="px-2 py-0.5 rounded-full bg-fuchsia-600/40 text-fuchsia-100 text-xs font-medium">
                    +{song.genre.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Shine effect on hover */}
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{
              background: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
              backgroundSize: "200% 200%",
              animation: "shine 1.5s ease-in-out infinite",
            }}
            aria-hidden
          />
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8  pb-42   md:pb-32">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-10 relative bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLS41IDM5LjVoNDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative px-6 py-12 md:px-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 flex items-center gap-3">
              <FaMusic className="text-4xl md:text-5xl text-yellow-300" />
              {user ? `Welcome back, ${user.name || user.email.split('@')[0]}!` : 'Welcome to AudioVibe'}
            </h1>
            <p className="text-purple-100 text-lg md:text-xl mb-6">
              {isPersonalized 
                ? "Your personalized music experience awaits" 
                : "Discover curated playlists and trending music"}
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={playRandomSong}
                className="px-6 py-3 bg-white text-purple-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center gap-2"
              >
                <FaRandom /> Surprise Me
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search songs or artists..."
      />

      {loading ? (
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gradient-to-br from-purple-100 via-gray-100 to-gray-50 dark:from-purple-900 dark:via-gray-900 dark:to-gray-800 p-5 rounded-2xl shadow-xl flex flex-col items-center"
            >
              <div className="w-28 h-28 mb-4 rounded-xl bg-gray-700" />
              <div className="h-4 w-2/3 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-800 rounded mb-1" />
              <div className="h-3 w-1/3 bg-gray-800 rounded mb-1" />
              <div className="h-3 w-1/4 bg-gray-800 rounded mb-1" />
              <div className="flex gap-3 mt-2">
                <div className="w-10 h-10 rounded-full bg-gray-700" />
                <div className="w-10 h-10 rounded-full bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* For You Section (Personalized Recommendations) */}
          {forYouSongs.length > 0 && !search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FaStar className="text-2xl text-yellow-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {isPersonalized ? "Made For You" : "Popular Picks"}
                  </h2>
                </div>
                {isPersonalized && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold">
                    Personalized
                    </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {forYouSongs.map((song, idx) => (
                  <SongCard key={song._id} song={song} index={idx} songs={forYouSongs} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Recently Played Section */}
          {recentlyPlayed.length > 0 && !search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.05 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaClock className="text-2xl text-purple-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recently Played</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recentlyPlayed.map((song, idx) => (
                  <SongCard key={song._id} song={song} index={idx} songs={recentlyPlayed} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Trending Section */}
          {!search && trendingSongs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaFire className="text-2xl text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Now</h2>
                  </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {trendingSongs.map((song, idx) => (
                  <SongCard key={song._id} song={song} index={idx} songs={trendingSongs} />
                ))}
                </div>
            </motion.section>
          )}

          {/* New Releases Section */}
          {!search && newReleases.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaMusic className="text-2xl text-green-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Releases</h2>
                  </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {newReleases.map((song, idx) => (
                  <SongCard key={song._id} song={song} index={idx} songs={newReleases} />
                ))}
                </div>
            </motion.section>
          )}

          {/* Search Results */}
          {search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {searchResults.map((song, index) => (
                  <SongCard key={song._id} song={song} index={index} songs={searchResults} />
                ))}
              </div>
              {searchResults.length === 0 && (
                <div className="text-center py-12">
                  <FaMusic className="text-6xl text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-500 dark:text-gray-400">
                    No songs found matching "{search}"
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Try searching for a different song, artist, or genre
                  </p>
        </div>
              )}
            </motion.section>
          )}
        </>
      )}

      {/* Add to Playlist Modal */}
      <AnimatePresence>
        {playlistModal.open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AddToPlaylistModal
              songId={playlistModal.songId}
              onClose={() => setPlaylistModal({ open: false, songId: null })}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomeContent;
