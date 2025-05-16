import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';

const PaypalCancel = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Xóa orderId khỏi localStorage vì thanh toán đã bị hủy
    localStorage.removeItem('paypalOrderId');
    
    // Hiển thị thông báo
    toast.error('Thanh toán đã bị hủy');
  }, []);
  
  return (
    <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <svg className="w-16 h-16 text-orange-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h2 className="text-2xl font-bold text-orange-600 mt-4">Thanh toán đã bị hủy</h2>
        <p className="text-gray-600 mt-2">
          Bạn đã hủy quá trình thanh toán PayPal. Đơn hàng của bạn chưa được xử lý.
        </p>
      </div>
      
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate('/checkout')}>
          Quay lại thanh toán
        </Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
};

export default PaypalCancel; 