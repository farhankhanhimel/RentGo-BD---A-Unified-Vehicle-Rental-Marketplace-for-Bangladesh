import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (err) {
      localStorage.removeItem('token');
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw message;
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/verify-otp', { userId, otp });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setError(message);
      throw message;
    }
  };

  const resendOTP = async (userId) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/resend-otp', { userId });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend OTP';
      setError(message);
      throw message;
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        setUser(response.data.user);
      }
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw message;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setError('');
  };

  const updateProfile = async (profileData) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Update failed';
      setError(message);
      throw message;
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/auth/upload-avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser({ ...user, avatar: response.data.avatar });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Upload failed';
      setError(message);
      throw message;
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/change-password', {
        oldPassword,
        newPassword,
        confirmPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Password change failed';
      setError(message);
      throw message;
    }
  };

  const addAddress = async (addressData) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/add-address', addressData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add address';
      setError(message);
      throw message;
    }
  };

  const updateAddress = async (addressId, addressData) => {
    try {
      setError('');
      const response = await axios.put(`/api/auth/address/${addressId}`, addressData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update address';
      setError(message);
      throw message;
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      setError('');
      const response = await axios.delete(`/api/auth/address/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete address';
      setError(message);
      throw message;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
