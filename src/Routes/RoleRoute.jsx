import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ allowed, children, redirect = "/forbidden" }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.type)) return <Navigate to={redirect} replace />;
  return children;
};

export default RoleRoute;
