import { useEffect, useState } from "react";
import axios from "axios";
import { FaMusic, FaUserFriends, FaFire } from "react-icons/fa";

const Statistics = () => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
        const [songsRes, usersRes] = await Promise.all([
          axios.get(`${API_BASE}/api/songs`),
          axios.get(`${API_BASE}/api/users`),
        ]);
        setStats({
          totalSongs: songsRes.data.songs?.length || 0,
          totalUsers: usersRes.data.users?.length || 0,
        });
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Failed to load statistics. Please try again later.");
        setStats({ totalSongs: 0, totalUsers: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-purple-300 flex items-center justify-center gap-2">
        <FaFire className="text-orange-400" /> Platform Statistics
      </h1>
      {loading ? (
        <div className="text-center text-gray-400 py-10">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-800 to-purple-600 rounded-xl shadow-lg p-6 flex flex-col items-center">
              <FaMusic className="text-4xl mb-2 text-purple-200" />
              <div className="text-2xl font-bold text-white">
                {stats.totalSongs}
              </div>
              <div className="text-sm text-purple-200 mt-1">Total Songs</div>
            </div>
            <div className="bg-gradient-to-br from-pink-700 to-pink-500 rounded-xl shadow-lg p-6 flex flex-col items-center">
              <FaUserFriends className="text-4xl mb-2 text-pink-200" />
              <div className="text-2xl font-bold text-white">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-pink-100 mt-1">Total Users</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;