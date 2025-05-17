import api from './api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3456/api';

// Lấy giỏ hàng của user hiện tại
export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

// Lấy giỏ hàng của user bất kỳ (chỉ admin)
export const getUserCart = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await api.get('/cart/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user cart:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Thêm sản phẩm vào giỏ hàng
export const addToCart = async (variantId, quantity = 1) => {
  const response = await api.post('/cart', { variantId, quantity });
  return response.data;
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
export const updateCartItem = async (itemId, data) => {
  try {
    const response = await api.put(`/cart/${itemId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating cart item:', error);
    
    // Handle specific errors
    if (error.response?.status === 400) {
      if (error.response?.data?.error === 'stock_exceeded') {
        const errorObj = new Error('Số lượng vượt quá số lượng tồn kho');
        errorObj.code = 'stock_exceeded';
        errorObj.availableStock = error.response?.data?.availableStock;
        errorObj.response = error.response;
        throw errorObj;
      }
    }
    
    // Handle generic errors
    if (error.response) {
      // Server trả về lỗi
      const errorMessage = error.response.data?.message || 'Không thể cập nhật sản phẩm trong giỏ hàng';
      const errorObj = new Error(errorMessage);
      errorObj.response = error.response;
      throw errorObj;
    } else if (error.request) {
      // Không nhận được response từ server
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      // Lỗi khi thiết lập request
      throw new Error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }
};

// Xóa sản phẩm khỏi giỏ hàng
export const deleteCartItem = async (itemId) => {
  try {
    console.log('Deleting cart item:', itemId);
    const response = await api.delete(`/cart/${itemId}`);
    console.log('Delete response:', response.data);

    // Sau khi xóa, lấy lại toàn bộ giỏ hàng
    const cartResponse = await api.get('/cart');
    return cartResponse.data;
  } catch (error) {
    console.error('Error deleting cart item:', error);
    if (error.response) {
      // Server trả về lỗi
      throw error;
    } else if (error.request) {
      // Không nhận được response từ server
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      // Lỗi khi thiết lập request
      throw new Error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }
};

// Cập nhật trạng thái chọn sản phẩm trong giỏ hàng
export const updateCartItemSelected = async (itemId, selected) => {
  try {
    const response = await api.put(`/cart/${itemId}/selected`, { selected });
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server trả về lỗi
      throw error;
    } else if (error.request) {
      // Không nhận được response từ server
      throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
    } else {
      // Lỗi khi thiết lập request
      throw new Error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  }
};

export const updateCartItemSelectedService = async (itemId, selected) => {
  try {
    console.log('Calling API to update selected status:', { itemId, selected });
    const response = await api.put(`/cart/${itemId}/selected`, { selected });
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating cart item selected status:', error);
    throw error;
  }
};
