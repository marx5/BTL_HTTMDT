import api from './api';

// Lấy danh sách đơn hàng
export const getOrders = async (page = 1, limit = 10, status = '', token) => {
  const response = await api.get('/orders', {
    params: { page, limit, status },
    headers: { Authorization: `Bearer ${token}` },
  });
  return response;
};

// Lấy chi tiết đơn hàng
export const getOrderById = async (id, token) => {
  try {
    const response = await api.get(`/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (id, status, token) => {
  const response = await api.put(
    `/orders/${id}`,
    { status },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return response;
};
