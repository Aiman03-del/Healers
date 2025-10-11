import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaMusic, FaChartBar, FaSignOutAlt, FaUsersCog } from "react-icons/fa";

const SidebarLink = ({ to, label, icon, location }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
      location.pathname === to
        ? 'bg-purple-700 text-white shadow'
        : 'hover:bg-purple-800/60 text-purple-200'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
  </Link>
);

const DashboardSidebar = ({ onLogout }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <>
      <div className="flex flex-col items-center py-8 bg-purple-900/80 rounded-b-3xl shadow-lg">
        <h2 className="text-2xl font-extrabold mb-2 flex items-center gap-2">
          <FaChartBar className="text-purple-300" /> Dashboard
        </h2>
        <div className="w-16 h-16 rounded-full bg-purple-700 flex items-center justify-center mb-2 shadow-lg">
          <span className="text-3xl font-bold text-white">{user?.name?.[0] || user?.email?.[0] || "U"}</span>
        </div>
        <p className="text-xs text-purple-200">{user?.email}</p>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2">
        <SidebarLink
          to="/"
          label="Home"
          icon={<FaChartBar />}
          location={location}
        />
        {(user?.type === "admin" || user?.type === "staff") && (
          <>
            <SidebarLink
              to="/dashboard/add-song"
              label="Add New Song"
              icon={<FaPlus />}
              location={location}
            />
            <SidebarLink
              to="/dashboard/songs"
              label="All Songs"
              icon={<FaMusic />}
              location={location}
            />
            <SidebarLink
              to="/dashboard/statistics"
              label="Statistics"
              icon={<FaChartBar />}
              location={location}
            />
            {user?.type === "admin" && (
              <SidebarLink
                to="/dashboard/manage-users"
                label="Manage Users"
                icon={<FaUsersCog />}
                location={location}
              />
            )}
          </>
        )}
      </nav>
      <div className="px-4 pb-6 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-sm bg-red-600 px-3 py-2 rounded-lg hover:bg-red-700 transition font-semibold shadow"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </>
  );
};

export default DashboardSidebar;
