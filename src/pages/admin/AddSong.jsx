// src/pages/admin/AddSong.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { uploadToImageKit } from '../../utils/upload';
import { toast } from 'react-hot-toast';
import useAxios from "../../hooks/useAxios"; // <-- useAxios import

const AddSong = () => {
  const { user } = useAuth();
  const { post } = useAxios(); // <-- useAxios hook

  const [form, setForm] = useState({
    title: '',
    artist: '',
    genre: '',
    cover: '',
    audio: '',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [audioName, setAudioName] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle cover image upload
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMsg('Uploading cover...');
    try {
      const url = await uploadToImageKit(file);
      setForm((prev) => ({ ...prev, cover: url }));
      setCoverPreview(url);
      setMsg('✅ Cover uploaded!');
    } catch {
      setMsg('❌ Cover upload failed');
    }
  };

  // Handle audio upload
  const handleAudioChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMsg('Uploading audio...');
    try {
      const url = await uploadToImageKit(file);
      setForm((prev) => ({ ...prev, audio: url }));
      setAudioName(file.name);
      setMsg('✅ Audio uploaded!');
    } catch {
      setMsg('❌ Audio upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setLoading(true);

    // Ensure genre is always a non-empty array
    const genreArr = form.genre
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g);

    const song = {
      title: form.title,
      artist: form.artist,
      genre: genreArr.length > 0 ? genreArr : ["Unknown"], // fallback to "Unknown"
      cover: form.cover,
      audio: form.audio,
    };

    try {
      // Use useAxios post instead of axios.post
      const res = await post('/api/songs', song);
      setMsg('✅ Song added successfully!');
      setForm({
        title: '',
        artist: '',
        genre: '',
        cover: '',
        audio: '',
      });
      setCoverPreview('');
      setAudioName('');
      toast.success('Song uploaded successfully!');
      console.log('Song upload response:', res.data);
    } catch (err) {
      console.error(err);
      setMsg('❌ Failed to add song. Check console.');
      toast.error('Failed to upload song!');
      if (err.response) {
        console.log('Song upload error response:', err.response.data);
      }
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 mt-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
        ➕ Add New Song
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Song Title"
        />
        <Input
          label="Artist"
          name="artist"
          value={form.artist}
          onChange={handleChange}
          placeholder="Artist Name"
        />
        <Input
          label="Genres (comma separated)"
          name="genre"
          value={form.genre}
          onChange={handleChange}
          placeholder="e.g. Pop, Rock"
        />

        {/* Cover Image Upload */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-purple-200">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="w-full p-2 rounded bg-gray-800 border border-purple-700 text-white focus:ring-2 focus:ring-purple-600"
          />
          {coverPreview && (
            <img
              src={coverPreview}
              alt="cover preview"
              className="mt-3 w-36 h-36 object-cover rounded-xl border-4 border-purple-700 shadow-lg mx-auto"
            />
          )}
        </div>

        {/* Audio Upload */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-purple-200">
            Audio File
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="w-full p-2 rounded bg-gray-800 border border-purple-700 text-white focus:ring-2 focus:ring-purple-600"
          />
          {audioName && (
            <div className="mt-2 text-xs text-purple-300 text-center">{audioName}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            !form.cover ||
            !form.audio ||
            !form.title ||
            !form.artist ||
            !form.genre
          }
          className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 px-6 py-3 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-200 disabled:opacity-60"
        >
          {loading ? 'Adding...' : 'Add Song'}
        </button>

        {msg && (
          <p className="text-sm mt-2 text-center text-purple-200">{msg}</p>
        )}
      </form>
    </div>
  );
};

const Input = ({ label, name, ...props }) => (
  <div>
    <label className="block mb-1 text-sm font-semibold text-purple-200">{label}</label>
    <input
      name={name}
      className="w-full p-2 rounded bg-gray-800 border border-purple-700 text-white focus:ring-2 focus:ring-purple-600"
      {...props}
    />
  </div>
);

export default AddSong;
