import api from './api';
import axios from 'axios';

export const createOrder = async (data, token) => {
  console.log('Creating order with data:', JSON.stringify(data));
  try {
    const response = await api.post('/orders', data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20 giây timeout
    });
    console.log('Create order response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

export const buyNow = async (data, token) => {
  console.log('Buy now with data:', JSON.stringify(data));
  try {
    const response = await api.post('/orders/buy-now', data, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000 // 20 giây timeout
    });
    console.log('Buy now response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error buying now:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

export const getUserOrders = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/orders/my-orders', {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

export const getOrderHistory = async (page = 1, limit = 10) => {
  try {
    const response = await api.get('/orders/my-orders/history', {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching order history:', error);
    throw error;
  }
};

export const getOrderById = async (id, token) => {
  const response = await api.get(`/orders/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createPayment = async (data, token) => {
  const response = await api.post('/payments', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getOrders = async (token) => {
  const response = await api.get('/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
