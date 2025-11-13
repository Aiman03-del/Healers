import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout';
import { useAudio } from '../context/AudioContext';
import useAxios from '../hooks/useAxios';
import { motion } from 'framer-motion';
import { 
  FaPlay, FaPause, FaRandom, FaShareAlt, FaDownload, 
  FaGlobe, FaMusic, FaClock, FaUser, FaFire, FaEllipsisH 
} from 'react-icons/fa';
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
      <div className="min-h-screen bg-[#020202] text-white">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-10 py-8 sm:py-12 space-y-10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-[#181818] via-[#101010] to-black px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]"
          >
            {playlist.songs?.[0]?.cover && (
              <div
                className="absolute inset-0 opacity-40 blur-[80px] scale-110"
                style={{
                  backgroundImage: `url(${playlist.songs[0].cover})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  filter: 'blur(80px)',
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-[#111]/80 to-transparent" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-10">
              <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 flex-shrink-0">
                {playlist.songs?.[0]?.cover ? (
                  <img
                    src={playlist.songs[0].cover}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#535353] to-[#121212] flex items-center justify-center">
                    <BiSolidPlaylist className="text-6xl sm:text-7xl text-white/80" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-5 md:space-y-6">
                <div className="uppercase tracking-[0.65em] text-xs text-white/60">Playlist</div>
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight drop-shadow-[0_3px_15px_rgba(0,0,0,0.35)]">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
                    {playlist.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm sm:text-base text-white/70">
                  <div className="flex items-center gap-2">
                    <FaGlobe className="text-[#1db954]" />
                    <span className="font-medium">Public Playlist</span>
                  </div>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-2">
                    <FaMusic className="text-[#1db954]" />
                    <span>{playlist.songs?.length || 0} songs</span>
                  </div>
                  {playlist.playCount > 0 && (
                    <>
                      <span className="text-white/40">•</span>
                      <div className="flex items-center gap-2">
                        <FaFire className="text-orange-400" />
                        <span>{playlist.playCount.toLocaleString()} plays</span>
                      </div>
                    </>
                  )}
                  {playlist.createdAt && (
                    <>
                      <span className="text-white/40">•</span>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-sky-400" />
                        <span>
                          {new Date(playlist.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handlePlayAll}
                    className="group flex items-center justify-center w-16 h-16 rounded-full bg-[#1db954] text-black shadow-[0_20px_40px_rgba(29,185,84,0.35)] transition-all"
                  >
                    {isPlaylistPlaying ? (
                      <FaPause className="text-2xl" />
                    ) : (
                      <FaPlay className="text-2xl ml-0.5 group-hover:translate-x-[1px] transition-transform" />
                    )}
                  </motion.button>

                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleShuffle}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <FaRandom />
                      <span className="hidden sm:inline">Shuffle</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleShare}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <FaShareAlt />
                      <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 hover:text-white hover:border-white/40 transition-colors"
                    >
                      <FaDownload />
                      <span className="hidden sm:inline">Download</span>
                    </motion.button>
                  </div>

                  <button
                    type="button"
                    className="ml-auto hidden sm:inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                  >
                    <FaEllipsisH />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-white/5 bg-[#121212]/60 backdrop-blur-sm shadow-[0_20px_60px_-25px_rgba(0,0,0,0.8)]"
          >
            <div className="px-5 sm:px-8 py-4 border-b border-white/5 uppercase text-[12px] tracking-[0.4em] text-white/40">
              Tracks
            </div>

            {!playlist.songs || playlist.songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-white/60">
                <BiSolidPlaylist className="text-6xl text-white/25" />
                <p className="text-sm sm:text-base">This playlist doesn&apos;t have any songs yet.</p>
              </div>
            ) : (
              <>
                <div className="hidden sm:grid grid-cols-[60px_minmax(0,1fr)_120px] px-5 sm:px-8 py-3 text-xs uppercase tracking-[0.3em] text-white/30 border-b border-white/5">
                  <span>#</span>
                  <span>Title</span>
                  <span className="text-right">Duration</span>
                </div>

                <div className="flex flex-col divide-y divide-white/5">
                  {playlist.songs.map((song, idx) => {
                    const isCurrent = currentSong && currentSong._id === song._id;
                    const isSongPlaying = isCurrent && isPlaying;

                    return (
                      <motion.button
                        key={song._id}
                        type="button"
                        onClick={() => handlePlaySong(song)}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`group grid grid-cols-[60px_minmax(0,1fr)_88px] sm:grid-cols-[70px_minmax(0,1fr)_120px] items-center gap-3 px-5 sm:px-8 py-4 text-left relative transition-colors ${
                          isCurrent ? 'bg-white/5' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-4 text-white/40">
                          <span className="text-sm font-semibold group-hover:hidden">{idx + 1}</span>
                          <span className="hidden group-hover:flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                            {isSongPlaying ? <FaPause /> : <FaPlay className="ml-0.5" />}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative h-12 w-12 overflow-hidden rounded-md border border-white/10 bg-white/5">
                            {song.cover ? (
                              <img src={song.cover} alt={song.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                                #{idx + 1}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`truncate text-sm sm:text-base font-semibold ${
                                isCurrent ? 'text-[#1db954]' : 'text-white'
                              }`}
                            >
                              {song.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                              {song.artist && <span className="truncate max-w-[200px]">{song.artist}</span>}
                              {song.genre && song.genre.length > 0 && (
                                <>
                                  <span className="hidden sm:inline text-white/30">•</span>
                                  <span className="truncate max-w-[120px]">
                                    {song.genre.slice(0, 2).join(', ')}
                                    {song.genre.length > 2 ? '…' : ''}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 text-xs text-white/50">
                          {song.duration ? (
                            <span>
                              {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                            </span>
                          ) : (
                            <span className="uppercase tracking-[0.2em] text-white/30">—</span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="rounded-2xl border border-white/5 bg-[#121212]/70 px-6 sm:px-10 py-6 sm:py-8 backdrop-blur-sm shadow-[0_20px_60px_-40px_rgba(0,0,0,0.9)]"
          >
            <h3 className="flex items-center gap-3 text-lg font-semibold text-white/90 mb-6">
              <FaGlobe className="text-[#1db954]" />
              About this playlist
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                  <FaMusic className="text-[#1db954]" />
                  Tracks
                </div>
                <p className="text-2xl font-bold">{playlist.songs?.length || 0}</p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                  <FaFire className="text-orange-400" />
                  Plays
                </div>
                <p className="text-2xl font-bold">{playlist.playCount?.toLocaleString() || 0}</p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                  <FaClock className="text-sky-400" />
                  Created
                </div>
                <p className="text-sm font-semibold text-white/80">
                  {playlist.createdAt
                    ? new Date(playlist.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Unknown'}
                </p>
              </div>

              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/40 mb-2">
                  <FaUser className="text-purple-300" />
                  Visibility
                </div>
                <p className="text-sm font-semibold text-[#1db954]">Public</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
              <span className="font-semibold text-white">Tip:</span> Share the playlist link with friends and they can
              enjoy it instantly in the web player.
            </div>
          </motion.section>
        </div>
      </div>
    </MainLayout>
  );
};

export default PublicPlaylist;
