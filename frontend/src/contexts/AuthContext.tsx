import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string | null;
  userType: 'fighter' | 'survivor' | 'wellness';
  language?: 'ar' | 'en';
  token: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hopebloom_auth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const REQUIRE_LOGIN_ALWAYS = String(import.meta.env.VITE_REQUIRE_LOGIN_ALWAYS || '').toLowerCase() === 'true';

  // Load user from localStorage on mount
  useEffect(() => {
    if (REQUIRE_LOGIN_ALWAYS) {
      // Keep session-only auth between pages during the same browser session
      const sessionAuth = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (sessionAuth) {
        try {
          const userData = JSON.parse(sessionAuth);
          setUser(userData);
        } catch {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      return;
    }
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const userData = JSON.parse(storedAuth);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, [REQUIRE_LOGIN_ALWAYS]);

  const login = (userData: User) => {
    setUser(userData);
    if (REQUIRE_LOGIN_ALWAYS) {
      // Keep auth only for current session (do not auto-login on next app open)
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      } catch {}
    } else {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try { sessionStorage.removeItem(AUTH_STORAGE_KEY); } catch {}
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    token: user?.token || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
