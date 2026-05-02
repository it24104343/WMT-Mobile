import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isFirstLogin && location.pathname !== '/first-reset') {
    // Force reset password
    return <Navigate to="/first-reset" replace />;
  }

  // If roles are provided, check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
