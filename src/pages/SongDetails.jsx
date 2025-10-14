import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaPause, FaHeart, FaChevronDown, 
  FaStepBackward, FaStepForward 
} from 'react-icons/fa';
import { BiSolidPlaylist } from 'react-icons/bi';
import { MdLoop, MdRepeatOne, MdShuffle } from 'react-icons/md';
import { useAudio } from '../context/AudioContext';

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

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!song) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-purple-950 via-fuchsia-950 to-black overflow-hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 0] }} 
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }} 
          className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-500 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.3, 1, 1.3], rotate: [0, -180, 0] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }} 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500 rounded-full blur-3xl" 
        />
      </div>

      {/* Main Content - Single Page Layout */}
      <div className="relative z-10 h-full flex flex-col px-4 sm:px-6 py-4">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all shadow-lg"
          >
            <FaChevronDown />
            <span className="text-sm font-semibold">Close</span>
          </motion.button>
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-400/30 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-xs font-semibold">Now Playing</span>
          </div>
        </div>

        {/* Main Content Grid - Centered */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            
            {/* Left: Album Cover */}
            <div className="flex justify-center">
              <motion.div
                className="relative w-full max-w-sm aspect-square"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-3xl blur-3xl opacity-40" />
                <img
                  src={song.cover}
                  alt={song.title}
                  className="relative z-10 w-full h-full rounded-3xl object-cover shadow-2xl border-2 border-purple-400/30"
                />
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className={`absolute -top-3 -right-3 rounded-full p-3 shadow-2xl border-2 ${
                    isLiked
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 border-pink-300 text-white"
                      : "bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  }`}
                  onClick={() => {
                    onLike(song._id);
                    setIsLiked(!isLiked);
                  }}
                >
                  <FaHeart className="text-xl" />
                </motion.button>
                {isPlaying && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-purple-500 shadow-xl"
                  >
                    <div className="absolute inset-2.5 rounded-full bg-gray-900" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Right: Song Info + Controls */}
            <div className="space-y-4">
              
              {/* Title + Artist + Genres */}
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                  {song.title}
                </h1>
                <p className="text-xl sm:text-2xl text-purple-200 mb-3">
                  {song.artist}
                </p>
                {song.genre && song.genre.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {song.genre.map((g, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-purple-600/40 text-purple-100 text-sm font-semibold backdrop-blur-sm border border-purple-400/40"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume Control */}
              <div className="bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🎵</span>
                  <span className="text-white font-semibold text-sm">Volume Control</span>
                  <span className="ml-auto text-purple-300 text-sm font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔈</span>
                  <div className="flex-1 relative group">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => changeVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-400 [&::-webkit-slider-thumb]:to-fuchsia-400 [&::-webkit-slider-thumb]:shadow-lg group-hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                      style={{
                        background: `linear-gradient(to right, rgb(168, 85, 247) ${volume * 100}%, rgba(88, 28, 135, 0.5) ${volume * 100}%)`,
                      }}
                    />
                  </div>
                  <span className="text-xl">🔊</span>
                </div>
              </div>

              {/* Seekbar */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-purple-300 w-11 text-right">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 relative group">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="w-full h-2 bg-purple-900/50 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-purple-500 [&::-webkit-slider-thumb]:to-fuchsia-500 [&::-webkit-slider-thumb]:shadow-lg group-hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                      style={{
                        background: `linear-gradient(to right, rgb(168, 85, 247) ${progress}%, rgba(88, 28, 135, 0.5) ${progress}%)`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-purple-300 w-11">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>

              {/* Playback Controls + Add Icon */}
              <div className="flex items-center justify-between gap-3">
                
                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleLoop}
                    className={`rounded-full p-2 text-lg shadow-lg transition-all ${
                      loopMode === 1
                        ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                        : loopMode === 2
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                        : 'bg-white/10 backdrop-blur-sm text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {loopMode === 1 ? <MdRepeatOne /> : <MdLoop />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={playPrev}
                    className="rounded-full p-2.5 bg-white/10 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-white/15 transition-all shadow-lg"
                  >
                    <FaStepBackward />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlayPause}
                    className="rounded-full p-4 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-2xl shadow-2xl border-2 border-white/30"
                  >
                    {isPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={playNext}
                    className="rounded-full p-2.5 bg-white/10 backdrop-blur-sm border border-purple-500/30 text-white hover:bg-white/15 transition-all shadow-lg"
                  >
                    <FaStepForward />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleShuffle}
                    className={`rounded-full p-2 text-lg shadow-lg transition-all ${
                      shuffle 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                        : 'bg-white/10 backdrop-blur-sm text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    <MdShuffle />
                  </motion.button>
                </div>

                {/* Add to Playlist Icon */}
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onAddToPlaylist(song._id)}
                  className="rounded-full p-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-xl transition-all"
                  aria-label="Add to Playlist"
                >
                  <BiSolidPlaylist className="text-2xl" />
                </motion.button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
