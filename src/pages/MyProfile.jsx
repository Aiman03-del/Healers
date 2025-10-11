import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { FaUserCircle, FaEnvelope, FaUserTag, FaCalendarAlt, FaIdBadge, FaEdit, FaListUl, FaSignOutAlt, FaHistory, FaHeart, FaUpload, FaSpinner, FaUserEdit, FaMusic, FaTrash, FaUserShield, FaCheckCircle, FaPlus, FaMinus } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { uploadToImageKit } from "../utils/upload";
import useAxios from "../hooks/useAxios";
import { MainLayout } from "../components/layout";

const TABS = [
  { key: "overview", label: "Overview", icon: <FaUserCircle /> },
  { key: "playlists", label: "My Playlists", icon: <FaListUl /> },
  { key: "activity", label: "Activity", icon: <FaHistory /> },
  // { key: "liked", label: "Liked Songs", icon: <FaHeart /> }, // <-- Hide Liked Songs tab
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
  const [allPlaylists, setAllPlaylists] = useState([]);
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

  // Fetch all songs and playlists for name resolution
  useEffect(() => {
    get("/api/songs").then(res => setAllSongs(res.data.songs || []));
    if (user?.uid) {
      get(`/api/playlists/user/${user.uid}`).then(res => setAllPlaylists(res.data || []));
    }
    // eslint-disable-next-line
  }, [user]);

  // Helper to refresh activity
  const refreshActivity = () => {
    if (user?.uid) {
      get(`/api/activity/user/${user.uid}`).then(res => setActivity(res.data.activities || []));
    }
  };

  const handleProfileSave = async () => {
    // Save to backend so activity is logged
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
    // Refresh activity
    if (user?.uid) {
      get(`/api/activity/user/${user.uid}`).then(res => setActivity(res.data.activities || []));
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
    // No need to addActivity here, backend logs it if needed
  };

  const handleGoToPlaylists = () => {
    navigate("/playlists");
  };

  // Handle image file upload
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

  // In AddSong.jsx, after adding a song, call refreshActivity from MyProfile if needed.
  // Or, if you want to refresh automatically when the Activity tab is opened:
  useEffect(() => {
    if (activeTab === "activity") {
      refreshActivity();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // Helper to get icon and color for activity type
  const activityIcon = (action) => {
    // Minimal, subtle icons/colors
    if (action.includes("Liked")) return { icon: <FaHeart />, color: "text-pink-500" };
    if (action.includes("Unliked")) return { icon: <FaHeart />, color: "text-gray-400" };
    if (action.includes("Added song")) return { icon: <FaPlus />, color: "text-purple-400" };
    if (action.includes("Removed song")) return { icon: <FaMinus />, color: "text-yellow-400" };
    if (action.includes("Created playlist")) return { icon: <FaListUl />, color: "text-blue-400" };
    if (action.includes("Deleted playlist")) return { icon: <FaTrash />, color: "text-red-400" };
    if (action.includes("Profile updated")) return { icon: <FaUserEdit />, color: "text-green-400" };
    if (action.includes("Role updated")) return { icon: <FaUserShield />, color: "text-pink-400" };
    if (action.includes("Updated song")) return { icon: <FaMusic />, color: "text-purple-400" };
    return { icon: <FaCheckCircle />, color: "text-gray-400" };
  };

  // Helper to get song name by ID
  const songNameById = useMemo(() => {
    const map = {};
    allSongs.forEach(s => { map[s._id] = s.title; });
    return map;
  }, [allSongs]);

  // Helper to get playlist name by ID
  const playlistNameById = useMemo(() => {
    const map = {};
    allPlaylists.forEach(p => { map[p._id] = p.name; });
    return map;
  }, [allPlaylists]);

  // Helper to render meta info in a minimal, clean way
  const renderMeta = (action, meta = {}) => {
    if (action.includes("Liked") && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm text-gray-100">
          Liked &mdash; <span className="font-medium">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action.includes("Unliked") && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm text-gray-100">
          Unliked &mdash; <span className="font-medium">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Removed song from playlist" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm text-gray-100">
          Removed from playlist &mdash; <span className="font-medium">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Added song to playlist" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm text-gray-100">
          Added to playlist &mdash; <span className="font-medium">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    if (action === "Created playlist" && meta.name) {
      return (
        <span className="text-sm text-gray-600">
          Created playlist &mdash; <span className="font-medium">{meta.name}</span>
        </span>
      );
    }
    if (action === "Deleted playlist") {
      return (
        <span className="text-sm text-gray-600">
          Playlist deleted
        </span>
      );
    }
    if (action === "Profile updated" && meta.name) {
      return (
        <span className="text-sm text-gray-600">
          Name changed to <span className="font-medium">{meta.name}</span>
        </span>
      );
    }
    if (action === "Role updated" && meta.newRole) {
      return (
        <span className="text-sm text-gray-600">
          Role changed to <span className="font-medium capitalize">{meta.newRole}</span>
        </span>
      );
    }
    if (action === "Added song" && meta.title) {
      return (
        <span className="text-sm text-gray-600">
          Added new song &mdash; <span className="font-medium">{meta.title}</span>
        </span>
      );
    }
    if (action === "Updated song" && meta.songId && songNameById[meta.songId]) {
      return (
        <span className="text-sm text-gray-600">
          Updated song &mdash; <span className="font-medium">{songNameById[meta.songId]}</span>
        </span>
      );
    }
    return null;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-xl text-purple-400 px-4 text-center">
        Please login to view your profile.
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-gray-950 to-black flex flex-col items-center py-4 px-1 sm:py-8 sm:px-2">
        {/* Profile Header */}
      <div className="w-full max-w-3xl flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-6 md:mb-10 px-2 sm:px-4">
        <div className="flex flex-col items-center md:items-start flex-shrink-0 w-full md:w-auto">
          <div className="relative">
            <img
              src={editing ? (editImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(editName || user.email)}`) : (user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}`)}
              alt="Profile"
              className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full border-2 border-purple-300 shadow-lg object-cover bg-white"
            />
            <span className="absolute bottom-2 right-2 bg-white text-purple-500 rounded-full p-2 shadow">
              <FaUserCircle className="text-lg sm:text-xl md:text-2xl" />
            </span>
            {!editing && (
              <button
                className="absolute top-2 right-2 bg-white text-purple-600 rounded-full p-2 shadow border border-purple-200"
                onClick={handleEditClick}
                title="Edit Profile"
              >
                <FaEdit />
              </button>
            )}
            {editing && (
              <label className="absolute top-2 left-2 bg-white text-purple-600 rounded-full p-2 shadow border border-purple-200 cursor-pointer" title="Upload Image">
                {uploading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaUpload />
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
          {editing && uploadError && (
            <div className="text-red-400 mt-2 text-sm">{uploadError}</div>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center md:items-start w-full mt-4 md:mt-0">
          {editing ? (
            <>
              <input
                type="text"
                className="w-full max-w-xs px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 text-lg sm:text-xl md:text-2xl font-bold mb-2"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Your Name"
                disabled={uploading}
              />
              <div className="flex gap-2 sm:gap-3 mt-2 flex-wrap">
                <button
                  className="px-4 py-2 rounded bg-purple-600 text-white font-semibold shadow"
                  onClick={handleProfileSave}
                  disabled={uploading}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                  onClick={() => setEditing(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-100 mb-2 text-center md:text-left break-words">
                {user.name || "No Name"}
              </h2>
              <div className="flex items-center gap-2 text-gray-400 text-sm sm:text-base mb-2 flex-wrap justify-center md:justify-start">
                <FaEnvelope className="text-purple-400" />
                <span className="break-all">{user.email}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center md:justify-start">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg bg-gray-800 text-white font-semibold shadow hover:bg-gray-700 transition"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="w-full max-w-3xl flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-gray-800 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 font-semibold text-sm sm:text-base md:text-lg rounded-t-xl transition-all whitespace-nowrap
              ${activeTab === tab.key
                ? "bg-gray-900 text-white shadow"
                : "bg-gray-800 text-gray-400 hover:bg-gray-900/60"
              }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      <div className="w-full max-w-3xl rounded-xl bg-white/5 shadow-xl p-2 sm:p-4 md:p-6 min-h-[180px] sm:min-h-[220px] md:min-h-[250px]">
        {activeTab === "overview" && (
          <div className="flex flex-col md:flex-row gap-3 sm:gap-6 md:gap-8">
            <div className="flex-1 space-y-2 sm:space-y-3 md:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <FaIdBadge className="text-gray-400 text-base sm:text-lg md:text-xl" />
                <span className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base">User ID:</span>
                <span className="text-gray-200 break-all text-xs sm:text-sm md:text-base">{user.uid}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <FaUserTag className="text-gray-400 text-base sm:text-lg md:text-xl" />
                <span className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base">Provider:</span>
                <span className="text-gray-200 text-xs sm:text-sm md:text-base">{user.provider || "email"}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <FaCalendarAlt className="text-gray-400 text-base sm:text-lg md:text-xl" />
                <span className="font-semibold text-gray-400 text-xs sm:text-sm md:text-base">Joined:</span>
                <span className="text-gray-200 text-xs sm:text-sm md:text-base">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</span>
              </div>
            </div>
          </div>
        )}
        {activeTab === "playlists" && (
          <div className="flex flex-col items-center justify-center h-full min-h-[80px] sm:min-h-[120px]">
            <p className="text-sm sm:text-base text-gray-400 mb-4 text-center">Manage your playlists here.</p>
            <button
              onClick={handleGoToPlaylists}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-3 rounded-lg bg-gray-900 text-white font-semibold shadow hover:bg-gray-800 transition"
            >
              <FaListUl /> Go to My Playlists
            </button>
          </div>
        )}
        {activeTab === "activity" && (
          <div className="flex flex-col items-center justify-center text-gray-100 h-full min-h-[80px] sm:min-h-[120px]">
            <p className="text-sm sm:text-base text-white mb-4 text-center">Your recent activity will appear here.</p>
            {activity.length === 0 ? (
              <span className="text-gray-100 text-xs sm:text-base">No activity yet.</span>
            ) : (
              <ul className="w-full max-w-2xl space-y-2 text-gray-100 max-h-[30vh] sm:max-h-[40vh] md:max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {activity.map((a, i) => {
                  const { icon, color } = activityIcon(a.action);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 sm:gap-3 rounded-lg bg-gray-900/80 px-2 sm:px-4 py-2 sm:py-3 border border-gray-800 text-gray-100"
                    >
                      <span className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-100 ${color}`}>
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0 text-gray-100 text-[10px] sm:text-xs md:text-base">
                        {renderMeta(a.action, a.meta)}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] sm:text-[10px] md:text-xs text-gray-100 font-mono">{new Date(a.createdAt).toLocaleString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {activeTab === "liked" && (
          null
        )}
      </div>
      </div>
    </MainLayout>
  );
};

export default MyProfile;