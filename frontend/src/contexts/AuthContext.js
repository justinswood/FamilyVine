import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// API URL from environment variable
const API_URL = process.env.REACT_APP_API || 'http://localhost:5050';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('familyVine_token');
    const storedUser = localStorage.getItem('familyVine_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Verify token with backend
  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(tokenToVerify);
      } else {
        // Token invalid, clear auth state
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      // Handle rate limiting (429) and other non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Plain text response (e.g., rate limit message)
        const text = await response.text();
        data = { error: text };
      }

      if (response.ok) {
        // Store token and user
        localStorage.setItem('familyVine_token', data.token);
        localStorage.setItem('familyVine_user', JSON.stringify(data.user));
        localStorage.setItem('familyVine_loggedIn', 'true'); // For backwards compatibility

        setToken(data.token);
        setUser(data.user);

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register function
  // Note: All new users are assigned 'viewer' role by backend
  const register = async (username, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      // Handle rate limiting (429) and other non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Plain text response (e.g., rate limit message)
        const text = await response.text();
        data = { error: text };
      }

      if (response.ok) {
        // Store token and user
        localStorage.setItem('familyVine_token', data.token);
        localStorage.setItem('familyVine_user', JSON.stringify(data.user));
        localStorage.setItem('familyVine_loggedIn', 'true');

        setToken(data.token);
        setUser(data.user);

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('familyVine_token');
    localStorage.removeItem('familyVine_user');
    localStorage.removeItem('familyVine_loggedIn');
    setToken(null);
    setUser(null);
  };

  // Refresh token function (can be called before token expires)
  const refreshToken = async () => {
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('familyVine_token', data.token);
        setToken(data.token);
        return true;
      } else {
        logout();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Authenticated fetch wrapper
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      logout();
      throw new Error('Authentication required');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    authenticatedFetch,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
