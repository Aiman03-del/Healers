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
  const { get, put, post } = useAxios();

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
      playSong(playlist.songs[0]); // Play the first song
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

  // Spotify-style: Remove theme-based classes, use consistent dark theme

  if (loading) return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10 px-4 bg-[#121212] min-h-screen">
        <div className="animate-pulse bg-[#181818] rounded-lg p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded bg-[#282828]" />
          <div className="flex-1 space-y-4">
            <div className="h-8 w-1/2 bg-[#282828] rounded" />
            <div className="h-4 w-1/3 bg-[#282828] rounded" />
            <div className="h-4 w-1/4 bg-[#282828] rounded" />
            <div className="flex gap-2 mt-2">
              <div className="w-12 h-12 rounded-full bg-[#282828]" />
              <div className="w-12 h-12 rounded-full bg-[#282828]" />
              <div className="w-12 h-12 rounded-full bg-[#282828]" />
            </div>
          </div>
        </div>
        <div className="bg-[#181818] rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-16 h-16 rounded bg-[#282828]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 bg-[#282828] rounded" />
                  <div className="h-3 w-1/3 bg-[#282828] rounded" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[#282828]" />
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
      <div className="max-w-6xl mx-auto py-10 px-4 bg-[#121212] min-h-screen">
        {/* Back Button - Spotify Style */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <FaChevronLeft className="text-lg" />
          <span className="font-semibold">Back</span>
        </button>

        {/* Playlist Info Card - Spotify Style */}
        <div className="bg-gradient-to-b from-[#1db954]/20 via-transparent to-transparent rounded-lg p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-lg overflow-hidden shadow-2xl bg-[#282828] flex items-center justify-center">
              {/* Playlist Cover: first song cover or fallback */}
              {playlist.songs?.[0]?.cover ? (
                <img src={playlist.songs[0].cover} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <MdPlaylistPlay className="text-6xl md:text-7xl text-gray-400" />
              )}
            </div>
            <div className="mt-4 text-xs text-gray-400">
              {playlist.songs?.length || 0} Song{playlist.songs?.length === 1 ? '' : 's'}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">{playlist.name}</h1>
            {playlist.description && (
              <p className="mb-4 text-gray-400 text-sm md:text-base">{playlist.description}</p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4 text-xs md:text-sm">
              <span className="text-gray-400">
                Created: {playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : 'N/A'}
              </span>
              <span className="text-gray-400">
                • Played: {playlist.playCount || 0} times
              </span>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={handlePlayAllToggle}
                className="px-6 py-3 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-white font-bold flex items-center justify-center gap-2 transition-colors hover:scale-105"
                aria-label={isPlaylistPlaying ? "Pause All" : "Play All"}
              >
                {isPlaylistPlaying ? <FaPause /> : <FaPlay />}
                <span>{isPlaylistPlaying ? "Pause" : "Play"}</span>
              </button>
              <button
                onClick={() => playShuffledPlaylist(playlist.songs)}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                aria-label="Shuffle Play"
              >
                <FaRandom />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                aria-label="Download JSON"
              >
                <FaDownload />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition-colors"
                aria-label="Copy Share Link"
              >
                <FaShareAlt />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
        {/* Song List - Spotify Style */}
        <div className="bg-[#181818] rounded-lg p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MdPlaylistPlay className="text-2xl text-gray-400" /> Songs in Playlist
              {playlist.songs && playlist.songs.length > 0 && (
                <span className="text-sm font-normal text-gray-400">
                  ({playlist.songs.length})
                </span>
              )}
            </h2>
            
            {/* Add Song Button - Spotify Style */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold hover:scale-105 transition-all"
            >
              <FaPlus />
              <span className="hidden sm:inline">Add Song</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        
          {(!playlist.songs || playlist.songs.length === 0) ? (
            <div className="text-center py-12">
              <MdPlaylistPlay className="text-6xl text-gray-600 mx-auto mb-4" />
              <p className="text-lg font-semibold mb-2 text-white">No songs yet</p>
              <p className="text-gray-400">
                Click the "Add Song" button above to get started!
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {playlist.songs.map((song, idx) => {
                const isCurrent = currentSong && (currentSong._id === song._id || currentSong.id === song._id);
                const isLiked = likedSongIds.includes(song._id);
                return (
                  <li
                    key={song._id}
                    className={`flex items-center gap-4 bg-[#181818] hover:bg-[#282828] rounded-lg p-3 transition-colors group ${
                      isCurrent ? 'bg-[#282828]' : ''
                    }`}
                  >
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-[#282828] flex-shrink-0">
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handlePlaySong(song)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={isCurrent && isPlaying ? "Pause" : "Play"}
                      >
                        {isCurrent && isPlaying ? (
                          <FaPause className="text-white text-lg" />
                        ) : (
                          <FaPlay className="text-white text-lg" />
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate text-white flex items-center gap-2">
                          {song.title}
                          {isLiked && (
                            <FaHeart className="text-[#1db954] text-sm flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-sm truncate text-gray-400">{song.artist}</div>
                      </div>
                      {song.duration && (
                        <div className="text-xs text-gray-400 hidden sm:block">
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeSong(song._id);
                        }}
                        className={`p-2 rounded-full transition-colors ${
                          isLiked 
                            ? "text-[#1db954] hover:text-[#1ed760]" 
                            : "text-gray-400 hover:text-white"
                        }`}
                        aria-label={isLiked ? "Unlike" : "Like"}
                      >
                        <FaHeart className={isLiked ? "fill-current" : ""} />
                      </button>
                      <button
                        onClick={() => handleRemove(song._id)}
                        className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
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
