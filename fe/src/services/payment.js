import api from './api';

// Thanh toán COD
export const createCodPayment = async (orderData) => {
  console.log('Creating COD payment for order:', orderData.orderId);
  try {
    const response = await api.post('/payments/cod', orderData, {
      timeout: 15000, // 15 giây timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('COD payment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating COD payment:', error);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    throw error;
  }
};

// Tạo thanh toán VNPay
export const createVNPayPayment = async (orderData) => {
  try {
    const response = await api.post('/payments/create_vnpay_payment', orderData);
    return response.data;
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    throw error;
  }
};

export const createMomoPayment = async (data) => {
  try {
    const response = await api.post('/payments/create_momo_payment', data);
    return response.data;
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    throw error;
  }
};
