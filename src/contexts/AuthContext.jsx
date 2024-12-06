// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Add a state to track if a token refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Add a queue to store pending requests
  const [refreshQueue, setRefreshQueue] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      setUser(data.userdata);
      localStorage.setItem('user', JSON.stringify(data.userdata));
      localStorage.setItem('accessToken', data.token.access);
      localStorage.setItem('refreshToken', data.token.refresh);

      toast({ title: "Success", description: "Logged in successfully" });
      navigate('/dashboard');
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        setRefreshQueue(queue => [...queue, { resolve, reject }]);
      });
    }
  
    setIsRefreshing(true);
  
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "token_not_valid" && errorData.detail === "Token is blacklisted") {
          // Token is blacklisted, force logout
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error('Token refresh failed');
      }
  
      const data = await response.json();
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
  
      refreshQueue.forEach(({ resolve }) => resolve(data.access));
      setRefreshQueue([]);
  
      return data.access;
    } catch (error) {
      refreshQueue.forEach(({ reject }) => reject(error));
      setRefreshQueue([]);
      logout();
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, logout, refreshQueue]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    const expiry = JSON.parse(atob(token.split('.')[1])).exp;
    return Math.floor(new Date().getTime() / 1000) >= expiry;
  };
  
  const getAccessToken = useCallback(async () => {
    let accessToken = localStorage.getItem('accessToken');
    
    if (isTokenExpired(accessToken)) {
      try {
        accessToken = await refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        logout();
        throw error;
      }
    }
    
    return accessToken;
  }, [refreshToken, logout]);

  // Wrapper for authenticated API calls
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const token = await getAccessToken();
    const headers = {
      ...options.headers,
      'Authorization': `JWT ${token}`,
    };
    
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        // Token might be invalid, try refreshing
        const newToken = await refreshToken();
        headers['Authorization'] = `JWT ${newToken}`;
        return fetch(url, { ...options, headers });
      }
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }, [getAccessToken, refreshToken]);

  const preRegister = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/pre-register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let err;
        if(errorData.email){
          err = errorData.email[0]
          throw new Error(err || 'Pre-registration failed');
        }
        throw new Error(errorData.detail || 'Pre-registration failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Pre-registration error:', error);
      throw error;
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/verify/email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Email verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const register = async (userData, verificationCode) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/accounts/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          mobile: userData.mobile,
          first_name: userData.first_name,
          last_name: userData.lastName,
          password: userData.password,
          code: verificationCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let err
        if(errorData.mobile){
          err = errorData.mobile[0]
        }
        throw new Error(err || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    preRegister,
    verifyEmail,
    register,
    authenticatedFetch,
    loading
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );};

export const useAuth = () => useContext(AuthContext);