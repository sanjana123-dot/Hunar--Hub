import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

function messageFromAxiosError(error, fallback) {
  const data = error.response?.data;
  if (data == null) return error.message || fallback;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  if (typeof data === 'object' && !Array.isArray(data)) {
    const first = Object.values(data).find(
      (v) => typeof v === 'string' && v.trim()
    );
    if (first) return first;
  }
  return fallback;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    // Always start logged out on the public landing page.
    if (window.location.pathname === '/') {
      clearAuthState();
      setLoading(false);
      return;
    }

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(parsedUser);
      } catch {
        clearAuthState();
      }
    } else {
      clearAuthState();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      
      // Ensure role is a string (handle enum serialization)
      if (userData.role && typeof userData.role !== 'string') {
        userData.role = userData.role.toString();
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      return {
        success: false,
        message: messageFromAxiosError(error, 'Login failed'),
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, ...user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: messageFromAxiosError(error, 'Registration failed'),
      };
    }
  };

  const logout = () => {
    clearAuthState();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
