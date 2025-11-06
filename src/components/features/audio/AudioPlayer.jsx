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
    if (!user?.uid) {
      toast.error("Please login to like songs");
      return;
    }
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
      {/* Main draggable/swipeable player - Spotify Style */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-[#121212] text-white px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-2.5 sm:py-3 shadow-2xl z-50 border-t border-gray-800 transition-all"
        drag={isMobile && !expanded ? "y" : "x"}
        dragConstraints={isMobile && !expanded ? { top: -80, bottom: 0 } : { left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        dragDirectionLock
        dragSnapToOrigin
        style={{ touchAction: "pan-y" }}
        onClick={handlePlayerClick}
      >
        <div className="flex flex-col gap-2 xs:gap-2.5 sm:gap-3 max-w-7xl mx-auto w-full">
          {/* Top Row: Song Info + Controls + Volume */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Song Info + Like */}
            <div className="flex items-center justify-between w-full md:w-auto gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 min-w-0 md:min-w-[200px] lg:min-w-[280px]">
              <div className="flex items-center min-w-0 gap-2 xs:gap-2.5 sm:gap-3 flex-1">
                {/* Album Cover - Spotify Style */}
                <div className="relative group flex-shrink-0">
                  <img
                    src={currentSong.cover}
                    alt="cover"
                    className="w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded object-cover relative z-10 shadow-lg"
                    loading="eager"
                  />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 xs:gap-2">
                    <p className="font-semibold text-xs xs:text-sm sm:text-base text-white hover:underline cursor-pointer truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[260px]">
                      {currentSong.title}
                    </p>
                    {/* ❤️ Like Button - Next to Song Name */}
                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className={`rounded-full p-0.5 xs:p-1 transition-all flex-shrink-0 ${
                        isLiked
                          ? "text-green-500 hover:text-green-400"
                          : "text-gray-400 hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikeSong(currentSong._id);
                      }}
                      aria-label={isLiked ? "Unlike" : "Like"}
                    >
                      <FaHeart className={`text-[10px] xs:text-xs sm:text-sm ${isLiked ? 'fill-current' : ''}`} />
                    </motion.button>
                  </div>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-gray-400 hover:text-white hover:underline cursor-pointer truncate max-w-[100px] xs:max-w-[120px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[280px]">
                    {currentSong.artist}
                  </p>
                </div>
              </div>
            </div>

            {/* Controls (center on desktop) */}
            <div className="flex flex-col gap-1.5 sm:gap-2 flex-1 w-full md:max-w-md lg:max-w-2xl xl:max-w-3xl">
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
                  className={`hidden xs:block rounded-full p-1.5 xs:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                    loopMode === 1
                      ? 'text-green-500'
                      : loopMode === 2
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-white'
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
                  className="rounded-full p-1.5 xs:p-2 sm:p-2.5 text-gray-400 hover:text-white transition-all"
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
                  className="rounded-full p-2.5 xs:p-3 sm:p-3.5 md:p-4 bg-white text-black hover:scale-105 transition-all shadow-lg"
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
                  className="rounded-full p-1.5 xs:p-2 sm:p-2.5 text-gray-400 hover:text-white transition-all"
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
                  className={`hidden xs:block rounded-full p-1.5 xs:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                    shuffle 
                      ? 'text-green-500' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  aria-label="Shuffle"
                >
                  <MdShuffle />
                </motion.button>

                {/* Add to Playlist - Always visible for logged-in users */}
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowModal(true);
                    }}
                    className="rounded-full p-1.5 xs:p-2 text-gray-400 hover:text-white transition-all"
                    aria-label="Add to Playlist"
                  >
                    <BiSolidPlaylist className="text-base sm:text-lg md:text-xl" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* 🔊 Volume (desktop only - lg and up) - Smaller width, thicker thumb */}
            <div className="hidden lg:flex items-center gap-2 w-16 xl:w-20 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  changeVolume(volume === 0 ? 0.5 : 0);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
              </motion.button>
              <div className="flex-1 relative group">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-0.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer group-hover:[&::-webkit-slider-thumb]:w-4 group-hover:[&::-webkit-slider-thumb]:h-4"
                  style={{
                    background: `linear-gradient(to right, #1db954 ${volume * 100}%, #535353 ${volume * 100}%)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom Row: Seekbar - Full Width, At Bottom */}
          <div className="flex items-center gap-1.5 xs:gap-2 w-full">
            <span className="text-[10px] xs:text-xs font-medium text-gray-400 w-8 xs:w-9 sm:w-10 text-right flex-shrink-0">
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
                className="w-full h-1 xs:h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all group-hover:[&::-webkit-slider-thumb]:w-3 group-hover:[&::-webkit-slider-thumb]:h-3 xs:group-hover:[&::-webkit-slider-thumb]:w-3.5 xs:group-hover:[&::-webkit-slider-thumb]:h-3.5"
                style={{
                  background: `linear-gradient(to right, #1db954 ${progress}%, #535353 ${progress}%)`,
                }}
              />
            </div>
            <span className="text-[10px] xs:text-xs font-medium text-gray-400 w-8 xs:w-9 sm:w-10 flex-shrink-0">
              {formatTime(duration)}
            </span>
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
