import api from './api';

export const login = async (email, password, recaptchaToken) => {
  try {
    console.log('Sending login request with:', {
      email,
      password,
      recaptchaToken,
    });
    const response = await api.post('/auth/login', {
      email,
      password,
      recaptchaToken,
    });

    console.log('Login response:', response);

    // Kiểm tra response và response.data
    if (!response || !response.data) {
      throw new Error('Invalid response from server');
    }

    // Lấy token từ response data
    const { token, user } = response.data;

    if (!token) {
      throw new Error('No token received from server');
    }

    // Lưu token vào localStorage
    localStorage.setItem('token', token);
    console.log('Token saved:', token);

    return response.data;
  } catch (error) {
    console.error(
      'Login error details:',
      error.response?.data || error.message
    );
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('Đăng nhập thất bại. Vui lòng thử lại.');
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  const response = await api.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};

export const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await api.put('/users/me', userData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};
