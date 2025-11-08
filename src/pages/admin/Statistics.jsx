import { useEffect, useState } from "react";
import { FaMusic, FaUserFriends, FaFire, FaStar, FaChartLine, FaHeart, FaPlay } from "react-icons/fa";
import useAxios from "../../hooks/useAxios";

const Statistics = () => {
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalActivities: 0,
    topUsers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { get } = useAxios();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const [songsRes, usersRes] = await Promise.all([
          get("/api/songs"),
          get("/api/users"),
        ]);
        
        const users = usersRes.data.users || [];
        
        // Fetch activity data for all users to calculate engagement
        const userActivities = await Promise.all(
          users.map(async (user) => {
            try {
              const activityRes = await get(`/api/activity/user/${user.uid}`);
              return {
                uid: user.uid,
                name: user.name || user.email,
                email: user.email,
                activityCount: activityRes.data.activities?.length || 0,
                activities: activityRes.data.activities || [],
              };
            } catch {
              return {
                uid: user.uid,
                name: user.name || user.email,
                email: user.email,
                activityCount: 0,
                activities: [],
              };
            }
          })
        );
        
        // Calculate active users (users with at least 1 activity in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const activeUsers = userActivities.filter(user => {
          const recentActivities = user.activities.filter(act => {
            const actDate = new Date(act.createdAt);
            return actDate >= thirtyDaysAgo;
          });
          return recentActivities.length > 0;
        }).length;
        
        // Calculate total activities
        const totalActivities = userActivities.reduce((sum, user) => sum + user.activityCount, 0);
        
        // Get top 5 users by activity count
        const topUsers = userActivities
          .sort((a, b) => b.activityCount - a.activityCount)
          .slice(0, 5)
          .map((user, index) => ({
            ...user,
            rank: index + 1,
            rating: user.activityCount > 50 ? 5 : 
                   user.activityCount > 30 ? 4 :
                   user.activityCount > 15 ? 3 :
                   user.activityCount > 5 ? 2 : 1,
          }));
        
        setStats({
          totalSongs: songsRes.data.songs?.length || 0,
          totalUsers: users.length,
          activeUsers,
          totalActivities,
          topUsers,
        });
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Failed to load statistics. Please try again later.");
        setStats({ totalSongs: 0, totalUsers: 0, activeUsers: 0, totalActivities: 0, topUsers: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [get]);

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar
        key={i}
        className={i < rating ? "text-[#1db954]" : "text-gray-600"}
      />
    ));
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-white flex items-center justify-center gap-2">
        <FaFire className="text-gray-400" /> Platform Statistics
      </h1>
      {loading ? (
        <div className="text-center text-gray-400 py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-[#181818] rounded-lg shadow-lg p-6 flex flex-col items-center hover:bg-[#282828] transition-colors border border-gray-800">
              <FaMusic className="text-4xl mb-2 text-gray-400" />
              <div className="text-2xl font-bold text-white">
                {stats.totalSongs}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Songs</div>
            </div>
            <div className="bg-[#181818] rounded-lg shadow-lg p-6 flex flex-col items-center hover:bg-[#282828] transition-colors border border-gray-800">
              <FaUserFriends className="text-4xl mb-2 text-gray-400" />
              <div className="text-2xl font-bold text-white">
                {stats.totalUsers}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Users</div>
            </div>
            <div className="bg-[#181818] rounded-lg shadow-lg p-6 flex flex-col items-center hover:bg-[#282828] transition-colors border border-gray-800">
              <FaChartLine className="text-4xl mb-2 text-[#1db954]" />
              <div className="text-2xl font-bold text-white">
                {stats.activeUsers}
              </div>
              <div className="text-sm text-gray-400 mt-1">Active Users</div>
            </div>
            <div className="bg-[#181818] rounded-lg shadow-lg p-6 flex flex-col items-center hover:bg-[#282828] transition-colors border border-gray-800">
              <FaPlay className="text-4xl mb-2 text-gray-400" />
              <div className="text-2xl font-bold text-white">
                {stats.totalActivities}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Activities</div>
            </div>
          </div>

          {/* User Ratings Section */}
          <div className="bg-[#181818] rounded-lg shadow-lg p-6 border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FaStar className="text-[#1db954]" />
              Top Users by Engagement
            </h2>
            {stats.topUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FaUserFriends className="text-4xl mx-auto mb-3 opacity-50" />
                <p>No user activity data available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.topUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="bg-[#282828] rounded-lg p-4 hover:bg-[#333333] transition-colors border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1db954] text-white font-bold">
                          #{user.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {user.email}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {user.activityCount}
                          </div>
                          <div className="text-xs text-gray-400">Activities</div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <div className="flex gap-1">
                          {getRatingStars(user.rating)}
                        </div>
                        <div className="text-sm text-gray-400 ml-2">
                          ({user.rating}/5)
                        </div>
            </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;