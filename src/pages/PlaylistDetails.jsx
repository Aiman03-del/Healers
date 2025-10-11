import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAudio } from '../context/AudioContext';
import axios from 'axios';
import { FaPlay, FaRandom, FaDownload, FaShareAlt, FaTrashAlt, FaPause, FaRegSadTear, FaCheckCircle, FaArrowLeft, FaChevronLeft, FaPlus } from 'react-icons/fa';
import { MdPlaylistPlay } from 'react-icons/md';
import { BiSolidPlaylist } from "react-icons/bi";
import { toast } from 'react-hot-toast';
import { AddSongToPlaylistModal, SharePlaylistModal } from '../components/features/playlists';
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart } from "react-icons/fa";
import { useAuth } from '../context/AuthContext';
import useAxios from "../hooks/useAxios";
import { MainLayout } from '../components/layout';

export const PlaylistDetails = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playQueue, playShuffledPlaylist, currentSong, isPlaying, pauseSong, togglePlayPause, playSong } = useAudio();
  const [copied, setCopied] = useState(false);
  const [addingSongId, setAddingSongId] = useState(null); // For loading state
  const [showAddModal, setShowAddModal] = useState(false); // modal state
  const [showShareModal, setShowShareModal] = useState(false); // share modal state
  const { user } = useAuth();
  const [likedSongIds, setLikedSongIds] = useState([]); // Local liked state
  const [likeEffectId, setLikeEffectId] = useState(null); // For animation
  const { get, put, post } = useAxios(); // 🆕

  // Use window.__theme or fallback to "dark"
  const theme = typeof window !== "undefined" ? window.__theme || "dark" : "dark";

  // Fetch playlist details
  useEffect(() => {
    get(`/api/playlists/${playlistId}`)
      .then(res => {
        setPlaylist(res.data);
        setLoading(false);
      });
  }, [playlistId]);

  // Fetch liked songs for user
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

  // Remove song from playlist
  const handleRemove = async (songId) => {
    toast(
      (t) => (
        <span className="flex items-center gap-2">

          Are you sure you want to remove this song?
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await put(`/api/playlists/${playlistId}/remove`, { songId });
                setPlaylist((prev) => ({
                  ...prev,
                  songs: prev.songs.filter((s) => s._id !== songId),
                }));
                toast(<span className="flex items-center gap-2"><FaCheckCircle className="text-green-500" />Removed!</span>);
              } catch {
                toast.error(<span className="flex items-center gap-2"><FaRegSadTear className="text-red-400" />Not authorized!</span>);
              }
            }}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
            No
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  // Play all songs (queue) and increment playCount
  const handlePlayAll = async () => {
    if (playlist?.songs?.length) {
      await put(`/api/playlists/${playlist._id}/increment-play`);
      playQueue(playlist.songs);
      playSong(playlist.songs[0]); // প্রথম গানটি প্লে করুন
    }
  };

  // Download playlist as JSON
  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playlist, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${playlist.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Play/pause single song (now uses playSong for AudioPlayer integration)
  const handlePlaySong = (song) => {
    if (currentSong && (currentSong._id === song._id || currentSong.id === song._id)) {
      if (isPlaying) {
        pauseSong();
      } else {
        togglePlayPause();
      }
    } else {
      playSong(song); // This will play in AudioPlayer context
    }
  };

  // Share playlist - Open share modal
  const handleShare = () => {
    setShowShareModal(true);
  };

  // Add song to this playlist
  const handleAddSong = async (songId) => {
    setAddingSongId(songId);
    try {
      const res = await put(`/api/playlists/${playlist._id}/add`, { songId });
      if (res.data.message === "Already added") {
        toast.error("Song already in playlist");
      } else {
        toast.success("Added to playlist");
        // Optionally update UI if needed
        setPlaylist((prev) => ({
          ...prev,
          songs: [...prev.songs, prev.songs.find(s => s._id === songId) || {}], // or refetch
        }));
      }
    } catch {
      toast.error("Failed to add song");
    }
    setAddingSongId(null);
  };

  // Helper: Get or create "Liked Songs" playlist for user
  const getOrCreateLikedPlaylist = async () => {
    // 1. Check if "Liked Songs" playlist exists
    const res = await get(`/api/playlists/user/${user.uid}`);
    let liked = res.data.find(pl => pl.name === "Liked Songs");
    if (!liked) {
      // Create if not exists
      const createRes = await post("/api/playlists", {
        name: "Liked Songs",
        description: "Your liked songs",
        userId: user.uid,
      });
      liked = { _id: createRes.data.id };
    }
    return liked._id;
  };

  // Like/Unlike a song: add/remove from Liked Songs playlist
  const handleLikeSong = async (songId) => {
    setLikeEffectId(songId);
    try {
      const likedPlaylistId = await getOrCreateLikedPlaylist();
      if (likedSongIds.includes(songId)) {
        // Unlike: remove from playlist
        await put(
          `/api/playlists/${likedPlaylistId}/remove`,
          { songId }
        );
        setLikedSongIds(prev => prev.filter(id => id !== songId));
        toast.success("Removed from Liked Songs");
      } else {
        // Like: add to playlist
        await put(
          `/api/playlists/${likedPlaylistId}/add`,
          { songId }
        );
        setLikedSongIds(prev => [...prev, songId]);
        toast.success("Added to Liked Songs");
      }
    } catch {
      toast.error("Failed to update like");
    }
    setTimeout(() => setLikeEffectId(null), 800);
  };

  // Helper for dynamic classes
  const bgCard =
    theme === "light"
      ? "bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100"
      : "bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800";
  const bgInner =
    theme === "light"
      ? "bg-white/70"
      : "bg-white/10";
  const textMain =
    theme === "light"
      ? "text-gray-900"
      : "text-white";
  const textSub =
    theme === "light"
      ? "text-purple-700"
      : "text-purple-200";
  const borderCard =
    theme === "light"
      ? "border border-purple-200"
      : "border-4 border-purple-700";
  const shadowCard =
    theme === "light"
      ? "shadow-xl"
      : "shadow-xl";

  if (loading) return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="animate-pulse bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-xl bg-gray-700" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-1/2 bg-gray-700 rounded" />
            <div className="h-4 w-1/3 bg-gray-800 rounded" />
            <div className="h-4 w-1/4 bg-gray-800 rounded" />
            <div className="flex gap-2 mt-2">
              <div className="w-10 h-10 rounded-full bg-gray-700" />
              <div className="w-10 h-10 rounded-full bg-gray-700" />
              <div className="w-10 h-10 rounded-full bg-gray-700" />
            </div>
          </div>
        </div>
        <div className="bg-white/10 rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-16 rounded-lg bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-gray-700 rounded" />
                  <div className="h-3 w-1/3 bg-gray-800 rounded" />
                  <div className="h-3 w-1/4 bg-gray-800 rounded" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
  if (!playlist) return (
    <MainLayout>
      <div className="text-center text-red-400 py-10">Playlist not found</div>
    </MainLayout>
  );

  // Helper: Is playlist currently playing?
  const isPlaylistPlaying = playlist?.songs?.length > 0 &&
    currentSong &&
    playlist.songs.some(s => s._id === currentSong._id || s.id === currentSong._id) &&
    isPlaying;

  // Play/pause playlist
  const handlePlayAllToggle = async () => {
    if (isPlaylistPlaying) {
      pauseSong();
    } else if (playlist?.songs?.length) {
      await put(`/api/playlists/${playlist._id}/increment-play`);
      playQueue(playlist.songs);
      playSong(playlist.songs[0]);
    }
  };

  return (
    <MainLayout>
      <div className={`max-w-3xl mx-auto py-10 px-4`}>
        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          className={`mb-6 flex items-center gap-2 px-4 py-2 rounded-lg ${
            theme === "light"
              ? "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200"
              : "bg-gradient-to-r from-purple-900/50 to-fuchsia-900/50 text-purple-200 hover:from-purple-800/60 hover:to-fuchsia-800/60"
          } backdrop-blur-sm shadow-lg hover:shadow-xl transition-all border ${
            theme === "light" ? "border-purple-200" : "border-purple-700/40"
          }`}
        >
          <FaChevronLeft className="text-lg" />
          <span className="font-semibold">Back</span>
        </motion.button>

        {/* Playlist Info Card */}
        <div className={`${bgCard} ${shadowCard} ${borderCard} rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 transition-all`}>
        <div className="flex-shrink-0 flex flex-col items-center">
          <div className={`w-32 h-32 rounded-xl overflow-hidden shadow-lg ${borderCard} bg-gray-700 flex items-center justify-center`}>
            {/* Playlist Cover: first song cover or fallback */}
            {playlist.songs?.[0]?.cover ? (
              <img src={playlist.songs[0].cover} alt="cover" className="w-full h-full object-cover" />
            ) : (
              <MdPlaylistPlay className={`text-6xl ${theme === "light" ? "text-purple-400" : "text-purple-300"}`} />
            )}
          </div>
          <div className={`mt-4 text-xs ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
            {playlist.songs?.length || 0} Song{playlist.songs?.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="flex-1">
          <h1 className={`text-3xl font-bold mb-2 ${textMain}`}>{playlist.name}</h1>
          {playlist.description && (
            <p className={`mb-3 ${theme === "light" ? "text-gray-700" : "text-gray-300"}`}>{playlist.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`bg-purple-200 text-xs px-2 py-1 rounded ${theme === "light" ? "text-purple-800" : "bg-purple-700 text-white"}`}>
              Created: {playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'N/A'}
            </span>
            <span className={`bg-pink-200 text-xs px-2 py-1 rounded ${theme === "light" ? "text-pink-800" : "bg-pink-700 text-white"}`}>
              Played: {playlist.playCount || 0} times
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={handlePlayAllToggle}
              className={`px-4 py-2 rounded font-semibold ${textMain} shadow flex items-center justify-center text-xl bg-transparent backdrop-blur-sm hover:bg-purple-700/30`}
              aria-label={isPlaylistPlaying ? "Pause All" : "Play All"}
            >
              {isPlaylistPlaying ? <FaPause /> : <FaPlay />}
            </button>
            <button
              onClick={() => playShuffledPlaylist(playlist.songs)}
              className={`px-4 py-2 rounded font-semibold ${textMain} shadow flex items-center justify-center text-xl bg-transparent backdrop-blur-sm hover:bg-pink-700/30`}
              aria-label="Shuffle Play"
            >
              <FaRandom />
            </button>
            <button
              onClick={handleDownload}
              className={`px-4 py-2 rounded ${textMain} font-semibold shadow flex items-center justify-center text-xl bg-transparent backdrop-blur-sm hover:bg-blue-700/30`}
              aria-label="Download JSON"
            >
              <FaDownload />
            </button>
            <button
              onClick={handleShare}
              className={`px-4 py-2 rounded font-semibold shadow flex items-center justify-center text-xl bg-transparent backdrop-blur-sm hover:bg-yellow-600/30`}
              aria-label="Copy Share Link"
            >
              <FaShareAlt />
            </button>
          </div>
        </div>
      </div>
      {/* Song List */}
      <div className={`${bgInner} rounded-xl shadow-lg p-6`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className={`text-xl font-bold ${textSub} flex items-center gap-2`}>
            <MdPlaylistPlay className="text-2xl" /> Songs in Playlist
            {playlist.songs && playlist.songs.length > 0 && (
              <span className="text-sm font-normal opacity-70">
                ({playlist.songs.length})
              </span>
            )}
          </h2>
          
          {/* Add Song Button - Always visible */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all ${
              theme === "light"
                ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
                : "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white"
            }`}
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Song</span>
            <span className="sm:hidden">Add</span>
          </motion.button>
        </div>
        
        {(!playlist.songs || playlist.songs.length === 0) ? (
          <div className="text-center py-12">
            <FaMusic className="text-6xl text-purple-400/50 mx-auto mb-4" />
            <p className={`text-lg font-semibold mb-2 ${textMain}`}>No songs yet</p>
            <p className={`${theme === "light" ? "text-gray-500" : "text-gray-400"}`}>
              Click the "Add Song" button above to get started!
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {playlist.songs.map((song, idx) => {
              const isCurrent = currentSong && (currentSong._id === song._id || currentSong.id === song._id);
              const isLiked = likedSongIds.includes(song._id);
              return (
                <li
                  key={song._id}
                  className={`flex items-center gap-4 ${theme === "light"
                    ? "bg-gradient-to-r from-purple-100/60 to-blue-100/40"
                    : "bg-gradient-to-r from-purple-800/30 to-gray-900/60"
                  } rounded-lg p-4 hover:shadow-xl transition ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 group">
                    <img
                      src={song.cover}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePlaySong(song)}
                      className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent && isPlaying ? 'opacity-100' : ''}`}
                      aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
                    >
                      {isCurrent && isPlaying ? (
                        <FaPause className="text-white text-2xl" />
                      ) : (
                        <FaPlay className="text-white text-2xl" />
                      )}
                    </button>
                    {/* ❤️ Like Button Overlay */}
                    <div className="absolute bottom-1 right-1">
                      <motion.button
                        whileTap={{ scale: 1.3 }}
                        className={`rounded-full p-1 bg-white/80 hover:bg-pink-200 shadow ${isLiked ? "text-pink-600" : "text-gray-400"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSong(song._id);
                        }}
                        aria-label={isLiked ? "Unlike" : "Like"}
                        style={{ outline: "none", border: "none" }}
                      >
                        <FaHeart />
                        {/* Water splash effect */}
                        <AnimatePresence>
                          {likeEffectId === song._id && (
                            <motion.span
                              className="absolute"
                              initial={{ scale: 0, opacity: 0.7 }}
                              animate={{
                                scale: [0, 1.5, 1.2],
                                opacity: [0.7, 0.5, 0],
                              }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                              style={{
                                left: -8,
                                top: -8,
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: "radial-gradient(circle, #f472b6 40%, transparent 70%)",
                                pointerEvents: "none",
                                zIndex: 10,
                              }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${textMain}`}>{song.title}</div>
                    <div className={`text-sm truncate ${textSub}`}>{song.artist}</div>
                    <div className={`text-xs mt-1 ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}>
                      Duration: <span className="font-semibold">{song.duration}s</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRemove(song._id)}
                      className="px-3 py-1 rounded text-white font-semibold text-lg flex items-center justify-center bg-transparent backdrop-blur-sm hover:bg-red-700/30"
                      aria-label="Remove"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>

      {/* Add Song Modal - Rendered once outside the song list */}
      <AnimatePresence>
        {showAddModal && (
          <AddSongToPlaylistModal
            playlistId={playlist._id}
            onClose={() => setShowAddModal(false)}
            onSongAdded={() => {
              // Refresh playlist data
              get(`/api/playlists/${playlistId}`)
                .then(res => {
                  setPlaylist(res.data);
                });
            }}
          />
        )}
      </AnimatePresence>

      {/* Share Playlist Modal */}
      <AnimatePresence>
        {showShareModal && (
          <SharePlaylistModal
            playlist={playlist}
            onClose={() => setShowShareModal(false)}
            onUpdate={() => {
              // Refresh playlist data
              get(`/api/playlists/${playlistId}`)
                .then(res => {
                  setPlaylist(res.data);
                });
            }}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default PlaylistDetails;
