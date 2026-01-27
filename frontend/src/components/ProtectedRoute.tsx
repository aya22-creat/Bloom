import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: ('fighter' | 'survivor' | 'wellness')[];
}

export const ProtectedRoute = ({ children, allowedUserTypes }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && user && !allowedUserTypes.includes(user.userType)) {
    return <Navigate to={`/dashboard/${user.userType}`} replace />;
  }

  return <>{children}</>;
};
