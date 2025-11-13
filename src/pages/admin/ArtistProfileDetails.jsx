import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useAxios from '../../hooks/useAxios';
import { uploadToImageKit } from '../../utils/upload';
import {
  FaArrowLeft,
  FaSave,
  FaUserCircle,
  FaImage,
  FaTimesCircle,
  FaLink,
  FaMusic,
} from 'react-icons/fa';

const MAX_FEATURED_SONGS = 6;

const buildFormState = (artistName = '', profile = null) => ({
  artist: artistName,
  displayName: profile?.displayName || artistName,
  bio: profile?.bio || '',
  profileImage: profile?.image || '',
  coverImage: profile?.coverImage || '',
  genresText: Array.isArray(profile?.genres) ? profile.genres.join(', ') : '',
  tagsText: Array.isArray(profile?.tags) ? profile.tags.join(', ') : '',
  socials: {
    facebook: profile?.socials?.facebook || '',
    instagram: profile?.socials?.instagram || '',
    twitter: profile?.socials?.twitter || '',
    youtube: profile?.socials?.youtube || '',
    website: profile?.socials?.website || '',
    tiktok: profile?.socials?.tiktok || '',
  },
  featuredSongIds: Array.isArray(profile?.featuredSongIds)
    ? profile.featuredSongIds.map((id) => id.toString())
    : [],
});

const emptyForm = buildFormState();

const ArtistProfileDetails = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { get, put } = useAxios();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyForm);
  const [songs, setSongs] = useState([]);
  const [uploading, setUploading] = useState({ profile: false, cover: false });

  const profileImageInputRef = useRef(null);
  const coverImageInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchProfile = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await get(`/api/artist-profiles/${slug}`);
      const artistName = res.data?.artist || '';
      const profile = res.data?.profile || null;
      setProfileForm(buildFormState(artistName, profile));
      setSongs(res.data?.songs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load artist details');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      socials: { ...prev.socials, [field]: value },
    }));
  };

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  };

  const genreList = useMemo(
    () => toArray(profileForm.genresText),
    [profileForm.genresText]
  );
  const tagList = useMemo(
    () => toArray(profileForm.tagsText),
    [profileForm.tagsText]
  );

  const toggleFeaturedSong = (songId) => {
    setProfileForm((prev) => {
      const exists = prev.featuredSongIds.includes(songId);
      if (exists) {
        return {
          ...prev,
          featuredSongIds: prev.featuredSongIds.filter((id) => id !== songId),
        };
      }
      if (prev.featuredSongIds.length >= MAX_FEATURED_SONGS) {
        toast.error(`You can highlight up to ${MAX_FEATURED_SONGS} songs`);
        return prev;
      }
      return {
        ...prev,
        featuredSongIds: [...prev.featuredSongIds, songId],
      };
    });
  };

  const handleUploadClick = (type) => {
    if (type === 'profile') {
      profileImageInputRef.current?.click();
    } else {
      coverImageInputRef.current?.click();
    }
  };

  const handleFileChange = async (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setUploading((prev) => ({ ...prev, [type]: true }));
    toast.loading('Uploading image...', { id: `${type}-upload` });

    try {
      const url = await uploadToImageKit(file);
      setProfileForm((prev) => ({
        ...prev,
        [type === 'profile' ? 'profileImage' : 'coverImage']: url,
      }));
      toast.success('Image uploaded', { id: `${type}-upload` });
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed', { id: `${type}-upload` });
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleSaveProfile = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      const payload = {
        artist: profileForm.artist,
        displayName: profileForm.displayName,
        bio: profileForm.bio,
        image: profileForm.profileImage,
        coverImage: profileForm.coverImage,
        genres: profileForm.genresText,
        tags: profileForm.tagsText,
        socials: profileForm.socials,
        featuredSongIds: profileForm.featuredSongIds,
      };

      const res = await put(`/api/artist-profiles/${slug}`, payload);
      setProfileForm(buildFormState(profileForm.artist, res.data?.profile));
      toast.success('Artist profile saved successfully!');
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error || 'Failed to update artist profile'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard/artists')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition"
        >
          <FaArrowLeft />
          Back to artists
        </button>
        <h1 className="text-2xl font-bold text-white">
          {profileForm.displayName || 'Artist profile'}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-700 border-t-[#1db954]" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[3fr,2fr]">
          <section className="space-y-6">
            <motion.div
              layout
              className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl"
            >
              <div className="grid md:grid-cols-[120px,1fr] gap-5 items-center">
                <div className="w-28 h-28 rounded-2xl bg-[#1a1a1a] border border-gray-800 overflow-hidden flex items-center justify-center">
                  {profileForm.profileImage ? (
                    <img
                      src={profileForm.profileImage}
                      alt={profileForm.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="text-4xl text-gray-500" />
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Artist (read only)
                    </label>
                    <input
                      type="text"
                      value={profileForm.artist}
                      readOnly
                      className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) =>
                        handleFormChange('displayName', e.target.value)
                      }
                      className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Biography
                </label>
                <textarea
                  rows={6}
                  value={profileForm.bio}
                  onChange={(e) => handleFormChange('bio', e.target.value)}
                  placeholder="Tell listeners about this artist..."
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954] resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Genres (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profileForm.genresText}
                    onChange={(e) =>
                      handleFormChange('genresText', e.target.value)
                    }
                    className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  {genreList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {genreList.map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 rounded-full bg-[#1db954]/10 border border-[#1db954]/30 text-xs text-[#1db954]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={profileForm.tagsText}
                    onChange={(e) =>
                      handleFormChange('tagsText', e.target.value)
                    }
                    className="w-full mt-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  {tagList.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tagList.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              layout
              className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Profile imagery
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUploadClick('profile')}
                    disabled={uploading.profile}
                    className="px-3 py-2 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-white/5 transition disabled:opacity-60"
                  >
                    {uploading.profile ? 'Uploading…' : 'Upload avatar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadClick('cover')}
                    disabled={uploading.cover}
                    className="px-3 py-2 rounded-full border border-gray-700 text-xs text-gray-200 hover:bg-white/5 transition disabled:opacity-60"
                  >
                    {uploading.cover ? 'Uploading…' : 'Upload cover'}
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                    Profile image URL
                  </label>
                  <input
                    type="text"
                    value={profileForm.profileImage}
                    onChange={(e) =>
                      handleFormChange('profileImage', e.target.value)
                    }
                    placeholder="https://"
                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  {profileForm.profileImage && (
                    <button
                      type="button"
                      onClick={() => handleFormChange('profileImage', '')}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                    >
                      <FaTimesCircle />
                      Remove image
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-semibold tracking-wide text-gray-500">
                    Cover image URL
                  </label>
                  <input
                    type="text"
                    value={profileForm.coverImage}
                    onChange={(e) =>
                      handleFormChange('coverImage', e.target.value)
                    }
                    placeholder="https://"
                    className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  />
                  {profileForm.coverImage && (
                    <button
                      type="button"
                      onClick={() => handleFormChange('coverImage', '')}
                      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition"
                    >
                      <FaTimesCircle />
                      Remove image
                    </button>
                  )}
                </div>
              </div>

              <div className="h-40 rounded-2xl border border-gray-800 overflow-hidden bg-[#101010] flex items-center justify-center">
                {profileForm.coverImage ? (
                  <img
                    src={profileForm.coverImage}
                    alt="Artist cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaImage className="text-4xl text-gray-600" />
                )}
              </div>
            </motion.div>
          </section>

          <section className="space-y-6">
            <motion.div
              layout
              className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                Social links
              </h3>
              {['facebook', 'instagram', 'twitter', 'youtube', 'website', 'tiktok'].map(
                (social) => (
                  <div key={social}>
                    <label className="text-xs text-gray-500 capitalize">
                      {social}
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <FaLink className="text-gray-600 text-xs" />
                      <input
                        type="url"
                        value={profileForm.socials[social]}
                        onChange={(e) => handleSocialChange(social, e.target.value)}
                        placeholder={`https://${social}.com/...`}
                        className="flex-1 bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                      />
                    </div>
                  </div>
                )
              )}
            </motion.div>

            <motion.div
              layout
              className="bg-[#181818] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                  Highlighted songs ({profileForm.featuredSongIds.length}/{MAX_FEATURED_SONGS})
                </h3>
                <span className="text-xs text-gray-500">
                  Selections appear prominently on the artist page.
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {songs.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No songs found for this artist yet.
                  </p>
                ) : (
                  songs.map((song) => {
                    const selected = profileForm.featuredSongIds.includes(song._id);
                    return (
                      <label
                        key={song._id}
                        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-sm transition ${
                          selected
                            ? 'border-[#1db954] bg-[#1db954]/10 text-white'
                            : 'border-gray-800 bg-[#1a1a1a] text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-xs text-gray-500">
                            Plays: {song.playCount || 0}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleFeaturedSong(song._id)}
                          className="h-4 w-4 accent-[#1db954]"
                        />
                      </label>
                    );
                  })
                )}
              </div>

              {profileForm.featuredSongIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profileForm.featuredSongIds.map((id) => {
                    const song = songs.find((item) => item._id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1db954]/10 border border-[#1db954]/40 text-xs text-[#1db954]"
                      >
                        <FaMusic />
                        {song?.title || 'Song removed'}
                        <button
                          type="button"
                          onClick={() => toggleFeaturedSong(id)}
                          className="text-[#1db954] hover:text-white"
                        >
                          <FaTimesCircle />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </motion.div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-60"
              >
                <FaSave />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </section>
        </div>
      )}

      <input
        ref={profileImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'profile')}
      />
      <input
        ref={coverImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'cover')}
      />
    </div>
  );
};

export default ArtistProfileDetails;


