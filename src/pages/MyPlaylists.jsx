import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import useAxios from "../hooks/useAxios";
import { FaTrashAlt, FaRegSadTear, FaCheckCircle } from "react-icons/fa";
import { MainLayout } from '../components/layout';

const MyPlaylists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get, post, del } = useAxios();
  const [playlists, setPlaylists] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchPlaylists = async () => {
    if (!user?.uid) return;
    const res = await get(`/api/playlists/user/${user.uid}`);
    setPlaylists(res.data);
  };

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await post('/api/playlists', {
      ...form,
      userId: user.uid,
    });
    setForm({ name: '', description: '' });
    fetchPlaylists();
  };

  const handleDelete = async (id) => {
    toast(
      (t) => (
        <span className="flex items-center gap-2">
          Are you sure you want to delete this playlist?
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await del(`/api/playlists/${id}?uid=${user.uid}`);
                toast(<span className="flex items-center gap-2"><FaCheckCircle className="text-green-500" />Deleted!</span>);
                fetchPlaylists();
              } catch {
                toast.error(<span className="flex items-center gap-2"><FaRegSadTear className="text-red-400" />Not authorized!</span>);
              }
            }}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Yes
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
            No
          </button>
        </span>
      ),
      { duration: 6000 }
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-gray-900 to-black p-6 text-white">
        <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 drop-shadow-lg">
          📁 My Playlists
        </h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-w-lg mx-auto mb-10 bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl p-8 border border-purple-700/30"
        >
          <input
            type="text"
            name="name"
            placeholder="Playlist Name"
            className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description"
            className="w-full p-3 rounded-lg bg-white/20 border border-purple-400 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={form.description}
            onChange={handleChange}
          />
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-600 hover:to-purple-700 transition px-4 py-3 rounded-lg text-white font-bold shadow-lg"
          >
            ➕ Create Playlist
          </button>
        </form>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {playlists.map((pl) => (
            <div
              key={pl._id}
              className="relative group p-0 rounded-3xl shadow-2xl bg-gradient-to-br from-purple-800 via-gray-900 to-gray-800 border-2 border-purple-700/40 hover:scale-105 hover:shadow-2xl transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => navigate(`/playlist/${pl._id}`)}
            >
              {/* Decorative gradient bar */}
              <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-700 via-pink-700 to-blue-700 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">{pl.name?.[0]?.toUpperCase() || "P"}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-bold text-xl text-white truncate">{pl.name}</h2>
                    <p className="text-xs text-purple-200 truncate">{pl.description}</p>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="flex justify-end items-center mt-4 gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(pl._id);
                    }}
                    className="text-red-400 hover:text-red-300 text-lg font-semibold transition p-2 rounded-full hover:bg-red-900/30 cursor-pointer"
                    title="Delete"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
              {/* Hover overlay effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-900/80 via-fuchsia-900/60 to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </div>
          ))}
          {playlists.length === 0 && (
            <div className="col-span-full text-center text-purple-200 py-10 text-lg">
              No playlists found. Create your first playlist!
            </div>
          )}
        </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyPlaylists;
