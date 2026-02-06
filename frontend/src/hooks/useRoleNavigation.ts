import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Custom hook for role-aware navigation
 * Handles routing for patients (with userType), admins, and doctors
 */
export const useRoleNavigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Navigate to dashboard based on user role
   */
  const goToDashboard = () => {
    if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user?.role === 'doctor') {
      navigate('/doctor/dashboard', { replace: true });
    } else {
      const userType = user?.userType || 'wellness';
      navigate(`/dashboard/${userType}`, { replace: true });
    }
  };

  /**
   * Navigate to a feature page with appropriate role-based routing
   * @param route - The feature route (e.g., 'ai-assistant', 'health-tracker')
   */
  const goToFeature = (route: string) => {
    if (user?.role === 'admin' || user?.role === 'doctor') {
      navigate(`/${route}`);
    } else {
      const userType = user?.userType || 'wellness';
      navigate(`/${route}/${userType}`);
    }
  };

  /**
   * Navigate to profile page
   */
  const goToProfile = () => {
    if (user?.role === 'admin' || user?.role === 'doctor') {
      navigate('/profile');
    } else {
      const userType = user?.userType || 'wellness';
      navigate(`/profile/${userType}`);
    }
  };

  /**
   * Get the current effective userType
   * Returns null for admin/doctor, userType for patients
   */
  const getEffectiveUserType = (): string | null => {
    if (user?.role === 'admin' || user?.role === 'doctor') {
      return null;
    }
    return user?.userType || 'wellness';
  };

  return {
    goToDashboard,
    goToFeature,
    goToProfile,
    getEffectiveUserType,
  };
};
