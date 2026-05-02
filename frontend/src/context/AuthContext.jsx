import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for user token on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAuthToken(parsedUser.token);
    }
    setLoading(false);
  }, []);

  const setAuthToken = (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  };

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const userData = res.data.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setAuthToken(userData.token);
      toast.success('Logged in successfully');
      return { success: true, isFirstLogin: userData.isFirstLogin };
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      return { success: false, message: err.response?.data?.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setAuthToken(null);
    toast.info('Logged out');
  };

  // Called after first login forced reset
  const updateFirstLoginStatus = () => {
    if (user) {
      const updatedUser = { ...user, isFirstLogin: false };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const updateProfileImage = (imageUrl) => {
    if (user) {
      const updatedUser = { ...user, profileImage: imageUrl };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateFirstLoginStatus, updateProfileImage }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
