import { useAudio } from '../../../context/AudioContext';
import { FaPlay, FaPause, FaStepBackward, FaStepForward, FaFire } from 'react-icons/fa';
import { MdLoop, MdRepeatOne, MdShuffle } from 'react-icons/md';
import { BiSolidPlaylist } from "react-icons/bi";
import { useState, useEffect, useRef } from 'react';
import { AddToPlaylistModal } from '../playlists';
import { motion, AnimatePresence } from "framer-motion";
import { FaHeart } from "react-icons/fa";
import { useAuth } from '../../../context/AuthContext';
import toast from "react-hot-toast";
import { isMobile } from "react-device-detect";
import { apiService } from '../../../services';
import { PLAYLIST_NAMES, TOAST_MESSAGES } from '../../../constants';
import SongDetails from '../../../pages/SongDetails';

function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    togglePlayPause,
    volume,
    changeVolume,
    currentTime,
    duration,
    progress,
    seekTo,
    loop,
    setLoopMode, // <-- add this (see context update)
    loopMode,    // <-- add this (see context update)
    shuffle,
    toggleShuffle,
    playNext,
    playPrev,
  } = useAudio();

  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [likedSongIds, setLikedSongIds] = useState([]);
  const [likeEffectId, setLikeEffectId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const dragStartY = useRef(null);

  // Fetch liked songs for user
  useEffect(() => {
    const fetchLiked = async () => {
      if (!user?.uid) return;
      try {
        const res = await apiService.playlists.getByUser(user.uid);
        const liked = res.data.find(pl => pl.name === PLAYLIST_NAMES.LIKED_SONGS);
        if (liked && liked.songs) {
          setLikedSongIds(liked.songs.map(id => id.toString()));
        }
      } catch {
        setLikedSongIds([]);
      }
    };
    fetchLiked();
  }, [user, currentSong?._id]);

  // Helper: Get or create "Liked Songs" playlist for user
  const getOrCreateLikedPlaylist = async () => {
    const res = await apiService.playlists.getByUser(user.uid);
    let liked = res.data.find(pl => pl.name === PLAYLIST_NAMES.LIKED_SONGS);
    if (!liked) {
      const createRes = await apiService.playlists.create({
        name: PLAYLIST_NAMES.LIKED_SONGS,
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
        await apiService.playlists.removeSong(likedPlaylistId, songId);
        setLikedSongIds(prev => prev.filter(id => id !== songId));
        toast.success(TOAST_MESSAGES.LIKE_REMOVED);
      } else {
        // Like: add to playlist
        await apiService.playlists.addSong(likedPlaylistId, songId);
        setLikedSongIds(prev => [...prev, songId]);
        toast.success(TOAST_MESSAGES.LIKE_ADDED);
      }
    } catch {
      toast.error(TOAST_MESSAGES.LIKE_FAILED);
    }
    setTimeout(() => setLikeEffectId(null), 800);
  };

  // Handle swipe gestures
  const handleDragEnd = (event, info) => {
    const { offset, velocity } = info;
    // Horizontal swipe: left/right for next/prev
    if (Math.abs(offset.x) > 60 && Math.abs(offset.x) > Math.abs(offset.y)) {
      if (offset.x < 0) playNext();
      else playPrev();
    }
    // Vertical swipe: up to expand, down to minimize
    else if (offset.y < -60 && !expanded) {
      setExpanded(true);
    } else if (offset.y > 60 && expanded) {
      setExpanded(false);
    }
  };

  const handlePlayerClick = (e) => {
    // Prevent expand if a button or its child is clicked
    if (
      e.target.closest("button") ||
      e.target.closest("input") ||
      e.target.closest("a")
    ) {
      return;
    }
    if (!expanded) setExpanded(true);
  };

  // Loop button click handler
  const handleLoopClick = () => {
    // 0: no loop, 1: loop one, 2: loop all
    setLoopMode((prev) => (prev + 1) % 3);
  };

  if (!currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong._id);

  return (
    <>
      {/* Main draggable/swipeable player */}
      <motion.div
        className=" fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-purple-900 to-fuchsia-900 backdrop-blur-xl text-white px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-2.5 sm:py-3 shadow-2xl z-50 border-t border-purple-500/30 transition-all"
        drag={isMobile && !expanded ? "y" : "x"}
        dragConstraints={isMobile && !expanded ? { top: -80, bottom: 0 } : { left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        dragDirectionLock
        dragSnapToOrigin
        style={{ touchAction: "pan-y" }}
        onClick={handlePlayerClick}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-6 max-w-7xl mx-auto w-full">
          {/* Song Info + Like */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 min-w-0 md:min-w-[200px] lg:min-w-[280px]">
            <div className="flex items-center min-w-0 gap-2 xs:gap-2.5 sm:gap-3 flex-1">
              {/* Album Cover with glow */}
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-md sm:rounded-lg blur-sm sm:blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                <img
                  src={currentSong.cover}
                  alt="cover"
                  className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-md sm:rounded-lg object-cover relative z-10 shadow-xl border-2 border-purple-400/40"
                  loading="eager"
                />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs xs:text-sm sm:text-base text-white truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[280px]">
                  {currentSong.title}
                </p>
                <p className="text-[10px] xs:text-xs sm:text-sm text-purple-200 truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[280px]">
                  {currentSong.artist}
                </p>
              </div>
            </div>

            {/* ❤️ Like Button - Hidden on xs, visible from sm */}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={`hidden xs:flex rounded-full p-1.5 xs:p-2 shadow-lg transition-all flex-shrink-0 ${
                isLiked
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                  : "bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLikeSong(currentSong._id);
              }}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <FaHeart className="text-xs xs:text-sm sm:text-base" />
            </motion.button>
          </div>

          {/* Controls (center on desktop) */}
          <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 w-full md:max-w-md lg:max-w-2xl xl:max-w-3xl">
            {/* Seekbar */}
            <div className="flex items-center gap-1.5 xs:gap-2 w-full">
              <span className="text-[10px] xs:text-xs font-semibold text-purple-200 w-8 xs:w-9 sm:w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 relative group">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => seekTo(parseFloat(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 xs:h-1.5 bg-purple-900/60 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 xs:[&::-webkit-slider-thumb]:w-3 xs:[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all group-hover:[&::-webkit-slider-thumb]:w-3 group-hover:[&::-webkit-slider-thumb]:h-3 xs:group-hover:[&::-webkit-slider-thumb]:w-3.5 xs:group-hover:[&::-webkit-slider-thumb]:h-3.5"
                  style={{
                    background: `linear-gradient(to right, rgb(168, 85, 247) ${progress}%, rgba(88, 28, 135, 0.6) ${progress}%)`,
                  }}
                />
              </div>
              <span className="text-[10px] xs:text-xs font-semibold text-purple-200 w-8 xs:w-9 sm:w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3">
              {/* Loop - Hidden on xs */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoopClick();
                }}
                className={`hidden xs:block rounded-lg p-1.5 xs:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                  loopMode === 1
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg'
                    : loopMode === 2
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-white/10 text-purple-300 hover:bg-white/20'
                }`}
                aria-label="Loop"
              >
                {loopMode === 1 ? <MdRepeatOne /> : <MdLoop />}
              </motion.button>

              {/* Previous */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  playPrev();
                }}
                className="rounded-lg p-1.5 xs:p-2 sm:p-2.5 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all shadow-md"
                aria-label="Previous"
              >
                <FaStepBackward className="text-xs xs:text-sm sm:text-base md:text-lg" />
              </motion.button>

              {/* Play/Pause */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="rounded-full p-2.5 xs:p-3 sm:p-3.5 md:p-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-2xl hover:shadow-purple-500/50 transition-all"
              >
                {isPlaying ? (
                  <FaPause className="text-base xs:text-lg sm:text-xl md:text-2xl" />
                ) : (
                  <FaPlay className="text-base xs:text-lg sm:text-xl md:text-2xl ml-0.5" />
                )}
              </motion.button>

              {/* Next */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  playNext();
                }}
                className="rounded-lg p-1.5 xs:p-2 sm:p-2.5 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all shadow-md"
                aria-label="Next"
              >
                <FaStepForward className="text-xs xs:text-sm sm:text-base md:text-lg" />
              </motion.button>

              {/* Shuffle - Hidden on xs */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleShuffle();
                }}
                className={`hidden xs:block rounded-lg p-1.5 xs:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                  shuffle 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                    : 'bg-white/10 text-purple-300 hover:bg-white/20'
                }`}
                aria-label="Shuffle"
              >
                <MdShuffle />
              </motion.button>

              {/* Add to Playlist - Visible from md */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowModal(true);
                }}
                className="hidden md:block rounded-lg p-1.5 xs:p-2 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all shadow-md"
                aria-label="Add to Playlist"
              >
                <BiSolidPlaylist className="text-base sm:text-lg md:text-xl" />
              </motion.button>
            </div>
          </div>

          {/* 🔊 Volume (desktop only - lg and up) */}
          <div className="hidden lg:flex items-center gap-2 w-24 lg:w-28 xl:w-32 flex-shrink-0">
            <span className="text-sm lg:text-base">🔈</span>
            <div className="flex-1 relative">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1.5 bg-purple-900/60 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(168, 85, 247) ${volume * 100}%, rgba(88, 28, 135, 0.6) ${volume * 100}%)`,
                }}
              />
            </div>
            <span className="text-sm lg:text-base">🔊</span>
          </div>
        </div>
        {/* AddToPlaylistModal as drawer */}
        <AnimatePresence>
          {showModal && (
                <AddToPlaylistModal
                  songId={currentSong._id}
                  onClose={() => setShowModal(false)}
                />
          )}
        </AnimatePresence>
      </motion.div>
      {/* Song Details Page (Expanded View) */}
      <AnimatePresence>
        {expanded && (
          <SongDetails
            song={currentSong}
            onClose={() => setExpanded(false)}
            isLiked={isLiked}
            onLike={handleLikeSong}
            onAddToPlaylist={() => setShowModal(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default AudioPlayer;
