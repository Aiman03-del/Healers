import { useEffect, useState, memo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAudio } from "../context/AudioContext";
import { Pause, Play, ListMusic } from "lucide-react";
import { FaStar } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import useAxios from "../hooks/useAxios";
import { AddToPlaylistModal } from "../components/features/playlists";
import { avatarFromEmail } from "../utils/avatarFromEmail";

// SongCard Component - Memoized to prevent unnecessary re-renders
const SongCard = memo(
  ({ song, index, songs: songList, currentSongId, isCurrentPlaying, onPlay, onPause }) => {
    const isCurrent = currentSongId === song._id;
    const shouldPrioritize = index === 0;
    const shouldEagerLoad = index < 2;

    const handleCardClick = () => {
      if (isCurrent && isCurrentPlaying) {
        onPause();
      } else {
        onPlay(song, index, songList);
      }
    };

    return (
      <div
        key={song._id}
        className="relative group cursor-pointer animate-fade-slide"
        onClick={handleCardClick}
      >
        <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group">
          {/* Album Cover */}
          <div className="relative w-full aspect-square mb-4">
            <img
              src={song.cover || "/healers.png"}
              alt={song.title}
              className="w-full h-full object-cover rounded bg-[#1a1a1a]"
              loading={shouldEagerLoad ? "eager" : "lazy"}
              fetchPriority={shouldPrioritize ? "high" : "auto"}
              decoding="async"
              width={320}
              height={320}
              onError={(e) => {
                e.target.src = "/healers.png";
                e.target.onerror = null;
              }}
            />
            
            {/* Play/Pause button overlay - Spotify Style */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-transform duration-150 ease-out pointer-events-auto group-hover:scale-105 active:scale-95"
              >
                {isCurrent && isCurrentPlaying ? (
                  <Pause className="w-5 h-5" strokeWidth={2.2} />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" strokeWidth={2.2} />
                )}
              </button>
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
      </div>
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
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const extractReviewerName = (review) =>
    review?.user?.name || review?.name || review?.author || review?.email || "Anonymous listener";

  const formatReviewDate = (value) => {
    if (!value) return "Just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

const renderRatingStars = (value, sizeClass = "text-xs") => {
    const rating = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
    return Array.from({ length: 5 }, (_, idx) => (
      <FaStar
        key={idx}
      className={`${sizeClass} ${idx < rating ? "text-yellow-400" : "text-gray-600"}`}
      />
    ));
  };

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
  }, [user, get, songs]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await get("/api/reviews?limit=6").catch(() => ({
          data: { reviews: [] },
        }));
        const incoming = Array.isArray(res.data?.reviews) ? res.data.reviews : [];
        setReviews(incoming);
      } catch (error) {
        console.error("Failed to load reviews:", error);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();
  }, [get]);

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

  // Play random song
  const playRandomSong = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    playSong(songs[randomIndex], randomIndex, songs);
    toast.success("Playing random song!");
  };

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

          {/* Skeleton for Reviews */}
          <div className="space-y-4">
            <div className="h-8 w-56 bg-gray-800 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#181818] rounded-2xl p-4 sm:p-5 animate-pulse">
                  <div className="h-4 w-1/3 bg-gray-700 rounded mb-3" />
                  <div className="h-3 w-2/3 bg-gray-700 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-5/6 bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Trending Public Playlists Section */}
          {trendingPlaylists.length > 0 && (
            <section className="animate-fade-slide">
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
                  <div
                    key={playlist._id}
                    onClick={() => navigate(`/public/playlist/${playlist._id}`)}
                    className="relative group cursor-pointer h-full animate-fade-slide"
                    style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}
                  >
                    <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors h-full flex flex-col group cursor-pointer">
                      {/* Cover Image */}
                      <div className="relative w-full aspect-square mb-4">
                        {playlist.firstSongCover ? (
                          <img
                            src={playlist.firstSongCover}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded bg-[#1a1a1a]"
                            loading={idx < 2 ? "eager" : "lazy"}
                            fetchPriority={idx === 0 ? "high" : "auto"}
                            decoding="async"
                            width={320}
                            height={320}
                            onError={(e) => {
                              e.target.src = "/healers.png";
                              e.target.onerror = null;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#333] rounded flex items-center justify-center">
                            <ListMusic className="w-12 h-12 text-gray-500" strokeWidth={1.7} />
                          </div>
                        )}

                        {/* Play button overlay - Spotify Style */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button
                            className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-transform duration-150 ease-out pointer-events-auto group-hover:scale-105 active:scale-95"
                          >
                            <Play className="w-5 h-5 ml-0.5" strokeWidth={2.2} />
                          </button>
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
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Genre-Based Playlists Section */}
          {genrePlaylists.length > 0 && (
            <section className="animate-fade-slide">
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
                  <div
                    key={playlist._id}
                    className="relative group cursor-pointer h-full animate-fade-slide"
                    style={{ animationDelay: `${Math.min(idx * 0.02, 0.3)}s` }}
                    onClick={() => {
                      if (playlist.songs.length > 0) {
                        playSong(playlist.songs[0], 0, playlist.songs);
                        toast.success(`Playing ${playlist.name}!`);
                      }
                    }}
                  >
                    <div className="relative bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors h-full flex flex-col group cursor-pointer">
                      {/* Cover Image */}
                      <div className="relative w-full aspect-square mb-4">
                        <img
                          src={playlist.firstSongCover}
                          alt={playlist.name}
                          className="w-full h-full object-cover rounded bg-[#1a1a1a]"
                          loading={idx < 2 ? "eager" : "lazy"}
                          fetchPriority={idx === 0 ? "high" : "auto"}
                          decoding="async"
                          width={320}
                          height={320}
                          onError={(e) => {
                            e.target.src = "/healers.png";
                            e.target.onerror = null;
                          }}
                        />

                        {/* Play button overlay - Spotify Style */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <button
                            className="w-14 h-14 rounded-full bg-[#1db954] text-black flex items-center justify-center shadow-2xl hover:bg-[#1ed760] transition-transform duration-150 ease-out pointer-events-auto group-hover:scale-105 active:scale-95"
                          >
                            <Play className="w-5 h-5 ml-0.5" strokeWidth={2.2} />
                          </button>
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
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* For You Section (Personalized Recommendations) */}
          {forYouSongs.length > 0 && (
            <section className="animate-fade-slide">
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
            </section>
          )}

          {/* Recently Played Section */}
          {recentlyPlayed.length > 0 && (
            <section className="animate-fade-slide" style={{ animationDelay: "0.05s" }}>
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
            </section>
          )}

          {/* Trending Section */}
          {trendingSongs.length > 0 && (
            <section className="animate-fade-slide" style={{ animationDelay: "0.1s" }}>
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
            </section>
          )}

          {/* New Releases Section */}
          {newReleases.length > 0 && (
            <section className="animate-fade-slide" style={{ animationDelay: "0.15s" }}>
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
            </section>
          )}

          {/* Community Feedback Section */}
          <section className="animate-fade-slide" style={{ animationDelay: "0.2s" }}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Community Voices</h2>
                <p className="text-sm text-gray-400 mt-1">
                  What listeners are saying about Healers
                </p>
              </div>
              <Link
                to="/feedback"
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition"
              >
                Share your feedback
              </Link>
            </div>

            {reviewsLoading ? (
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-6 text-sm text-gray-400">
                Gathering the latest reviews...
              </div>
            ) : reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reviews.map((review, idx) => {
                  const reviewerName = extractReviewerName(review);
                  const reviewDate = formatReviewDate(review?.createdAt || review?.updatedAt || review?.date);
                    const comment = review?.comment || review?.feedback || review?.message || "";
                  const rating = review?.rating ?? review?.stars ?? review?.score ?? 0;
                  const ratingValue = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
                  const reviewer = review?.user || {};
                  const reviewerEmail = reviewer.email || review.userEmail || "";
                  const avatarUrl = reviewer.image || avatarFromEmail(reviewerEmail) || "/healers.png";

                  return (
                    <article
                      key={review?._id || review?.id || idx}
                      className="bg-[#181818] border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1f1f1f] border border-gray-800 flex-shrink-0">
                            <img
                              src={avatarUrl}
                              alt={reviewerName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/healers.png";
                                e.target.onerror = null;
                              }}
                              loading={idx < 3 ? "eager" : "lazy"}
                              decoding="async"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white truncate max-w-[10rem] sm:max-w-[14rem]">
                              {reviewerName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{reviewDate}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            {renderRatingStars(rating, "text-sm sm:text-base")}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {ratingValue}/5
                          </span>
                        </div>
                      </div>
                      {comment && (
                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line max-h-32 overflow-hidden">
                          {comment}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#181818] border border-gray-800 rounded-2xl p-6 text-sm text-gray-400">
                No feedback yet. Be the first to share your thoughts!
              </div>
            )}
          </section>
 
        </>
      )}

      {/* Add to Playlist Drawer */}
      {playlistModal.open && (
        <AddToPlaylistModal songId={playlistModal.songId} onClose={closePlaylistModal} />
      )}
    </div>
  );
}

export default HomeContent;
