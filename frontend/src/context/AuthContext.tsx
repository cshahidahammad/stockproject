import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LoginPayload, SignUpPayload, User } from '../types';
import { api, tokenStorage } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  signup: (payload: SignUpPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  // Check existing session on mount
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      const existingToken = tokenStorage.get();
      if (!existingToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.getMe();
        if (isMounted) {
          setUser(currentUser);
          setToken(existingToken);
        }
      } catch {
        if (isMounted) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [handleUnauthorized]);

  const login = async (payload: LoginPayload): Promise<void> => {
    setAuthError(null);
    try {
      const resp = await api.login(payload);
      setUser(resp.user);
      setToken(resp.token);
    } catch (err: any) {
      const message = err.message || 'Login failed. Please check your credentials.';
      setAuthError(message);
      throw err;
    }
  };

  const signup = async (payload: SignUpPayload): Promise<void> => {
    setAuthError(null);
    try {
      const resp = await api.signup(payload);
      setUser(resp.user);
      setToken(resp.token);
    } catch (err: any) {
      const message = err.message || 'Registration failed. Please try again.';
      setAuthError(message);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clear();
      setUser(null);
      setToken(null);
      setAuthError(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    authError,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
