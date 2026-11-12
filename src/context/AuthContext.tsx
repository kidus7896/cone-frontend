import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, VerifyOtpResponse } from '../types';
import { apiClient, getAuthToken, clearAuthToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (phone: string, code: string, privacyConsent: boolean) => Promise<VerifyOtpResponse>;
  verifyMfa: (mfaToken: string, code: string) => Promise<User>;
  requestOtp: (phone: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    const existingToken = getAuthToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiClient.getMe();
      setUser(res.user);
      setToken(existingToken);
    } catch {
      clearAuthToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleAdminUnauthorized = () => {
      clearAuthToken();
      setUser(null);
      setToken(null);
      const currentPath = window.location.pathname || '/admin';
      const target = `/signin?redirect=${encodeURIComponent(currentPath.startsWith('/admin') ? currentPath : '/admin')}`;
      if (window.location.pathname !== '/signin') {
        window.history.pushState({}, '', target);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    window.addEventListener('cone:admin-unauthorized', handleAdminUnauthorized);
    return () => window.removeEventListener('cone:admin-unauthorized', handleAdminUnauthorized);
  }, []);

  const requestOtp = async (phone: string) => {
    return apiClient.requestOtp(phone);
  };

  const loginWithOtp = async (phone: string, code: string, privacyConsent: boolean) => {
    const res = await apiClient.verifyOtp(phone, code, privacyConsent);
    if (!res.mfaRequired) {
      setUser(res.user);
      setToken(res.token);
    }
    return res;
  };

  const verifyMfa = async (mfaToken: string, code: string) => {
    const res = await apiClient.verifyMfa(mfaToken, code);
    setUser(res.user);
    setToken(res.token);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        loginWithOtp,
        verifyMfa,
        requestOtp,
        logout,
        checkAuth,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
