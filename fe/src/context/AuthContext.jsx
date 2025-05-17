/* eslint-disable no-useless-catch */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { login, register, getProfile, updateProfile } from '../services/auth';
import api from '../services/api';
import { showError, showSuccess } from '../utils/notification';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const reduxAuth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  // Sử dụng dữ liệu từ Redux nếu có
  const [user, setUser] = useState(reduxAuth.user || null);
  const [loading, setLoading] = useState(!reduxAuth.user);
  const [isAuthenticated, setIsAuthenticated] = useState(reduxAuth.isAuthenticated || false);
  const navigate = useNavigate();

  // Chỉ thực hiện kiểm tra token nếu không có dữ liệu từ Redux
  useEffect(() => {
    const checkToken = async () => {
      // Nếu đã có thông tin xác thực từ Redux, sử dụng nó
      if (reduxAuth.user && reduxAuth.isAuthenticated) {
        setUser(reduxAuth.user);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        try {
          // Thêm header Authorization
          const response = await api.get('/users/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Nếu không có data, xóa token và user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          // Nếu có lỗi 401, xóa token và user
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          } else {
            // Nếu lỗi khác, sử dụng thông tin đã lưu
            try {
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
            } catch (parseError) {
              console.error('Error parsing stored user:', parseError);
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [reduxAuth.user, reduxAuth.isAuthenticated]);

  // Cập nhật state từ Redux khi Redux thay đổi
  useEffect(() => {
    if (reduxAuth.user) {
      setUser(reduxAuth.user);
      setIsAuthenticated(reduxAuth.isAuthenticated);
    }
  }, [reduxAuth.user, reduxAuth.isAuthenticated]);

  const loginUser = async (email, password, recaptchaToken) => {
    try {
      const response = await login(email, password, recaptchaToken);
      console.log('Login response in context:', response);

      if (!response || !response.token || !response.user) {
        throw new Error('Invalid response format from server');
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      console.error('Login error in context:', error);
      throw error;
    }
  };

  const registerUser = async (userData) => {
    try {
      const response = await register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logoutUser = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      showSuccess('Đăng xuất thành công');
    } catch (error) {
      console.error('Logout error:', error);
      showError('Có lỗi xảy ra khi đăng xuất');
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      const response = await updateProfile(userData);
      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      token: localStorage.getItem('token'),
      login: loginUser,
      register: registerUser,
      logout: logoutUser,
      updateProfile: updateUserProfile,
    }),
    [user, loading, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
