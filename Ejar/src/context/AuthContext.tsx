// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API, { setAuthToken } from '@/api/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getStoredTokens = () => ({
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token'),
  });

  const clearTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAuthToken(null);
  };

  const refreshAccessToken = useCallback(async (refreshToken: string | null) => {
    if (!refreshToken) return null;
    try {
      const { data } = await API.post('users/token/refresh/', { refresh: refreshToken });
      const { access } = data as { access?: string };
      if (!access) {
        clearTokens();
        return null;
      }
      localStorage.setItem('access_token', access);
      setAuthToken(access);
      return access;
    } catch {
      clearTokens();
      return null;
    }
  }, []);

  const fetchMe = useCallback(async () => {
    const { access, refresh } = getStoredTokens();
    if (!access) {
      setUser(null);
      return;
    }

    setAuthToken(access);

    try {
      const { data } = await API.get<User>('users/me/');
      setUser(data);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        const newAccess = await refreshAccessToken(refresh);
        if (newAccess) {
          try {
            const { data } = await API.get<User>('users/me/');
            setUser(data);
            return;
          } catch {
            // fall through to logout below
          }
        }
      }
      clearTokens();
      setUser(null);
    }
  }, [refreshAccessToken]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      await fetchMe();
      if (isMounted) setLoading(false);
    };
    load();

    const onAuthChanged = () => fetchMe();
    window.addEventListener('auth-changed', onAuthChanged);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-changed', onAuthChanged);
    };
  }, [fetchMe]);

  const logout = async () => {
    clearTokens();
    setUser(null);
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export { AuthContext, AuthProvider };