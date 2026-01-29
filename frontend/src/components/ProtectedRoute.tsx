import { ReactNode, useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: ('fighter' | 'survivor' | 'wellness')[];
}

export const ProtectedRoute = ({ children, allowedUserTypes }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const { userType } = useParams<{ userType?: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Validate userType parameter if present
    if (userType) {
      const validUserTypes = ['fighter', 'survivor', 'wellness'];
      if (!validUserTypes.includes(userType)) {
        console.warn(`Invalid userType in URL: ${userType}`);
        navigate('/404', { replace: true });
      }
      
      // Check if userType matches authenticated user's type
      if (user && user.userType !== userType) {
        console.warn(`UserType mismatch: URL has ${userType} but user is ${user.userType}`);
        navigate(`/dashboard/${user.userType}`, { replace: true });
      }
    }
  }, [userType, user, navigate]);

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Check if user data is valid
  if (!user || !user.userType) {
    console.error('User authenticated but missing required data');
    localStorage.removeItem('hopebloom_auth');
    return <Navigate to="/login" replace />;
  }

  // Check user type restrictions
  if (allowedUserTypes && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to={`/dashboard/${user.userType}`} replace />;
  }

  return <>{children}</>;
};
