import axios from 'axios';
import { showError } from '../utils/notification';

// Biến để kiểm soát việc hiển thị thông báo lỗi 401
let isShowingAuthError = false;

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Thêm cấu hình để kiểm soát hiển thị lỗi
    config.showError = config.showError !== false; // Mặc định là true
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers,
    });

    // Kiểm tra xem có nên hiển thị lỗi không
    const shouldShowError = error.config?.showError !== false;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        if (currentPath !== '/admin/login') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin/login';
          if (shouldShowError && !isShowingAuthError) {
            isShowingAuthError = true;
            showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            // Reset biến sau một khoảng thời gian
            setTimeout(() => {
              isShowingAuthError = false;
            }, 5000);
          }
        }
      } else if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        if (shouldShowError && !isShowingAuthError) {
          isShowingAuthError = true; 
          showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          // Reset biến sau một khoảng thời gian
          setTimeout(() => {
            isShowingAuthError = false;
          }, 5000);
        }
      }
    }
    // Handle 403 Forbidden
    else if (error.response?.status === 403) {
      if (window.location.pathname.startsWith('/admin')) {
        if (shouldShowError) {
          showError('Bạn không có quyền truy cập trang này');
        }
        window.location.href = '/admin/login';
      } else {
        if (shouldShowError) {
          showError('Bạn không có quyền thực hiện thao tác này');
        }
      }
    }
    // Handle 429 Too Many Requests
    else if (error.response?.status === 429) {
      if (shouldShowError) {
        showError('Quá nhiều yêu cầu, vui lòng thử lại sau');
      }
    }
    // Handle other errors
    else {
      // Chỉ hiển thị lỗi nếu showError = true
      if (shouldShowError) {
        showError(error);
      }
    }

    return Promise.reject(error);
  }
);

// Thêm hàm helper để gọi API không hiển thị lỗi
export const apiCallWithoutErrorToast = (method, url, data = null, config = {}) => {
  return api({
    method,
    url,
    data,
    ...config,
    showError: false
  });
};

export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = process.env.REACT_APP_API_URL;
  return `${baseUrl}/api/${path}`;
};

export default api;
