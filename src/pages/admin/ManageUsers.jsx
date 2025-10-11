import { useEffect, useState } from "react";
import useAxios from "../../hooks/useAxios"; // 🆕
import toast from "react-hot-toast";
import { FaUser, FaUserShield, FaUserTie, FaCheckCircle } from "react-icons/fa";

const ROLES = [
  { value: "user", label: "User", icon: <FaUser className="inline mr-1" /> },
  { value: "staff", label: "Staff", icon: <FaUserTie className="inline mr-1" /> },
  { value: "admin", label: "Admin", icon: <FaUserShield className="inline mr-1" /> },
];

const roleColor = {
  user: "text-purple-400 bg-purple-900/40",
  staff: "text-blue-400 bg-blue-900/40",
  admin: "text-pink-400 bg-pink-900/40",
};

const ManageUsers = () => {
  const { get, put, del } = useAxios(); // add del method
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUid, setUpdatingUid] = useState(null);
  const [activeTab, setActiveTab] = useState("user"); // "user" | "staff" | "admin"

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

  // Filter users by active tab (role)
  const filteredUsers = users.filter(u => (u.type || "user") === activeTab);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-purple-300">
        <FaUserShield className="text-2xl" /> Manage Users
      </h1>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {ROLES.map((role) => (
          <button
            key={role.value}
            className={`px-5 py-2 rounded-t-lg font-semibold flex items-center gap-2 border-b-2 transition
              ${activeTab === role.value
                ? "bg-purple-800 border-purple-400 text-white"
                : "bg-gray-800 border-transparent text-purple-200 hover:bg-purple-900/60"}
            `}
            onClick={() => setActiveTab(role.value)}
          >
            {role.icon}
            {role.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-gray-400 text-center py-10">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow-lg bg-gray-900">
          <table className="min-w-full">
            <thead>
              <tr className="text-purple-200 text-left bg-gray-800">
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
                  <tr key={u.uid} className="border-b border-gray-800 hover:bg-gray-800/60 transition">
                    <td className="py-3 px-4 font-semibold flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-800 text-white font-bold text-lg">
                        {u.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || "U"}
                      </span>
                      {u.name || "-"}
                    </td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${roleColor[u.type || "user"]}`}>
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
                            className="appearance-none bg-gradient-to-r from-purple-900 via-gray-900 to-gray-800 text-purple-200 font-semibold rounded-lg px-4 py-2 pr-10 border-2 border-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow transition cursor-pointer hover:border-pink-500"
                            disabled={updatingUid === u.uid}
                            style={{
                              boxShadow: updatingUid === u.uid ? "0 0 0 2px #a21caf" : undefined,
                            }}
                          >
                            {ROLES.map((role) => (
                              <option
                                key={role.value}
                                value={role.value}
                                className="bg-gray-900 text-purple-300"
                              >
                                {role.label}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-lg">
                            ▼
                          </span>
                        </div>
                        <button
                          className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded-lg font-semibold ml-2"
                          onClick={() => handleDeleteUser(u.uid)}
                          disabled={updatingUid === u.uid}
                          title="Delete user"
                        >
                          Delete
                        </button>
                        {updatingUid === u.uid && (
                          <FaCheckCircle className="text-green-400 animate-pulse ml-1" />
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