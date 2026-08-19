import { createContext, useState, useContext } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  if (!storedUser || !storedToken) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [loading] = useState(false);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password });
      const { token, userId, username: userName, role, instituteId } = response.data;
      
      const userData = { 
        id: userId, 
        username: userName, 
        role: role,
        instituteId: instituteId
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Login successful! 🎉');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || (typeof error.response?.data === 'string' ? error.response.data : 'Login failed!');
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const responseText = response.data;
      // Backend returns a plain string — check if it's an error
      if (typeof responseText === 'string' && responseText.startsWith('Error:')) {
        toast.error(responseText.replace('Error: ', ''));
        return false;
      }
      toast.success('Registration submitted! Awaiting Institute Admin approval. ⏳');
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data || 'Registration failed! Please try again.';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Registration failed!');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
