import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import {
  FaPause,
  FaPlay,
  FaMusic,
  FaFire,
  FaClock,
  FaRandom,
  FaHeart,
  FaStar,
} from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import useAxios from "../hooks/useAxios";
import { SearchBar } from "../components/features/search";
import { AddToPlaylistModal } from "../components/features/playlists";

function HomeContent() {
  const navigate = useNavigate();
  const {
    playSong,
    currentSong,
    isPlaying,
    pauseSong,
    queue,
    setQueue,
    currentIndex,
  } = useAudio();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [likedSongIds, setLikedSongIds] = useState([]);
  const [likeEffectId, setLikeEffectId] = useState(null);
  const { get, post, put } = useAxios();
  const [search, setSearch] = useState("");
  const [playlistModal, setPlaylistModal] = useState({
    open: false,
    songId: null,
  });
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [forYouSongs, setForYouSongs] = useState([]);
  const [trendingPlaylists, setTrendingPlaylists] = useState([]);
  const [isPersonalized, setIsPersonalized] = useState(false);

  // ⚡ Fetch all public data in parallel (no user required)
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const [songsRes, trendingRes, newReleasesRes, trendingPlaylistsRes] = 
          await Promise.all([
            get("/api/songs").catch(() => ({ data: { songs: [] } })),
            get("/api/songs/trending?limit=6").catch(() => ({ data: { songs: [] } })),
            get("/api/songs/new-releases?limit=6").catch(() => ({ data: { songs: [] } })),
            get("/api/playlists/public/trending?limit=6").catch(() => ({ data: { playlists: [] } })),
          ]);

        setSongs(songsRes.data.songs || []);
        setTrendingSongs(trendingRes.data.songs || []);
        setNewReleases(newReleasesRes.data.songs || []);
        setTrendingPlaylists(trendingPlaylistsRes.data.playlists || []);
      } catch (error) {
        console.error("Error fetching public data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, []);

  // ⚡ Fetch user-specific data in parallel (requires user)
  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchUserData = async () => {
      try {
        const [recommendationsRes, playlistsRes] = await Promise.all([
          get(`/api/recommendations/${user.uid}?limit=6`).catch(() => ({ 
            data: { songs: [], personalized: false } 
          })),
          get(`/api/playlists/user/${user.uid}`).catch(() => ({ data: [] })),
        ]);

        // Set recommendations
        setForYouSongs(recommendationsRes.data.songs || []);
        setIsPersonalized(recommendationsRes.data.personalized || false);

        // Set liked songs
        const liked = (playlistsRes.data || []).find((pl) => pl.name === "Liked Songs");
        if (liked && liked.songs) {
          setLikedSongIds(liked.songs.map((id) => id.toString()));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (playlistModal.open && user?.uid) {
      setPlaylistLoading(true);
      get(`/api/playlists/user/${user.uid}`)
        .then((res) => setUserPlaylists(res.data || res))
        .catch(() => setUserPlaylists([]))
        .finally(() => setPlaylistLoading(false));
    }
  }, [playlistModal.open, user]);

  // Load recently played from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentlyPlayed");
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
      const stored = localStorage.getItem("recentlyPlayed");
      let recent = [];
      if (stored) {
        try {
          recent = JSON.parse(stored);
        } catch (e) {
          recent = [];
        }
      }
      // Remove if already exists
      recent = recent.filter((s) => s._id !== currentSong._id);
      // Add to beginning
      recent.unshift(currentSong);
      // Keep only last 20
      recent = recent.slice(0, 20);
      localStorage.setItem("recentlyPlayed", JSON.stringify(recent));
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
    let liked = res.data.find((pl) => pl.name === "Liked Songs");
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
        setLikedSongIds((prev) => prev.filter((id) => id !== songId));
        toast.success("Removed from Liked Songs");
      } else {
        await put(`/api/playlists/${likedPlaylistId}/add`, { songId });
        setLikedSongIds((prev) => [...prev, songId]);
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
    if (
      (currentSong?.id && currentSong.id === song.id) ||
      (currentSong?._id && currentSong._id === song._id)
    )
      return;
    // Remove song if already in queue
    let newQueue = queue.filter(
      (q) => q.id && q.id !== song.id && q._id && q._id !== song._id
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
  const searchResults = songs.filter((song) => {
    if (!search) return false;
    return (
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase()) ||
      (song.genre &&
        song.genre.some((g) => g.toLowerCase().includes(search.toLowerCase())))
    );
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
        <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/80 to-fuchsia-900/60 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-150" />

          {/* Album Cover */}
          <div className="relative w-full aspect-square">
            <img
              src={song.cover || "/healers.png"}
              alt={song.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "/healers.png";
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play/Pause button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  if (isCurrent && isPlaying) {
                    pauseSong();
                  } else {
                    playSong(song, index, songList);
                  }
                }}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
              >
                {isCurrent && isPlaying ? (
                  <FaPause className="text-xl" />
                ) : (
                  <FaPlay className="text-xl ml-1" />
                )}
              </button>
            </div>

            {/* Now Playing indicator */}
            {isCurrent && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isPlaying ? "Playing" : "Paused"}
              </div>
            )}

            {/* Like button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                handleLikeSong(song._id);
              }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isLiked
                  ? "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                  : "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
              }`}
            >
              <FaHeart
                className={`text-sm ${
                  likeEffectId === song._id ? "animate-ping" : ""
                }`}
              />
            </motion.button>
          </div>

          {/* Song Info */}
          <div className="p-3">
            <h3 className="font-bold text-sm text-white truncate group-hover:text-yellow-300 transition-colors">
              {song.title}
            </h3>
            <p className="text-xs text-purple-200 truncate mt-1">
              {song.artist}
            </p>
            {song.genre && song.genre.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {song.genre.slice(0, 2).map((g, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full bg-purple-600/50 text-purple-100"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8  pb-42   md:pb-32">
      {/* Search Bar */}
      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
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
          {/* Trending Public Playlists Section */}
          {trendingPlaylists.length > 0 && !search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaFire className="text-2xl text-orange-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trending Playlists
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold flex items-center gap-1">
                  <FaFire className="text-xs" />
                  Hot
                </span>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {trendingPlaylists.map((playlist, idx) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: idx * 0.03 }}
                    whileHover={{ scale: 1.05, y: -4 }}
                    onClick={() => navigate(`/public/playlist/${playlist._id}`)}
                    className="relative group cursor-pointer"
                  >
                    <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/80 to-fuchsia-900/60 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-150" />

                      {/* Cover Image */}
                      <div className="relative w-full aspect-square">
                        {playlist.firstSongCover ? (
                          <img
                            src={playlist.firstSongCover}
                            alt={playlist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-700 via-fuchsia-700 to-pink-700 flex items-center justify-center">
                            <BiSolidPlaylist className="text-5xl text-white/80" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        {/* Play count badge */}
                        {playlist.playCount > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                            <FaFire className="text-xs" />
                            {playlist.playCount}
                          </div>
                        )}

                        {/* Song count */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <span className="text-white text-xs font-semibold flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                            <FaMusic className="text-xs" />
                            {playlist.songs?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-bold text-sm text-white truncate group-hover:text-yellow-300 transition-colors">
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p className="text-xs text-purple-200 truncate mt-1">
                            {playlist.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

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
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={forYouSongs}
                  />
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Recently Played
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recentlyPlayed.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={recentlyPlayed}
                  />
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trending Now
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {trendingSongs.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={trendingSongs}
                  />
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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  New Releases
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {newReleases.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={newReleases}
                  />
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
                  <SongCard
                    key={song._id}
                    song={song}
                    index={index}
                    songs={searchResults}
                  />
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
