import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlay, FaPause, FaHeart, FaChevronDown, 
  FaStepBackward, FaStepForward, FaShareAlt 
} from 'react-icons/fa';
import { BiSolidPlaylist } from 'react-icons/bi';
import { MdLoop, MdRepeatOne, MdShuffle } from 'react-icons/md';
import { useAudio } from '../context/AudioContext';
import { AddToPlaylistModal } from '../components/features/playlists';
import toast from 'react-hot-toast';

export default function SongDetails({ 
  song, 
  onClose, 
  isLiked: initialLiked, 
  onLike, 
  onAddToPlaylist 
}) {
  const { 
    isPlaying, 
    togglePlayPause, 
    currentTime, 
    duration, 
    progress, 
    seekTo, 
    playNext, 
    playPrev, 
    loopMode, 
    toggleLoop, 
    shuffle, 
    toggleShuffle, 
    volume, 
    changeVolume 
  } = useAudio();

  const [isLiked, setIsLiked] = useState(initialLiked);
  const [showModal, setShowModal] = useState(false);

  if (!song) return null;

  const { _id: songId, title, artist, shareUrl } = song;

  const handleShare = async () => {
    const shareLink = shareUrl || `${window.location.origin}/songs/${songId ?? ''}`;
    const shareData = {
      title: `${title} • Healers`,
      text: `Listen to "${title}" by ${artist} on Healers.`,
      url: shareLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Thanks for sharing! 🎉');
        return;
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Sharing via Web Share API failed', error);
      } else {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
      toast.success('Song link copied to clipboard! 📋');
    } catch (clipboardError) {
      console.error('Failed to copy share link', clipboardError);
      toast.error('Unable to share right now');
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#121212] overflow-hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Subtle Background Gradient - Spotify Style */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1db954]/10 via-transparent to-transparent" />
      </div>

      {/* Main Content - Single Page Layout */}
      <div className="relative z-10 h-full flex flex-col px-2 xs:px-3 sm:px-4 md:px-6 py-2 xs:py-3 sm:py-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 px-2 xs:px-3 sm:px-4 py-1.5 xs:py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all shadow-lg"
          >
            <FaChevronDown className="text-xs xs:text-sm sm:text-base" />
            <span className="text-xs xs:text-sm font-semibold hidden xs:inline">Close</span>
          </motion.button>
          
          <div className="flex items-center gap-1 xs:gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-sm">
            <div className="w-1.5 xs:w-2 h-1.5 xs:h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-[10px] xs:text-xs font-semibold">Now Playing</span>
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden pb-2 xs:pb-3 sm:pb-4">
          <div className="w-full max-w-6xl flex justify-center items-center flex-1 px-2 xs:px-3 sm:px-4">
            
            {/* Album Cover - Centered */}
            <div className="flex justify-center w-full">
              <motion.div
                className="relative w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[280px] md:max-w-[320px] lg:max-w-sm aspect-square"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <img
                  src={song.cover}
                  alt={song.title}
                  className="relative z-10 w-full h-full rounded-xl xs:rounded-2xl sm:rounded-3xl object-cover shadow-2xl"
                />
                {isPlaying && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-1 xs:-right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#1db954] shadow-xl"
                  >
                    <div className="absolute inset-1.5 xs:inset-2 sm:inset-2.5 rounded-full bg-[#121212]" />
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Song Info + Playback Controls + Volume - Horizontal on Desktop, Vertical on Mobile */}
          <div className="w-full max-w-6xl flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 px-2 xs:px-3 sm:px-4 md:px-6 mb-2 xs:mb-2.5 sm:mb-3">
            {/* Song Info - Left on Desktop, Top on Mobile */}
            <div className="flex flex-col items-start sm:items-start text-left gap-1.5 xs:gap-2 order-1 sm:order-none flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 mb-0.5 xs:mb-1 w-full">
                <div className="flex items-center gap-1.5 xs:gap-2 flex-1 min-w-0">
                  <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight truncate">
                  {song.title}
                  </h2>
                  {/* ❤️ Like Button - Next to Song Name */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className={`rounded-full p-0.5 xs:p-1 sm:p-1.5 transition-all flex-shrink-0 ${
                      isLiked
                        ? "text-green-500 hover:text-green-400"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => {
                      onLike(song._id);
                      setIsLiked(!isLiked);
                    }}
                    aria-label={isLiked ? "Unlike" : "Like"}
                  >
                    <FaHeart className={`text-sm xs:text-base sm:text-lg md:text-xl ${isLiked ? 'fill-current' : ''}`} />
                  </motion.button>
                </div>
              </div>
              <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-400 hover:text-white hover:underline cursor-pointer truncate w-full">
                  {song.artist}
                </p>
                <div className="flex flex-wrap items-center justify-start gap-1 xs:gap-1.5 sm:gap-2 w-full">
                  {song.genre?.length > 0 &&
                    song.genre.map((g, i) => (
                      <span
                        key={i}
                        className="px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-0.5 xs:py-0.5 sm:py-1 rounded-full bg-gray-800 text-gray-300 text-[10px] xs:text-xs sm:text-sm font-medium border border-gray-700"
                      >
                        {g}
                      </span>
                    ))}
                  {/* Add to Playlist Icon - Next to Genres */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(true)}
                    className="rounded-full p-1 xs:p-1.5 sm:p-2 text-gray-400 hover:text-white transition-all"
                    aria-label="Add to Playlist"
                  >
                    <BiSolidPlaylist className="text-sm xs:text-base sm:text-lg md:text-xl" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="rounded-full p-1 xs:p-1.5 sm:p-2 text-gray-400 hover:text-white transition-all"
                    aria-label="Share Song"
                  >
                    <FaShareAlt className="text-sm xs:text-base sm:text-lg md:text-xl" />
                  </motion.button>
                </div>
            </div>

            {/* Playback Controls - Center on Desktop, Middle on Mobile */}
            <div className="flex items-center justify-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 order-2 sm:order-none w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleLoop}
                className={`rounded-full p-1.5 xs:p-1.5 sm:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                      loopMode === 1
                    ? 'text-green-500'
                        : loopMode === 2
                    ? 'text-green-500'
                    : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {loopMode === 1 ? <MdRepeatOne /> : <MdLoop />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={playPrev}
                className="rounded-full p-1.5 xs:p-2 sm:p-2.5 text-gray-400 hover:text-white transition-all"
                  >
                <FaStepBackward className="text-xs xs:text-sm sm:text-base" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlayPause}
                className="rounded-full p-2.5 xs:p-3 sm:p-3.5 md:p-4 bg-white text-black hover:scale-105 transition-all shadow-xl"
              >
                {isPlaying ? (
                  <FaPause className="text-base xs:text-lg sm:text-xl md:text-2xl" />
                ) : (
                  <FaPlay className="text-base xs:text-lg sm:text-xl md:text-2xl ml-0.5" />
                )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={playNext}
                className="rounded-full p-1.5 xs:p-2 sm:p-2.5 text-gray-400 hover:text-white transition-all"
                  >
                <FaStepForward className="text-xs xs:text-sm sm:text-base" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleShuffle}
                className={`rounded-full p-1.5 xs:p-1.5 sm:p-2 text-sm xs:text-base sm:text-lg transition-all ${
                      shuffle 
                    ? 'text-green-500' 
                    : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MdShuffle />
                  </motion.button>
                </div>

            {/* Volume Control - Right on Desktop, Bottom on Mobile */}
            <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 order-3 sm:order-none w-full sm:w-auto justify-center sm:justify-start">
                <motion.button
                whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                onClick={() => changeVolume(volume === 0 ? 0.5 : 0)}
                className="text-gray-400 hover:text-white transition-colors flex items-center"
                aria-label={volume === 0 ? "Unmute" : "Mute"}
              >
                {volume === 0 ? (
                  <svg className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 xs:w-4.5 sm:w-5 h-4 xs:h-4.5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                )}
                </motion.button>
              <div className="w-12 xs:w-14 sm:w-16 md:w-20 lg:w-24 relative group flex items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-full h-0.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer group-hover:[&::-webkit-slider-thumb]:w-3 xs:group-hover:[&::-webkit-slider-thumb]:w-3.5 sm:group-hover:[&::-webkit-slider-thumb]:w-4 group-hover:[&::-webkit-slider-thumb]:h-3 xs:group-hover:[&::-webkit-slider-thumb]:h-3.5 sm:group-hover:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:transition-all"
                  style={{
                    background: `linear-gradient(to right, #1db954 ${volume * 100}%, #535353 ${volume * 100}%)`,
                  }}
                />
              </div>
              <span className="text-[10px] xs:text-xs text-gray-400 w-6 xs:w-7 sm:w-8 md:w-10 text-right flex items-center">{Math.round(volume * 100)}%</span>
            </div>
          </div>

          {/* Bottom Row: Seekbar - Full Width, At Bottom */}
          <div className="w-full max-w-6xl flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 px-2 xs:px-3 sm:px-4 md:px-6">
            <span className="text-[10px] xs:text-xs font-medium text-gray-400 w-8 xs:w-9 sm:w-10 md:w-11 text-right flex-shrink-0">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative group">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => seekTo(parseFloat(e.target.value))}
                className="w-full h-0.5 xs:h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:h-0 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer group-hover:[&::-webkit-slider-thumb]:w-2.5 xs:group-hover:[&::-webkit-slider-thumb]:w-3 sm:group-hover:[&::-webkit-slider-thumb]:w-3.5 group-hover:[&::-webkit-slider-thumb]:h-2.5 xs:group-hover:[&::-webkit-slider-thumb]:h-3 sm:group-hover:[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:transition-all"
                style={{
                  background: `linear-gradient(to right, #1db954 ${progress}%, #535353 ${progress}%)`,
                }}
              />
            </div>
            <span className="text-[10px] xs:text-xs font-medium text-gray-400 w-8 xs:w-9 sm:w-10 md:w-11 flex-shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

      </div>

      {/* AddToPlaylistModal - Rendered with higher z-index */}
      <AnimatePresence>
        {showModal && (
          <AddToPlaylistModal
            songId={song._id}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
