import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import {
  FaPause,
  FaPlay,
  FaMusic,
  FaFire,
  FaClock,
  FaRandom,
  FaStar,
} from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import useAxios from "../hooks/useAxios";
import { SearchBar } from "../components/features/search";
import { AddToPlaylistModal } from "../components/features/playlists";

// SongCard Component - Memoized to prevent unnecessary re-renders
const SongCard = memo(
  ({ song, index, songs: songList, currentSongId, isCurrentPlaying, onPlay, onPause }) => {
    const isCurrent = currentSongId === song._id;

    const handleCardClick = () => {
      if (isCurrent && isCurrentPlaying) {
        onPause();
      } else {
        onPlay(song, index, songList);
      }
    };

    return (
      <motion.div
        key={song._id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.01, 0.3) }}
        className="relative group cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group">
          {/* Album Cover */}
          <div className="relative w-full aspect-square mb-4">
            <img
              src={song.cover || "/healers.png"}
              alt={song.title}
              className="w-full h-full object-cover rounded"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = "/healers.png";
              }}
            />
            
            {/* Play/Pause button overlay - Spotify Style */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-colors"
              >
                {isCurrent && isCurrentPlaying ? (
                  <FaPause className="text-xl" />
                ) : (
                  <FaPlay className="text-xl ml-1" />
                )}
              </motion.button>
            </div>

            {/* Now Playing indicator - Spotify Style */}
            {isCurrent && (
              <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#1db954] shadow-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            )}
          </div>

          {/* Song Info - Spotify Style */}
          <div>
            <h3 className="font-semibold text-sm text-white truncate mb-1 group-hover:underline cursor-pointer">
              {song.title}
            </h3>
            <p className="text-xs text-gray-400 truncate">
              {song.artist}
            </p>
          </div>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders
    return (
      prevProps.song._id === nextProps.song._id &&
      prevProps.currentSongId === nextProps.currentSongId &&
      prevProps.isCurrentPlaying === nextProps.isCurrentPlaying
    );
  }
);

SongCard.displayName = 'SongCard';

function HomeContent({ searchQuery = "" }) {
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
  const [search, setSearch] = useState(searchQuery);
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
  const [genrePlaylists, setGenrePlaylists] = useState([]);

  // ⚡ Fetch critical data first, then load others progressively
  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // ⚡ Load trending songs first (most important)
        const trendingRes = await get("/api/songs/trending?limit=6").catch(() => ({ data: { songs: [] } }));
        setTrendingSongs(trendingRes.data.songs || []);
        setLoading(false); // Show page with trending songs immediately
        
        // ⚡ Load remaining data in background (non-blocking)
        Promise.all([
          get("/api/songs").catch(() => ({ data: { songs: [] } })),
          get("/api/songs/new-releases?limit=6").catch(() => ({ data: { songs: [] } })),
          get("/api/playlists/public/trending?limit=6").catch(() => ({ data: { playlists: [] } })),
        ]).then(([songsRes, newReleasesRes, trendingPlaylistsRes]) => {
          setSongs(songsRes.data.songs || []);
        setNewReleases(newReleasesRes.data.songs || []);
        setTrendingPlaylists(trendingPlaylistsRes.data.playlists || []);
        }).catch((error) => {
          console.error("Error fetching additional data:", error);
        });
      } catch (error) {
        console.error("Error fetching trending data:", error);
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
        const [recommendationsRes, playlistsRes, userRes] = await Promise.all([
          get(`/api/recommendations/${user.uid}?limit=6`).catch(() => ({ 
            data: { songs: [], personalized: false } 
          })),
          get(`/api/playlists/user/${user.uid}`).catch(() => ({ data: [] })),
          get(`/api/users/${user.uid}`).catch(() => ({ data: { user: null } })),
        ]);

        // Set recommendations
        setForYouSongs(recommendationsRes.data.songs || []);
        setIsPersonalized(recommendationsRes.data.personalized || false);

        // Set liked songs
        const liked = (playlistsRes.data || []).find((pl) => pl.name === "Liked Songs");
        if (liked && liked.songs) {
          setLikedSongIds(liked.songs.map((id) => id.toString()));
        }

        // Generate genre-based playlists
        const userData = userRes.data.user;
        if (userData && userData.preferences && userData.preferences.favoriteGenres) {
          const favoriteGenres = userData.preferences.favoriteGenres;
          
          // Create virtual playlists for each favorite genre
          const genrePlaylists = favoriteGenres.slice(0, 3).map(genre => {
            const genreSongs = songs.filter(song => 
              song.genre && song.genre.includes(genre)
            );
            
            return {
              _id: `genre-${genre}`,
              name: `${genre} Mix`,
              description: `Your personalized ${genre} collection`,
              genre: genre,
              songs: genreSongs.slice(0, 12),
              songCount: genreSongs.length,
              isGenrePlaylist: true,
              firstSongCover: genreSongs[0]?.cover || '/healers.png'
            };
          }).filter(playlist => playlist.songs.length > 0);
          
          setGenrePlaylists(genrePlaylists);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();
  }, [user, songs]);

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

  // Close playlist modal - Memoized
  const closePlaylistModal = useCallback(() => {
    setPlaylistModal({ open: false, songId: null });
  }, []);

  // Memoized callback to prevent SongCard re-renders
  const handleLikeSong = useCallback(async (songId) => {
    if (!user?.uid) {
      toast.error("Please login to like songs");
      return;
    }
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
  }, [likedSongIds, user]);

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

  // Filter by search only - Memoized for performance
  const searchResults = useMemo(() => {
    if (!search) return [];
    return songs.filter((song) => {
    return (
      song.title.toLowerCase().includes(search.toLowerCase()) ||
      song.artist.toLowerCase().includes(search.toLowerCase()) ||
      (song.genre &&
        song.genre.some((g) => g.toLowerCase().includes(search.toLowerCase())))
    );
  });
  }, [songs, search]);

  // Play random song
  const playRandomSong = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSong(songs[randomIndex], randomIndex, songs);
    toast.success("Playing random song!");
  };

  // Update search when searchQuery prop changes
  useEffect(() => {
    if (searchQuery !== undefined) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  return (
    <div className="space-y-8 py-6">

      {loading ? (
        <>
          {/* Skeleton for Trending Playlists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-48 bg-gray-800 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
                  className="bg-[#181818] rounded-lg p-4 animate-pulse"
                >
                  <div className="w-full aspect-square mb-4 rounded bg-gray-700" />
                  <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton for Made For You */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-40 bg-gray-800 rounded animate-pulse" />
                <div className="h-5 w-24 bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#181818] rounded-lg p-4 animate-pulse"
                >
                  <div className="w-full aspect-square mb-4 rounded bg-gray-700" />
                  <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton for Trending Now */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-36 bg-gray-800 rounded animate-pulse" />
              <div className="h-5 w-20 bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-[#181818] rounded-lg p-4 animate-pulse"
                >
                  <div className="w-full aspect-square mb-4 rounded bg-gray-700" />
                  <div className="h-4 w-3/4 bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-800 rounded" />
            </div>
          ))}
        </div>
          </div>
        </>
      ) : (
        <>
          {/* Trending Public Playlists Section */}
          {trendingPlaylists.length > 0 && !search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/trending-playlists"
                    className="text-2xl font-bold text-white hover:underline transition-colors cursor-pointer"
                  >
                    Trending Playlists
                  </Link>
                </div>
                <Link
                  to="/trending-playlists"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-semibold"
                >
                  Show all
                </Link>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {trendingPlaylists.map((playlist, idx) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => navigate(`/public/playlist/${playlist._id}`)}
                    className="relative group cursor-pointer h-full"
                  >
                    <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors h-full flex flex-col group cursor-pointer">
                      {/* Cover Image */}
                      <div className="relative w-full aspect-square mb-4">
                        {playlist.firstSongCover ? (
                          <img
                            src={playlist.firstSongCover}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#333] rounded flex items-center justify-center">
                            <BiSolidPlaylist className="text-5xl text-gray-500" />
                          </div>
                        )}

                        {/* Play button overlay - Spotify Style */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-colors"
                          >
                            <FaPlay className="text-xl ml-1" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Info - Spotify Style */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-white truncate mb-1 group-hover:underline">
                          {playlist.name}
                        </h3>
                        {playlist.description ? (
                          <p className="text-xs text-gray-400 truncate">
                            {playlist.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            Playlist
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Genre-Based Playlists Section */}
          {genrePlaylists.length > 0 && !search && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Your Genre Mixes
                </h2>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 font-medium">
                  Personalized
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Curated playlists based on your favorite genres
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3">
                {genrePlaylists.map((playlist, idx) => (
                  <motion.div
                    key={playlist._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                    onClick={() => {
                      if (playlist.songs.length > 0) {
                        playSong(playlist.songs[0], 0, playlist.songs);
                        toast.success(`Playing ${playlist.name}!`);
                      }
                    }}
                    className="relative group cursor-pointer h-full"
                  >
                    <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors h-full flex flex-col group cursor-pointer">
                      {/* Cover Image */}
                      <div className="relative w-full aspect-square mb-4">
                        <img
                          src={playlist.firstSongCover}
                          alt={playlist.name}
                          className="w-full h-full object-cover rounded"
                          loading="lazy"
                          decoding="async"
                        />

                        {/* Play button overlay - Spotify Style */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-colors"
                          >
                            <FaPlay className="text-xl ml-1" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Info - Spotify Style */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-white truncate mb-1 group-hover:underline">
                          {playlist.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {playlist.description}
                        </p>
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
                  <Link
                    to="/for-you"
                    className="text-2xl font-bold text-white hover:underline transition-colors cursor-pointer"
                  >
                    {isPersonalized ? "Made For You" : "Popular Picks"}
                  </Link>
                  {isPersonalized && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300 font-medium">
                      Personalized
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/for-you"
                    className="text-sm text-gray-400 hover:text-white transition-colors font-semibold"
                  >
                    Show all
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {forYouSongs.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={forYouSongs}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/recently-played"
                    className="text-2xl font-bold text-white hover:underline transition-colors cursor-pointer"
                  >
                    Recently Played
                  </Link>
                </div>
                <Link
                  to="/recently-played"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-semibold"
                >
                  Show all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recentlyPlayed.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={recentlyPlayed}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/trending"
                    className="text-2xl font-bold text-white hover:underline transition-colors cursor-pointer"
                  >
                    Trending Now
                  </Link>
                </div>
                <Link
                  to="/trending"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-semibold"
                >
                  Show all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {trendingSongs.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={trendingSongs}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/new-releases"
                    className="text-2xl font-bold text-white hover:underline transition-colors cursor-pointer"
                  >
                    New Releases
                  </Link>
                </div>
                <Link
                  to="/new-releases"
                  className="text-sm text-gray-400 hover:text-white transition-colors font-semibold"
                >
                  Show all
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {newReleases.map((song, idx) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={idx}
                    songs={newReleases}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
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
              <h2 className="text-2xl font-bold text-white mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {searchResults.map((song, index) => (
                  <SongCard
                    key={song._id}
                    song={song}
                    index={index}
                    songs={searchResults}
                    currentSongId={currentSong?._id}
                    isCurrentPlaying={isPlaying}
                    onPlay={playSong}
                    onPause={pauseSong}
                  />
                ))}
              </div>
              {searchResults.length === 0 && (
                <div className="text-center py-12">
                  <FaMusic className="text-6xl text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-white mb-2">
                    No songs found matching "{search}"
                  </p>
                  <p className="text-sm text-gray-400">
                    Try searching for a different song, artist, or genre
                  </p>
                </div>
              )}
            </motion.section>
          )}
        </>
      )}

      {/* Add to Playlist Drawer */}
      <AnimatePresence>
        {playlistModal.open && (
            <AddToPlaylistModal
              songId={playlistModal.songId}
            onClose={closePlaylistModal}
            />
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomeContent;
