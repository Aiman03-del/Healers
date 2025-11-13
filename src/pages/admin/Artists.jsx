import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useAxios from '../../hooks/useAxios';
import { FaSearch, FaEye, FaUserCircle, FaMusic, FaTag } from 'react-icons/fa';

const Artists = () => {
  const navigate = useNavigate();
  const { get } = useAxios();
  const [loading, setLoading] = useState(true);
  const [artists, setArtists] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchArtists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArtists = async () => {
    setLoading(true);
    try {
      const res = await get('/api/artist-profiles');
      setArtists(res.data?.artists || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return artists;
    return artists.filter((item) => {
      const base = item.artist?.toLowerCase() || '';
      const display = item.profile?.displayName?.toLowerCase() || '';
      return base.includes(term) || display.includes(term);
    });
  }, [artists, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Artists</h1>
          <p className="text-sm text-gray-400">
            Curate artist profiles, bios, imagery, and highlighted songs.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artist by name..."
            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-full py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1db954]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-[#1db954]" />
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-gray-400">
            No artists found. Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredArtists.map((artist) => (
            <motion.div
              key={artist.artistSlug}
              whileHover={{ translateY: -4 }}
              className="bg-[#181818] border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#242424] flex items-center justify-center overflow-hidden">
                  {artist.profile?.image ? (
                    <img
                      src={artist.profile.image}
                      alt={artist.profile.displayName || artist.artist}
                      className="w-full h-full object-cover"
                    />
                  ) : artist.cover ? (
                    <img
                      src={artist.cover}
                      alt={artist.artist}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-3xl text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">
                    {artist.profile?.displayName || artist.artist}
                  </h3>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {artist.artist}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[#1db954] text-sm font-semibold">
                  <FaMusic />
                  <span>{artist.songCount}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 min-h-[48px]">
                {artist.profile?.bio
                  ? artist.profile.bio.slice(0, 160) +
                    (artist.profile.bio.length > 160 ? '…' : '')
                  : 'No biography added yet.'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(artist.profile?.tags || []).slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300"
                  >
                    <FaTag className="text-[10px]" />
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate(`/dashboard/artists/${artist.artistSlug}`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition"
              >
                <FaEye />
                View profile
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Artists;


