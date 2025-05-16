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
export const createVnpayPayment = async (orderData) => {
  console.log('Creating VNPay payment with data:', JSON.stringify(orderData));
  try {
    // Đảm bảo dữ liệu gửi đi đúng định dạng theo yêu cầu của VNPAY
    const vnpayData = {
      amount: orderData.amount, // Server sẽ nhân 100
      orderId: orderData.orderId,
      orderInfo: orderData.orderInfo || `Thanh toán đơn hàng #${orderData.orderId}`,
      ipAddr: orderData.ipAddr || '127.0.0.1',
      returnUrl: orderData.returnUrl || `${window.location.origin}/payment-result`,
      locale: orderData.locale || 'vn',
      bankCode: orderData.bankCode || '' // Chỉ định ngân hàng nếu cần
    };
    
    const response = await api.post('/payments/vnpay/create', vnpayData, {
      timeout: 20000, // 20 giây timeout
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('VNPay payment response:', response.data);
    
    // Nếu không có paymentUrl, log lỗi để debug
    if (!response.data.paymentUrl) {
      console.error('VNPay response missing paymentUrl:', response.data);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

// Tạo thanh toán PayPal
export const createPaypalPayment = async (orderData) => {
  console.log('Creating PayPal payment with data:', JSON.stringify(orderData));
  try {
    const response = await api.post('/payments/paypal/create', orderData, {
      timeout: 20000, // 20 giây timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('PayPal payment response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
};

// Hoàn tất thanh toán PayPal
export const executePaypalPayment = async (paymentData) => {
  console.log('Executing PayPal payment with data:', JSON.stringify(paymentData));
  try {
    const response = await api.post('/payments/paypal/execute', paymentData, {
      timeout: 20000, // 20 giây timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('PayPal execute response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error executing PayPal payment:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    }
    throw error;
  }
}; 