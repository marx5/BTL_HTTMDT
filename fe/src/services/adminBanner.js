import api from './api';
import { showError } from '../utils/notification';

// Lấy danh sách banner
export const getBanners = async (page = 1, limit = 10, token) => {
  try {
    const response = await api.get(`/banners?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy banners:', error);
    showError(error, 'Có lỗi xảy ra trong quá trình lấy banners.');
    throw error;
  }
};

// Thêm banner mới
export const createBanner = async (formData, token) => {
  try {
    const response = await api.post('/banners', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create banner');
  }
};

// Cập nhật banner
export const updateBanner = async (id, formData, token) => {
  try {
    const response = await api.put(`/banners/${id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update banner');
  }
};

// Xóa banner
export const deleteBanner = async (id, token) => {
  try {
    const response = await api.delete(`/banners/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete banner');
  }
};
