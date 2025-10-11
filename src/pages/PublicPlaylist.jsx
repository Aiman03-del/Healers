import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout';
import { useAudio } from '../context/AudioContext';
import useAxios from '../hooks/useAxios';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaPause, FaRandom, FaShareAlt, FaDownload, 
  FaGlobe, FaMusic, FaClock, FaUser, FaFire 
} from 'react-icons/fa';
import { MdPlaylistPlay } from 'react-icons/md';
import { BiSolidPlaylist } from 'react-icons/bi';
import toast from 'react-hot-toast';

const PublicPlaylist = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const { get } = useAxios();
  const { playSong, currentSong, isPlaying, pauseSong, playQueue, playShuffledPlaylist } = useAudio();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    get(`/api/playlists/${id}`)
      .then((res) => {
        setPlaylist(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playlist, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${playlist.name}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Playlist downloaded!");
  };

  const handlePlayAll = () => {
    if (playlist?.songs?.length) {
      playQueue(playlist.songs);
      playSong(playlist.songs[0]);
    }
  };

  const handleShuffle = () => {
    if (playlist?.songs?.length) {
      playShuffledPlaylist(playlist.songs);
    }
  };

  const handlePlaySong = (song) => {
    if (currentSong && currentSong._id === song._id) {
      if (isPlaying) {
        pauseSong();
      } else {
        playSong(song);
      }
    } else {
      playSong(song);
    }
  };

  const isPlaylistPlaying = playlist?.songs?.length > 0 &&
    currentSong &&
    playlist.songs.some(s => s._id === currentSong._id) &&
    isPlaying;

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-10 px-4">
          <div className="animate-pulse space-y-6">
            <div className="bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 rounded-2xl p-8 h-64" />
            <div className="bg-white/10 rounded-xl p-6 h-96" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto py-20 px-4 text-center">
          <BiSolidPlaylist className="text-6xl text-purple-400/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Playlist Not Found</h1>
          <p className="text-purple-200">This playlist doesn't exist or is not public.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-32 px-2 sm:px-4 lg:px-6">
        {/* Hero Banner - Public Playlist Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 sm:mt-6 md:mt-10 relative bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLS41IDM5LjVoNDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
          
          {/* Public Badge */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 px-4 py-2 rounded-lg bg-green-500/20 backdrop-blur-sm border border-green-400/40 flex items-center gap-2">
            <FaGlobe className="text-green-400" />
            <span className="text-white font-semibold text-sm">Public Playlist</span>
          </div>

          <div className="relative px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-16">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Playlist Cover */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-2xl blur-2xl opacity-50" />
                
                <div className="relative z-10 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20 bg-gradient-to-br from-purple-700 to-fuchsia-700">
                  {playlist.songs && playlist.songs[0]?.cover ? (
                    <img 
                      src={playlist.songs[0].cover} 
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BiSolidPlaylist className="text-6xl md:text-7xl text-white/80" />
                    </div>
                  )}
                </div>
              </div>

              {/* Playlist Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
                  {playlist.name}
                </h1>
                
                {playlist.description && (
                  <p className="text-purple-100 text-sm sm:text-base md:text-lg mb-4 max-w-2xl">
                    {playlist.description}
                  </p>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6 justify-center md:justify-start">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                    <FaMusic className="text-purple-300" />
                    <span className="text-white text-sm font-semibold">
                      {playlist.songs?.length || 0} Songs
                    </span>
                  </div>
                  
                  {playlist.playCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <FaFire className="text-orange-300" />
                      <span className="text-white text-sm font-semibold">
                        {playlist.playCount} Plays
                      </span>
                    </div>
                  )}
                  
                  {playlist.createdAt && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                      <FaClock className="text-blue-300" />
                      <span className="text-white text-sm font-semibold">
                        {new Date(playlist.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center md:justify-start">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayAll}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:via-fuchsia-700 hover:to-pink-700 text-white font-bold shadow-lg transition-all flex items-center gap-2"
                  >
                    {isPlaylistPlaying ? <FaPause /> : <FaPlay />}
                    <span className="hidden sm:inline">
                      {isPlaylistPlaying ? 'Pause All' : 'Play All'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShuffle}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold shadow-lg transition-all flex items-center gap-2 border border-white/20"
                  >
                    <FaRandom />
                    <span className="hidden sm:inline">Shuffle</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShare}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold shadow-lg transition-all flex items-center gap-2 border border-white/20"
                  >
                    <FaShareAlt />
                    <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold shadow-lg transition-all flex items-center gap-2 border border-white/20"
                  >
                    <FaDownload />
                    <span className="hidden sm:inline">Download</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Songs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <MdPlaylistPlay className="text-2xl sm:text-3xl text-purple-400" />
                Tracks
              </h2>
              <span className="text-purple-300 text-sm">
                {playlist.songs?.length || 0} {playlist.songs?.length === 1 ? 'song' : 'songs'}
              </span>
            </div>

            {!playlist.songs || playlist.songs.length === 0 ? (
              <div className="text-center py-12">
                <BiSolidPlaylist className="text-6xl text-purple-400/50 mx-auto mb-4" />
                <p className="text-purple-200">This playlist is empty</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {playlist.songs.map((song, idx) => {
                  const isCurrent = currentSong && currentSong._id === song._id;
                  const isSongPlaying = isCurrent && isPlaying;
                  
                  return (
                    <motion.div
                      key={song._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 border transition-all cursor-pointer group ${
                        isCurrent 
                          ? 'border-purple-400/60 ring-2 ring-purple-400/30' 
                          : 'border-purple-500/20 hover:border-purple-400/40'
                      }`}
                      onClick={() => handlePlaySong(song)}
                    >
                      {/* Track Number / Play Button */}
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className={`relative z-10 w-full h-full rounded-lg overflow-hidden ${
                          isCurrent ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600' : 'bg-white/5'
                        }`}>
                          {song.cover ? (
                            <img 
                              src={song.cover} 
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-purple-300 font-bold">
                              {idx + 1}
                            </div>
                          )}
                          
                          {/* Play/Pause Overlay */}
                          <div className={`absolute inset-0 flex items-center justify-center bg-black/60 ${
                            isSongPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          } transition-opacity`}>
                            {isSongPlaying ? (
                              <FaPause className="text-white text-lg" />
                            ) : (
                              <FaPlay className="text-white text-lg ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Song Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate text-sm sm:text-base ${
                          isCurrent ? 'text-purple-300' : 'text-white group-hover:text-purple-200'
                        }`}>
                          {song.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-purple-300 truncate">
                          {song.artist}
                        </p>
                        {song.genre && song.genre.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {song.genre.slice(0, 3).map((g, i) => (
                              <span 
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-200"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Duration / Playing Indicator */}
                      <div className="flex-shrink-0 text-right">
                        {isSongPlaying ? (
                          <div className="flex items-center gap-1 text-purple-300">
                            <div className="flex gap-0.5">
                              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                              <div className="w-1 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                              <div className="w-1 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                            <span className="text-xs font-semibold hidden sm:inline">Playing</span>
                          </div>
                        ) : song.duration ? (
                          <span className="text-xs sm:text-sm text-purple-300">
                            {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                          </span>
                        ) : null}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FaGlobe className="text-green-400" />
              About This Playlist
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <FaMusic />
                  <span className="text-sm font-semibold">Total Tracks</span>
                </div>
                <p className="text-2xl font-bold text-white">{playlist.songs?.length || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <FaFire />
                  <span className="text-sm font-semibold">Total Plays</span>
                </div>
                <p className="text-2xl font-bold text-white">{playlist.playCount || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <FaClock />
                  <span className="text-sm font-semibold">Created</span>
                </div>
                <p className="text-base font-semibold text-white">
                  {playlist.createdAt 
                    ? new Date(playlist.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <FaGlobe />
                  <span className="text-sm font-semibold">Visibility</span>
                </div>
                <p className="text-base font-semibold text-green-400">Public</p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-200 flex items-center gap-2">
                <FaShareAlt className="flex-shrink-0" />
                <span>
                  Anyone with the link can view and listen to this playlist. 
                  Share it with your friends!
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default PublicPlaylist;
