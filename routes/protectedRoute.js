import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  console.log("PROTECTED ORIGIN:", window.location.origin);

  const token = localStorage.getItem("adminToken");

  console.log("Protected Route Token:", token);
  console.log("ALL STORAGE:", localStorage);

  if (!token) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

export default ProtectedRoute;