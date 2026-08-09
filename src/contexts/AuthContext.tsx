/**
 * Authentication Context
 * Manages authentication state and provides auth methods
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import { migrateLegacyTokens } from '../services/secureTokenStorage';
import { User } from '../types';
import { analytics, setUserContext, clearUserContext } from '../services/observability';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      await migrateLegacyTokens();
      const isAuth = await authApi.isAuthenticated();
      if (isAuth) {
        const storedUser = await authApi.getCurrentUser();
        setUser(storedUser);
        if (storedUser) {
          setUserContext({ id: storedUser.id, email: storedUser.email, userType: 'CUSTOMER' });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      setUser(response.user);
      setUserContext({ id: response.user.id, email: response.user.email, userType: 'CUSTOMER' });
      analytics.track('auth.login.success', { userId: response.user.id, method: 'email' });
    } catch (error: any) {
      console.error('Login failed:', error);
      analytics.track('auth.login.fail', { email, reason: error?.message || 'Login failed' });
      throw error;
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await authApi.loginWithGoogle(idToken);
      setUser(response.user);
      setUserContext({ id: response.user.id, email: response.user.email, userType: 'CUSTOMER' });
      analytics.track('auth.login.success', { userId: response.user.id, method: 'google' });
    } catch (error: any) {
      console.error('Google login failed:', error);
      analytics.track('auth.login.fail', { reason: error?.message || 'Google login failed' });
      throw error;
    }
  };

  const register = async (data: { name: string; email: string; phone?: string; password: string }) => {
    try {
      await authApi.register(data);
      await login(data.email, data.password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearUserContext();
      setUser(null);
    }
  };


  const refreshUser = async () => {
    try {
      const storedUser = await authApi.getCurrentUser();
      setUser(storedUser);
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
