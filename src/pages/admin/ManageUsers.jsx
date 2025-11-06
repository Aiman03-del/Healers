import { useEffect, useState } from "react";
import useAxios from "../../hooks/useAxios"; // 🆕
import toast from "react-hot-toast";
import { FaUser, FaUserShield, FaUserTie, FaCheckCircle, FaSearch, FaTimes } from "react-icons/fa";

const ROLES = [
  { value: "user", label: "User", icon: <FaUser className="inline mr-1" /> },
  { value: "staff", label: "Staff", icon: <FaUserTie className="inline mr-1" /> },
  { value: "admin", label: "Admin", icon: <FaUserShield className="inline mr-1" /> },
];

const roleColor = {
  user: "text-gray-400 bg-white/10",
  staff: "text-gray-400 bg-white/10",
  admin: "text-gray-400 bg-white/10",
};

const ManageUsers = () => {
  const { get, put, del } = useAxios(); // add del method
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState(null);
  const [activeTab, setActiveTab] = useState("user"); // "user" | "staff" | "admin"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await get("/api/users");
      setUsers(res.data.users || []);
    } catch {
      setUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    setUpdatingUid(uid);
    try {
      await put(`/api/users/${uid}/role`, { type: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, type: newRole } : u))
      );
      toast.success(`User role changed to ${newRole.charAt(0).toUpperCase() + newRole.slice(1)}`);
    } catch {
      toast.error("Failed to update role");
    }
    setUpdatingUid(null);
  };

  const handleDeleteUser = async (uid) => {
    toast(
      (t) => (
        <span>
          Are you sure you want to delete this user?
          <div className="mt-2 flex gap-2">
            <button
              className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded font-semibold"
              onClick={async () => {
                toast.dismiss(t.id);
                setUpdatingUid(uid);
                try {
                  await del(`/api/users/${uid}`);
                  setUsers((prev) => prev.filter((u) => u.uid !== uid));
                  toast.success("User deleted successfully");
                } catch {
                  toast.error("Failed to delete user");
                }
                setUpdatingUid(null);
              }}
            >
              Yes, Delete
            </button>
            <button
              className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded font-semibold"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </span>
      ),
      { duration: 8000 }
    );
  };

  // Filter users by active tab (role) and search query
  const filteredUsers = users.filter(u => {
    const matchesRole = (u.type || "user") === activeTab;
    if (!matchesRole) return false;
    
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-white">
        <FaUserShield className="text-2xl text-gray-400" /> Manage Users
      </h1>
      {/* Tabs - Spotify Style */}
      <div className="flex gap-1 mb-6">
        {ROLES.map((role) => (
          <button
            key={role.value}
            className={`px-5 py-2 rounded-full font-semibold flex items-center gap-2 transition ${
              activeTab === role.value
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => setActiveTab(role.value)}
          >
            {role.icon}
            {role.label}
          </button>
        ))}
      </div>

      {/* Search Bar - Spotify Style */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-12 pr-10 py-3 rounded-full bg-white/10 border border-transparent text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:bg-white/20 focus:outline-none transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg bg-[#181818] border border-gray-800">
          <table className="min-w-full">
            <thead>
              <tr className="text-gray-400 text-left bg-[#181818] border-b border-gray-700">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6">
                    No users found for this role.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="border-b border-gray-700 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#282828] text-white font-bold text-lg">
                        {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "U"}
                      </span>
                      {u.name || "-"}
                    </td>
                    <td className="py-3 px-4 text-white">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-400">
                        {ROLES.find(r => r.value === (u.type || "user"))?.icon}
                        {(u.type || "user").charAt(0).toUpperCase() + (u.type || "user").slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 items-center">
                        <div className="relative">
                          <select
                            value={u.type || "user"}
                            onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                            className="appearance-none bg-white/10 border border-gray-700 text-white font-semibold rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white/20 transition cursor-pointer hover:bg-white/10"
                            disabled={updatingUid === u.uid}
                          >
                            {ROLES.map((role) => (
                              <option
                                key={role.value}
                                value={role.value}
                                className="bg-[#181818] text-white"
                              >
                                {role.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                            ▼
                          </span>
                        </div>
                        <button
                          className="bg-transparent border border-gray-700 hover:border-gray-600 text-white px-3 py-1 rounded-full font-semibold ml-2 transition"
                          onClick={() => handleDeleteUser(u.uid)}
                          disabled={updatingUid === u.uid}
                          title="Delete user"
                        >
                          Delete
                        </button>
                        {updatingUid === u.uid && (
                          <FaCheckCircle className="text-[#1db954] animate-pulse ml-1" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;