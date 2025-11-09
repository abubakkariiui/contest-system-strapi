import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  loginRequest,
  registerRequest,
  getCurrentUser,
} from '../services/api.js';

const STORAGE_KEY = 'contest_jwt';

const AuthContext = createContext({
  user: null,
  token: null,
  status: 'loading',
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      if (!token) {
        if (active) {
          setUser(null);
          setStatus('ready');
        }
        return;
      }

      setStatus('loading');
      try {
        const me = await getCurrentUser(token);
        if (active) {
          setUser(me);
          setStatus('ready');
        }
      } catch (error) {
        console.error('Unable to sync authenticated user', error);
        if (active) {
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
          setStatus('ready');
        }
      }
    };

    syncUser();

    return () => {
      active = false;
    };
  }, [token]);

  const login = async ({ identifier, password }) => {
    setStatus('loading');
    try {
      const result = await loginRequest({ identifier, password });
      localStorage.setItem(STORAGE_KEY, result.jwt);
      setToken(result.jwt);
      if (result.user) {
        setUser(result.user);
      }
      return result.user;
    } catch (error) {
      setStatus('ready');
      throw error;
    }
  };

  const register = async ({ username, email, password }) => {
    setStatus('loading');
    try {
      const result = await registerRequest({ username, email, password });
      localStorage.setItem(STORAGE_KEY, result.jwt);
      setToken(result.jwt);
      if (result.user) {
        setUser(result.user);
      }
      return result.user;
    } catch (error) {
      setStatus('ready');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setStatus('ready');
  };

  const refreshUser = async () => {
    if (!token) {
      setUser(null);
      return null;
    }
    const me = await getCurrentUser(token);
    setUser(me);
    return me;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
