import api from './api';

// Lấy danh sách người dùng
export const getUsers = async (page = 1, limit = 10) => {
  try {
    // console.log('Fetching users with params:', { page, limit });
    const response = await api.get('/users', {
      params: { page, limit },
    });
    console.log('Users response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Lấy chi tiết người dùng
export const getUserById = async (id) => {
  try {
    console.log('Fetching user by id:', id);
    const response = await api.get(`/users/${id}`);
    // console.log('User response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Xóa người dùng
export const deleteUser = async (id) => {
  try {
    console.log('Deleting user:', id);
    const response = await api.delete(`/users/${id}`);
    console.log('Delete response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Lấy danh sách đơn hàng của người dùng
export const getUserOrders = async (userId, page = 1, limit = 10) => {
  try {
    console.log('Fetching user orders:', { userId, page, limit });
    const response = await api.get(`/users/${userId}/orders`, {
      params: { page, limit },
    });
    console.log('Orders response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};
