import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ReminderNotifier from '@/components/ReminderNotifier';
import { apiSelfExams } from '@/lib/api';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: ('fighter' | 'survivor' | 'wellness')[];
}

export const ProtectedRoute = ({ children, allowedUserTypes }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();
  const { userType } = useParams<{ userType?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const REQUIRE_LOGIN_ALWAYS = String(import.meta.env.VITE_REQUIRE_LOGIN_ALWAYS || '').toLowerCase() === 'true';
  const sessionAuth = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('hopebloom_auth') : null;
  const [mandatoryCheck, setMandatoryCheck] = useState<{ loading: boolean; required: boolean }>({
    loading: true,
    required: false,
  });

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

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isAuthenticated || !user?.id) return;
      try {
        const status = await apiSelfExams.mandatoryStatus(user.id);
        if (cancelled) return;
        setMandatoryCheck({ loading: false, required: Boolean((status as any)?.required) });
      } catch {
        if (cancelled) return;
        setMandatoryCheck({ loading: false, required: false });
      }
    };
    setMandatoryCheck((s) => ({ ...s, loading: true }));
    run();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, location.pathname]);

  // Check authentication
  if (!isAuthenticated || (REQUIRE_LOGIN_ALWAYS && !sessionAuth)) {
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

  if (!mandatoryCheck.loading && mandatoryCheck.required) {
    const targetPath = `/health-tracker/${user.userType}`;
    const isOnTarget = location.pathname === targetPath;
    if (!isOnTarget) {
      return <Navigate to={`${targetPath}?tab=selfcheck`} replace />;
    }
  }

  return (
    <>
      <ReminderNotifier />
      {children}
    </>
  );
};
