import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { 
  FaUserCircle, FaEnvelope, FaUserTag, FaCalendarAlt, FaIdBadge, 
  FaEdit, FaListUl, FaSignOutAlt, FaHistory, FaHeart, FaUpload, 
  FaSpinner, FaUserEdit, FaMusic, FaTrash, FaUserShield, 
  FaCheckCircle, FaPlus, FaMinus, FaSave, FaTimes, FaClock,
  FaPlay, FaFire, FaFolder
} from "react-icons/fa";
import { BiSolidPlaylist } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import { uploadToImageKit } from "../utils/upload";
import useAxios from "../hooks/useAxios";
import { MainLayout } from "../components/layout";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  { key: "overview", label: "Overview", icon: <FaUserCircle />, color: "purple" },
  { key: "playlists", label: "Playlists", icon: <FaListUl />, color: "fuchsia" },
  { key: "activity", label: "Activity", icon: <FaHistory />, color: "pink" },
];

const MyProfile = () => {
  const { user, logout, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editImage, setEditImage] = useState(user?.image || "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [activity, setActivity] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const { get, post } = useAxios();
  const navigate = useNavigate();

  // Fetch activities from server
  useEffect(() => {
    if (user?.uid) {
      get(`/api/activity/user/${user.uid}`)
        .then(res => setActivity(res.data.activities || []))
        .catch(() => setActivity([]));
    }
  }, [user]);

  // Fetch all songs and playlists
  useEffect(() => {
    get("/api/songs").then(res => setAllSongs(res.data.songs || []));
    if (user?.uid) {
      get(`/api/playlists/user/${user.uid}`).then(res => setPlaylists(res.data || []));
    }
    // eslint-disable-next-line
  }, [user]);

  const refreshActivity = () => {
    if (user?.uid) {
      get(`/api/activity/user/${user.uid}`).then(res => setActivity(res.data.activities || []));
    }
  };

  const handleProfileSave = async () => {
    try {
      await post("/api/users", {
        uid: user.uid,
        email: user.email,
        name: editName,
        image: editImage,
        type: user.type,
        createdAt: user.createdAt,
        provider: user.provider,
      });
      setUser({
        ...user,
        name: editName,
        image: editImage,
      });
      setEditing(false);
      refreshActivity();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleEditClick = () => {
    setEditName(user.name || "");
    setEditImage(user.image || "");
    setEditing(true);
    setUploadError("");
  };

  const handleLogout = () => {
    logout();
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadToImageKit(file);
      setEditImage(url);
    } catch (err) {
      setUploadError("Image upload failed");
    }
    setUploading(false);
  };

  useEffect(() => {
    if (activeTab === "activity") {
      refreshActivity();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const activityIcon = (action) => {
    if (action.includes("Liked")) return { icon: <FaHeart />, color: "text-pink-400", bg: "bg-pink-500/20" };
    if (action.includes("Unliked")) return { icon: <FaHeart />, color: "text-gray-400", bg: "bg-gray-500/20" };
    if (action.includes("Added song")) return { icon: <FaPlus />, color: "text-purple-400", bg: "bg-purple-500/20" };
    if (action.includes("Removed song")) return { icon: <FaMinus />, color: "text-yellow-400", bg: "bg-yellow-500/20" };
    if (action.includes("Created playlist")) return { icon: <FaListUl />, color: "text-blue-400", bg: "bg-blue-500/20" };
    if (action.includes("Deleted playlist")) return { icon: <FaTrash />, color: "text-red-400", bg: "bg-red-500/20" };
    if (action.includes("Profile updated")) return { icon: <FaUserEdit />, color: "text-green-400", bg: "bg-green-500/20" };
    if (action.includes("Role updated")) return { icon: <FaUserShield />, color: "text-pink-400", bg: "bg-pink-500/20" };
    if (action.includes("Played song")) return { icon: <FaPlay />, color: "text-blue-400", bg: "bg-blue-500/20" };
    return { icon: <FaCheckCircle />, color: "text-gray-400", bg: "bg-gray-500/20" };
  };

  const songNameById = useMemo(() => {
    const map = {};
    allSongs.forEach(s => { map[s._id] = s.title; });
    return map;
  }, [allSongs]);

  const playlistNameById = useMemo(() => {
    const map = {};
    playlists.forEach(p => { map[p._id] = p.name; });
    return map;
  }, [playlists]);

  const renderMeta = (action, meta = {}) => {
    if (action.includes("Liked") && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm">
          Liked <span className="font-semibold text-pink-300">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action.includes("Unliked") && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm">
          Unliked <span className="font-semibold text-gray-300">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Removed song from playlist" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm">
          Removed <span className="font-semibold text-yellow-300">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Added song to playlist" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm">
          Added <span className="font-semibold text-purple-300">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Created playlist" && meta.name) {
      return (
        <span className="text-sm">
          Created <span className="font-semibold text-blue-300">{meta.name}</span>
        </span>
      );
    }
    if (action === "Played song" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm">
          Played <span className="font-semibold text-blue-300">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    return <span className="text-sm text-purple-200">{action}</span>;
  };

  // Calculate stats
  const totalSongs = playlists.reduce((acc, pl) => acc + (pl.songs?.length || 0), 0);
  const totalPlays = playlists.reduce((acc, pl) => acc + (pl.playCount || 0), 0);
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A';

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-xl text-purple-400 px-4 text-center">
          Please login to view your profile.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-32 px-2 sm:px-4 lg:px-6">
        {/* Hero Section with Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 sm:mt-6 md:mt-10 relative bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Background decorations */}
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLS41IDM5LjVoNDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-30" />
          
          <div className="relative px-4 sm:px-6 md:px-12 py-8 sm:py-10 md:py-16">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              {/* Profile Picture */}
              <div className="relative flex-shrink-0">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full blur-2xl opacity-50" />
                  
                  <img
                    src={editing ? (editImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(editName || user.email)}`) : (user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`)}
                    alt="Profile"
                    className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-4 border-white/20 shadow-2xl object-cover bg-gradient-to-br from-purple-700 to-fuchsia-700"
                  />
                  
                  {/* Edit/Upload buttons */}
                  {!editing ? (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-full p-2 sm:p-3 shadow-lg border-2 border-white/20"
                      onClick={handleEditClick}
                      title="Edit Profile"
                    >
                      <FaEdit className="text-sm sm:text-base" />
                    </motion.button>
                  ) : (
                    <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full p-2 sm:p-3 shadow-lg border-2 border-white/20 cursor-pointer" title="Upload Image">
                      {uploading ? (
                        <FaSpinner className="animate-spin text-sm sm:text-base" />
                      ) : (
                        <FaUpload className="text-sm sm:text-base" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileChange}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                {editing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      className="w-full max-w-md px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-purple-400/40 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-xl font-bold"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Your Name"
                      disabled={uploading}
                    />
                    {uploadError && (
                      <div className="text-red-400 text-sm">{uploadError}</div>
                    )}
                    <div className="flex gap-3 flex-wrap justify-center md:justify-start">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2"
                        onClick={handleProfileSave}
                        disabled={uploading}
                      >
                        <FaSave />
                        Save Changes
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold shadow-lg transition-all flex items-center gap-2"
                        onClick={() => setEditing(false)}
                        disabled={uploading}
                      >
                        <FaTimes />
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
                      {user.name || "Anonymous User"}
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center md:items-start gap-2 sm:gap-4 text-purple-200 mb-4">
                      <div className="flex items-center gap-2">
                        <FaEnvelope className="text-purple-300" />
                        <span className="text-sm sm:text-base">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUserTag className="text-fuchsia-300" />
                        <span className="text-sm sm:text-base capitalize">{user.type || "User"}</span>
                      </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                      <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-xs text-purple-200">Playlists</div>
                        <div className="text-lg sm:text-xl font-bold text-white">{playlists.length}</div>
                      </div>
                      <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-xs text-purple-200">Songs</div>
                        <div className="text-lg sm:text-xl font-bold text-white">{totalSongs}</div>
                      </div>
                      <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-xs text-purple-200">Plays</div>
                        <div className="text-lg sm:text-xl font-bold text-white">{totalPlays}</div>
                      </div>
                      <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                        <div className="text-xs text-purple-200">Member</div>
                        <div className="text-xs sm:text-sm font-bold text-white">{memberSince}</div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleLogout}
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all flex items-center gap-2 mx-auto md:mx-0"
                    >
                      <FaSignOutAlt />
                      Logout
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex gap-2 sm:gap-3 p-2 bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-xl backdrop-blur-sm border border-purple-500/20 overflow-x-auto">
            {TABS.map((tab, idx) => (
              <motion.button
                key={tab.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm sm:text-base rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg"
                    : "bg-white/5 text-purple-200 hover:bg-white/10"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/20"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaUserCircle className="text-purple-400" />
                  Account Details
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* User ID */}
                  <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <FaIdBadge />
                      <span className="text-sm font-semibold">User ID</span>
                    </div>
                    <p className="text-white font-mono text-xs break-all">{user.uid}</p>
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <FaEnvelope />
                      <span className="text-sm font-semibold">Email</span>
                    </div>
                    <p className="text-white text-sm break-all">{user.email}</p>
                  </div>

                  {/* Provider */}
                  <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <FaUserTag />
                      <span className="text-sm font-semibold">Provider</span>
                    </div>
                    <p className="text-white text-sm capitalize">{user.provider || "Email"}</p>
                  </div>

                  {/* Member Since */}
                  <div className="p-4 rounded-lg bg-white/5 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-300 mb-2">
                      <FaCalendarAlt />
                      <span className="text-sm font-semibold">Member Since</span>
                    </div>
                    <p className="text-white text-sm">{memberSince}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Playlists Tab */}
            {activeTab === "playlists" && (
              <motion.div
                key="playlists"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/20"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BiSolidPlaylist className="text-fuchsia-400" />
                  My Playlists
                </h2>

                {playlists.length === 0 ? (
                  <div className="text-center py-12">
                    <BiSolidPlaylist className="text-6xl text-purple-400/50 mx-auto mb-4" />
                    <p className="text-purple-200 mb-6">No playlists yet</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/playlists")}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <FaPlus />
                      Create Your First Playlist
                    </motion.button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {playlists.slice(0, 4).map((pl, idx) => (
                        <motion.div
                          key={pl._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          onClick={() => navigate(`/playlist/${pl._id}`)}
                          className="p-4 rounded-lg bg-gradient-to-br from-purple-800/30 to-fuchsia-800/30 border border-purple-500/20 hover:border-purple-400/40 cursor-pointer transition-all shadow-lg hover:shadow-xl"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
                              {pl.songs?.[0]?.cover ? (
                                <img src={pl.songs[0].cover} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <BiSolidPlaylist className="text-2xl text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white truncate">{pl.name}</h3>
                              <p className="text-xs text-purple-200">{pl.songs?.length || 0} songs</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/playlists")}
                      className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <FaListUl />
                      View All Playlists
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gradient-to-br from-gray-900/80 via-purple-900/50 to-fuchsia-900/50 rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/20"
              >
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FaHistory className="text-pink-400" />
                  Recent Activity
                </h2>

                {activity.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="text-6xl text-purple-400/50 mx-auto mb-4" />
                    <p className="text-purple-200">No activity yet</p>
                    <p className="text-purple-300/70 text-sm mt-2">Your actions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {activity.map((a, i) => {
                      const { icon, color, bg } = activityIcon(a.action);
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-purple-500/20 hover:border-purple-400/30 transition-all group"
                        >
                          <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full ${bg} ${color}`}>
                            <span className="text-lg">{icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">
                              {renderMeta(a.action, a.metadata || a.meta)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-purple-300">
                              <FaClock className="text-xs" />
                              {new Date(a.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #a855f7, #ec4899);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #9333ea, #db2777);
        }
      `}</style>
    </MainLayout>
  );
};

export default MyProfile;
