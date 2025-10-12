import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const Playlist = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch user's playlists
  useEffect(() => {
    if (!user?.uid) return;
    fetch(`${API_BASE_URL}/api/playlists/user/${user.uid}`)
      .then(res => res.json())
      .then(data => setPlaylists(data.playlists || []));
  }, [user]);

  // Create playlist
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch(`${API_BASE_URL}/api/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userUid: user.uid }),
    });
    setName('');
    // Refresh playlists
    const res = await fetch(`${API_BASE_URL}/api/playlists/user/${user.uid}`);
    const data = await res.json();
    setPlaylists(data.playlists || []);
    setLoading(false);
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
