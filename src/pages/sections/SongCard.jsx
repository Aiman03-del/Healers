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
        <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/80 to-fuchsia-900/60 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden border border-purple-500/20 hover:border-purple-400/40 transition-all">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-fuchsia-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:via-fuchsia-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-150" />

          {/* Album Cover */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-purple-900/30 to-fuchsia-900/30">
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
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play/Pause button overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white flex items-center justify-center shadow-2xl">
                {isCurrent && isCurrentPlaying ? (
                  <FaPause className="text-xl" />
                ) : (
                  <FaPlay className="text-xl ml-1" />
                )}
              </div>
            </div>

            {/* Now Playing indicator */}
            {isCurrent && (
              <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {isCurrentPlaying ? "Playing" : "Paused"}
              </div>
            )}
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

