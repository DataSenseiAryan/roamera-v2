import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('roamera_user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // ignore corrupt storage
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('roamera_token', res.data.token);
    await AsyncStorage.setItem('roamera_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password });
    await AsyncStorage.setItem('roamera_token', res.data.token);
    await AsyncStorage.setItem('roamera_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    await AsyncStorage.multiRemove(['roamera_token', 'roamera_user']);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
