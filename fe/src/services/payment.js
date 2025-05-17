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
