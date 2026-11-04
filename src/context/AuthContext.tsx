import React, { createContext, useContext, useState, useEffect } from 'react';
import { Staff } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: Staff | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: Staff) => void;
  logout: () => void;
  updateUser: (user: Partial<Staff>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ibb_auth_token'));
  const [user, setUser] = useState<Staff | null>(() => {
    const saved = localStorage.getItem('ibb_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const curToken = localStorage.getItem('ibb_auth_token');
    if (!curToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('ibb_auth_user', JSON.stringify(res.data.user));
      }
    } catch {
      localStorage.removeItem('ibb_auth_token');
      localStorage.removeItem('ibb_auth_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = (newToken: string, newUser: Staff) => {
    localStorage.setItem('ibb_auth_token', newToken);
    localStorage.setItem('ibb_auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('ibb_auth_token');
    localStorage.removeItem('ibb_auth_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (partial: Partial<Staff>) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    setUser(updated);
    localStorage.setItem('ibb_auth_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
