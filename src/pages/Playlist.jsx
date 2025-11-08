import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import useAxios from '../hooks/useAxios';

export const Playlist = () => {
  const { user } = useAuth();
  const { get, post } = useAxios();
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlaylists = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setError(null);
      const res = await get(`/api/playlists/user/${user.uid}`);
      const list =
        res.data?.playlists ??
        res.data ??
        [];
      setPlaylists(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load playlists", err);
      setError("Failed to load playlists.");
      setPlaylists([]);
    }
  }, [get, user?.uid]);

  // Fetch user's playlists
  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  // Create playlist
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await post('/api/playlists', { name, userUid: user.uid });
      setName('');
      await loadPlaylists();
    } catch (err) {
      console.error("Failed to create playlist", err);
      setError("Failed to create playlist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">My Playlists</h2>
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Playlist name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 p-2 rounded border"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </form>
      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}
      <div>
        {playlists.length === 0 && <p>No playlists found.</p>}
        <ul className="space-y-2">
          {playlists.map(pl => (
            <li key={pl._id} className="bg-white/10 p-4 rounded flex justify-between items-center">
              <span className="font-semibold">{pl.name}</span>
              <Link to={`/playlist/${pl._id}`} className="text-purple-300 underline">Details</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Playlist;
