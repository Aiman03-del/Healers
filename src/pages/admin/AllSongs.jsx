// src/pages/admin/AllSongs.jsx
import { useEffect, useState } from 'react';
// import axios from 'axios'; // <-- Remove this
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash } from "react-icons/fa";
import useAxios from '../../hooks/useAxios'; // <-- Add this import

// Helper to convert seconds to mm:ss
function formatDuration(sec) {
  if (!sec && sec !== 0) return '';
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper to convert mm:ss to seconds
function parseDuration(str) {
  if (!str) return 0;
  if (/^\d+:\d{1,2}$/.test(str)) {
    const [min, sec] = str.split(':').map(Number);
    return min * 60 + sec;
  }
  // fallback: try parse as number
  return parseInt(str, 10) || 0;
}

const AllSongs = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // <-- Add search state
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    artist: '',
    genre: '',
    cover: '',
    audio: '',
    duration: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const { get, put, del } = useAxios();

  // Debounce search input
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchSongs(search);
    }, 400);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line
  }, [search]);

  // Fetch songs (with optional search)
  const fetchSongs = async (query = "") => {
    setLoading(true);
    try {
      const res = await get(`/api/songs${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      setSongs(res.data.songs || []);
    } catch (err) {
      setSongs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line
  }, []);

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setShowModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    try {
      await del(`/api/songs/${pendingDeleteId}`);
      setSongs((prev) => prev.filter((s) => s._id !== pendingDeleteId));
      toast.success('Song deleted!');
    } catch (err) {
      toast.error('Failed to delete song');
    }
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const handleDeleteCancel = () => {
    setShowModal(false);
    setPendingDeleteId(null);
  };

  const handleEdit = (song) => {
    setEditId(song._id);
    setEditForm({
      title: song.title,
      artist: song.artist,
      genre: Array.isArray(song.genre) ? song.genre.join(', ') : song.genre,
      cover: song.cover,
      audio: song.audio,
      duration: formatDuration(song.duration),
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      const updatedSong = {
        ...editForm,
        genre: editForm.genre.split(',').map((g) => g.trim()),
        duration: parseDuration(editForm.duration),
      };
      const res = await put(`/api/songs/${id}`, updatedSong);
      setSongs((prev) =>
        prev.map((s) => (s._id === id ? { ...s, ...res.data.song } : s))
      );
      setEditId(null);
      toast.success('Song updated!');
    } catch (err) {
      toast.error('Failed to update song');
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🎵 All Songs</h1>
      {/* Search box */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, artist, or genre..."
          className="w-full md:w-1/2 p-2 rounded bg-gray-700 text-white"
        />
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-gray-800 p-6 rounded shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this song?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-1 rounded bg-gray-500 hover:bg-gray-600"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 rounded bg-red-600 hover:bg-red-700"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 p-5 rounded-2xl shadow-xl flex flex-col items-center">
              <div className="w-24 h-24 rounded-xl bg-gray-700 mb-2" />
              <div className="h-4 w-2/3 bg-gray-700 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-800 rounded mb-1" />
              <div className="h-3 w-1/3 bg-gray-800 rounded mb-1" />
              <div className="h-3 w-1/4 bg-gray-800 rounded mb-1" />
              <div className="flex gap-3 mt-3">
                <div className="w-10 h-10 rounded-full bg-gray-700" />
                <div className="w-10 h-10 rounded-full bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.length === 0 && (
            <div className="text-gray-400">No songs found.</div>
          )}
          {songs.map((song) => (
            <div
              key={song._id}
              className="relative bg-gradient-to-br from-purple-900 via-gray-900 to-gray-800 p-5 rounded-2xl shadow-xl hover:shadow-2xl flex flex-col items-center transition-all duration-200"
            >
              {editId === song._id ? (
                <form
                  className="w-full flex flex-col items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditSave(song._id);
                  }}
                >
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow border-2 border-purple-700 mb-2">
                    {editForm.cover && (
                      <img
                        src={editForm.cover}
                        alt="cover"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <input
                    name="cover"
                    value={editForm.cover}
                    onChange={handleEditChange}
                    placeholder="Cover Image URL"
                    className="w-full p-1 rounded bg-gray-700 text-white text-xs mb-1"
                  />
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    placeholder="Title"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-1"
                  />
                  <input
                    name="artist"
                    value={editForm.artist}
                    onChange={handleEditChange}
                    placeholder="Artist"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-1"
                  />
                  <input
                    name="genre"
                    value={editForm.genre}
                    onChange={handleEditChange}
                    placeholder="Genres (comma separated)"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-1"
                  />
                  <input
                    name="audio"
                    value={editForm.audio}
                    onChange={handleEditChange}
                    placeholder="Audio URL"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-1"
                  />
                  {editForm.audio && (
                    <audio controls src={editForm.audio} className="w-full mb-1" />
                  )}
                  <input
                    name="duration"
                    // type="number" // remove type to allow mm:ss input
                    value={editForm.duration}
                    onChange={handleEditChange}
                    placeholder="Duration (mm:ss or seconds)"
                    className="w-full p-1 rounded bg-gray-700 text-white mb-2"
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      type="submit"
                      className="p-3 rounded-full bg-transparent hover:bg-green-600/30 text-green-400 hover:text-white flex items-center justify-center transition-colors text-xl"
                      aria-label="Save"
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="p-3 rounded-full bg-transparent hover:bg-gray-500/20 text-gray-400 hover:text-white flex items-center justify-center transition-colors text-xl"
                      onClick={handleEditCancel}
                      aria-label="Cancel"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-xl overflow-hidden shadow border-2 border-purple-700 mb-2">
                    {song.cover && (
                      <img
                        src={song.cover}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white truncate">{song.title}</h3>
                  <p className="text-sm text-purple-200 font-medium mb-1 truncate">{song.artist}</p>
                  <div className="flex flex-wrap justify-center gap-1 mb-1">
                    {song.genre &&
                      song.genre.map((g, i) => (
                        <span
                          key={i}
                          className="bg-purple-700 text-xs text-white px-2 py-0.5 rounded-full"
                        >
                          {g}
                        </span>
                      ))}
                  </div>
                  <p className="text-xs text-gray-300 mb-1">
                    Duration: <span className="font-semibold">{formatDuration(song.duration)}</span>
                  </p>
                  {song.audio && (
                    <audio controls src={song.audio} className="w-full mb-1" />
                  )}
                  <div className="flex gap-3 mt-3">
                    <button
                      className="p-3 rounded-full bg-transparent hover:bg-purple-700/30 text-purple-400 hover:text-white flex items-center justify-center transition-colors text-xl"
                      onClick={() => handleEdit(song)}
                      aria-label="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="p-3 rounded-full bg-transparent hover:bg-pink-700/30 text-pink-400 hover:text-white flex items-center justify-center transition-colors text-xl"
                      onClick={() => handleDeleteClick(song._id)}
                      aria-label="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllSongs;
