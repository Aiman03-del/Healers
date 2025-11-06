import { memo } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaPause } from "react-icons/fa";

export const SongCard = memo(
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
        <div className="relative bg-[#181818] rounded-lg p-2 hover:bg-[#282828] transition-all duration-200 group">
          {/* Album Cover */}
          <div className="relative w-full aspect-square rounded-md overflow-hidden mb-3 bg-[#282828]">
            <img
              src={song.cover || "/healers.png"}
              alt={song.title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.target.src = "/healers.png";
              }}
            />
            
            {/* Play/Pause button overlay - Spotify style */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-[#1db954] text-white flex items-center justify-center shadow-2xl cursor-pointer"
              >
                {isCurrent && isCurrentPlaying ? (
                  <FaPause className="text-xl" />
                ) : (
                  <FaPlay className="text-xl ml-1" />
                )}
              </motion.div>
            </div>

            {/* Now Playing indicator - Spotify style */}
            {isCurrent && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-[#1db954] text-white text-xs font-semibold flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {isCurrentPlaying ? "Playing" : "Paused"}
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="px-1 pb-1">
            <h3 className="font-semibold text-sm text-white truncate mb-1">
              {song.title}
            </h3>
            <p className="text-xs text-gray-400 truncate">
              {song.artist}
            </p>
            {song.genre && song.genre.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {song.genre.slice(0, 2).map((g, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300"
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.song._id === nextProps.song._id &&
      prevProps.currentSongId === nextProps.currentSongId &&
      prevProps.isCurrentPlaying === nextProps.isCurrentPlaying
    );
  }
);

SongCard.displayName = 'SongCard';

