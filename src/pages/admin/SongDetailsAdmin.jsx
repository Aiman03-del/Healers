// src/pages/admin/SongDetailsAdmin.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FaArrowLeft,
  FaMusic,
  FaCompactDisc,
  FaMicrophone,
  FaCheckCircle,
  FaTimesCircle,
  FaImage,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';
import useAxios from '../../hooks/useAxios';
import { uploadToImageKit } from '../../utils/upload';
import { ArtistMultiSelect } from '../../components/common';

const normalizeArtistName = (name = '') =>
  name
    .toString()
    .replace(/\s+/g, ' ')
    .trim();

const parseArtistList = (value = '') =>
  value
    .replace(/\s+(feat\.?|ft\.?|featuring)\s+/gi, ',')
    .replace(/\s+vs\.?\s+/gi, ',')
    .replace(/\s+x\s+/gi, ',')
    .replace(/\s+and\s+/gi, ',')
    .replace(/&/g, ',')
    .split(',')
    .map(normalizeArtistName)
    .filter(Boolean);

const dedupeArtistsList = (artists = []) =>
  Array.from(
    new Map(
      (Array.isArray(artists) ? artists : [])
        .map((item) => normalizeArtistName(item))
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item])
    ).values()
  );

const formatDuration = (sec) => {
  if (!sec && sec !== 0) return '';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const parseDuration = (str) => {
  if (!str) return 0;
  if (/^\d+:\d{1,2}$/.test(str)) {
    const [min, sec] = str.split(':').map(Number);
    return min * 60 + sec;
  }
  return parseInt(str, 10) || 0;
};

const SongDetailsAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { get, put, del } = useAxios();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [availableArtists, setAvailableArtists] = useState([]);
  const [similarSongs, setSimilarSongs] = useState([]);

  const coverFileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '',
    artist: '',
    artists: [],
    genre: '',
    cover: '',
    audio: '',
    duration: '',
    playCount: 0,
    createdAt: '',
  });

  const genreTags = useMemo(() => {
    if (!form.genre) return [];
    return form.genre
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  }, [form.genre]);

  const addArtistsToAvailable = (input = []) => {
    const candidates = Array.isArray(input) ? input : [input];
    if (!candidates.length) return;
    setAvailableArtists((prev) =>
      dedupeArtistsList([...prev, ...candidates]).sort()
    );
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [songRes, artistRes] = await Promise.all([
        get(`/api/songs/${id}`),
        get('/api/artists?includeSongs=false'),
      ]);

      const song = songRes.data?.song;
      const similar = songRes.data?.similarSongs || [];

      if (!song) {
        toast.error('Song not found');
        navigate('/dashboard/songs');
        return;
      }

      const artistList =
        Array.isArray(song.artists) && song.artists.length
          ? dedupeArtistsList(song.artists)
          : dedupeArtistsList(parseArtistList(song.artist));

      addArtistsToAvailable(artistRes.data?.artists?.map((a) => a.artist) || []);
      addArtistsToAvailable(artistList);

      setSimilarSongs(similar);
      setForm({
        title: song.title || '',
        artist: artistList.join(', '),
        artists: artistList,
        genre: Array.isArray(song.genre) ? song.genre.join(', ') : song.genre || '',
        cover: song.cover || '',
        audio: song.audio || '',
        duration: formatDuration(song.duration),
        playCount: song.playCount || 0,
        createdAt: song.createdAt || '',
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load song details');
      navigate('/dashboard/songs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArtistsChange = (artists) => {
    const deduped = dedupeArtistsList(artists);
    setForm((prev) => ({
      ...prev,
      artists: deduped,
      artist: deduped.join(', '),
    }));
    addArtistsToAvailable(deduped);
  };

  const handleCoverUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploadingCover(true);
    toast.loading('Uploading cover image...', { id: 'cover-upload' });
    try {
      const url = await uploadToImageKit(file);
      setForm((prev) => ({ ...prev, cover: url }));
      toast.success('Cover uploaded successfully!', { id: 'cover-upload' });
    } catch (err) {
      console.error(err);
      toast.error('Cover upload failed', { id: 'cover-upload' });
    } finally {
      setUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!id) return;
    const artistList = dedupeArtistsList(
      form.artists.length ? form.artists : parseArtistList(form.artist)
    );
    if (!artistList.length) {
      toast.error('Please add at least one artist');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        artist: artistList.join(', '),
        artists: artistList,
        cover: form.cover,
        audio: form.audio,
        genre: form.genre
          .split(',')
          .map((g) => g.trim())
          .filter(Boolean),
        duration: parseDuration(form.duration),
      };

      await put(`/api/songs/${id}`, payload);
      toast.success('Song updated successfully!');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update song');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await del(`/api/songs/${id}`);
      toast.success('Song deleted successfully');
      navigate('/dashboard/songs');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete song');
    } finally {
      setDeleting(false);
    }
  };

  const formattedDate = useMemo(() => {
    if (!form.createdAt) return '';
    try {
      return new Date(form.createdAt).toLocaleString();
    } catch {
      return form.createdAt;
    }
  }, [form.createdAt]);

  return (
    <div className="min-h-screen bg-[#121212] py-6 sm:py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto relative z-10 space-y-6"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/dashboard/songs')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition"
          >
            <FaArrowLeft />
            Back to songs
          </button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500 tracking-wide">
              Total Plays
            </p>
            <p className="text-2xl font-semibold text-white">
              {form.playCount || 0}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-[#1db954]" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <motion.div
                layout
                className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl"
              >
                <div className="grid md:grid-cols-[160px,1fr] gap-5 items-center">
                  <div className="w-40 h-40 rounded-2xl bg-[#1a1a1a] border border-gray-800 overflow-hidden flex items-center justify-center">
                    {form.cover ? (
                      <img
                        src={form.cover}
                        alt={form.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaMusic className="text-4xl text-gray-500" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Song title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleInputChange}
                        className="w-full mt-2 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => coverFileInputRef.current?.click()}
                        disabled={uploadingCover}
                        className="flex-1 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                      >
                        <FaImage />
                        {uploadingCover ? 'Uploading...' : 'Upload cover'}
                      </motion.button>
                      {form.cover && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, cover: '' }))}
                          className="px-3 py-2 rounded-full bg-transparent border border-gray-700 text-white hover:border-gray-600 transition flex items-center justify-center gap-2"
                        >
                          <FaTimesCircle />
                          Remove
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Cover image URL
                  </label>
                  <input
                    type="text"
                    name="cover"
                    value={form.cover}
                    onChange={handleInputChange}
                    placeholder="https://"
                    className="w-full mt-2 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Artists
                  </label>
                  <ArtistMultiSelect
                    className="mt-2"
                    options={availableArtists}
                    value={form.artists}
                    onChange={handleArtistsChange}
                    onCreateOption={(artist) => addArtistsToAvailable([artist])}
                    inputPlaceholder="Search or add artists"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Genres (comma separated)
                    </label>
                    <input
                      type="text"
                      name="genre"
                      value={form.genre}
                      onChange={handleInputChange}
                      className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                    {genreTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {genreTags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full bg-[#1db954]/10 border border-[#1db954]/40 text-xs text-[#1db954]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Duration (mm:ss)
                    </label>
                    <input
                      type="text"
                      name="duration"
                      value={form.duration}
                      onChange={handleInputChange}
                      className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Audio URL
                  </label>
                  <input
                    type="text"
                    name="audio"
                    value={form.audio}
                    onChange={handleInputChange}
                    placeholder="https://"
                    className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  {form.audio && (
                    <div className="mt-3">
                      <audio
                        controls
                        src={form.audio}
                        className="w-full rounded-lg"
                        style={{ height: '40px' }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Created at
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {formattedDate || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Total plays
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      {form.playCount || 0}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-3">
                  <p className="text-xs text-gray-500">
                    Changes are saved to the song immediately.
                  </p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-full bg-transparent border border-red-500 text-red-400 hover:bg-red-500/10 transition flex items-center gap-2 text-sm font-semibold"
                    >
                      <FaTrash />
                      Delete
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      disabled={saving}
                      onClick={handleSave}
                      className="px-5 py-2 rounded-full bg-white text-black hover:bg-gray-200 transition flex items-center gap-2 text-sm font-semibold disabled:opacity-60"
                    >
                      <FaCheckCircle />
                      {saving ? 'Saving...' : 'Save changes'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <motion.div
                layout
                className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
              >
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Similar songs
                </h3>
                {similarSongs.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No similar songs available yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {similarSongs.map((song) => (
                      <div
                        key={song._id}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#1a1a1a] border border-gray-800"
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222] flex-shrink-0">
                          {song.cover ? (
                            <img
                              src={song.cover}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <FaMusic />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white font-semibold truncate">
                            {song.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {song.artist}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-3 py-1 text-xs rounded-full border border-white/20 text-gray-300 hover:bg-white/10 transition"
                          onClick={() => navigate(`/dashboard/songs/${song._id}`)}
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}

        <AnimatePresence>
          {showDeleteModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => setShowDeleteModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-[#282828] rounded-lg shadow-2xl border border-gray-800 p-6 sm:p-8 w-full max-w-md relative">
                  <div className="relative z-10 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 sm:mb-6"
                    >
                      <FaExclamationTriangle className="text-2xl sm:text-3xl text-white" />
                    </motion.div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-3 text-white">
                      Delete this song?
                    </h2>
                    <p className="text-sm text-gray-400 mb-6">
                      This action cannot be undone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="flex-1 px-4 py-2 rounded-full bg-transparent border border-gray-700 text-white hover:border-gray-600 transition font-semibold"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        disabled={deleting}
                        className="flex-1 px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition font-semibold disabled:opacity-60"
                        onClick={handleDelete}
                      >
                        {deleting ? 'Deleting...' : 'Delete'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverUpload}
      />
    </div>
  );
};

export default SongDetailsAdmin;


