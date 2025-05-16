import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { executePaypalPayment } from '../services/payment';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const PaypalSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  
  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);
        
        // Lấy các tham số từ URL
        const searchParams = new URLSearchParams(location.search);
        const paymentId = searchParams.get('paymentId');
        const PayerID = searchParams.get('PayerID');
        
        // Lấy orderId từ localStorage
        const orderId = localStorage.getItem('paypalOrderId');
        
        if (!paymentId || !PayerID || !orderId) {
          throw new Error('Thông tin thanh toán không đầy đủ');
        }
        
        // Gọi API để hoàn tất thanh toán
        const result = await executePaypalPayment({
          paymentId,
          PayerID,
          orderId
        });
        
        // Xóa orderId khỏi localStorage sau khi hoàn tất
        localStorage.removeItem('paypalOrderId');
        
        // Lưu thông tin đơn hàng để hiển thị
        setOrderInfo(result.order);
        
        // Hiển thị thông báo thành công
        toast.success('Thanh toán thành công!');
      } catch (err) {
        console.error('Lỗi khi xử lý thanh toán PayPal:', err);
        setError(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
        toast.error(err.message || 'Có lỗi xảy ra khi xử lý thanh toán');
      } finally {
        setLoading(false);
      }
    };
    
    processPayment();
  }, [location.search, token, navigate]);
  
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-lg shadow-md text-center">
        <Loader />
        <p className="mt-4 text-gray-600">Đang xử lý thanh toán...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-2xl font-bold text-red-600 mt-4">Thanh toán thất bại</h2>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Xem đơn hàng của tôi
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto my-12 p-8 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <h2 className="text-2xl font-bold text-green-600 mt-4">Thanh toán thành công!</h2>
        <p className="text-gray-600 mt-2">Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn ngay lập tức.</p>
      </div>
      
      {orderInfo && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold text-gray-800">Thông tin đơn hàng:</h3>
          <p className="mt-2"><span className="font-medium">Mã đơn hàng:</span> #{orderInfo.id}</p>
          <p className="mt-1">
            <span className="font-medium">Tổng thanh toán:</span> {orderInfo.totalAmount?.toLocaleString('vi-VN')}đ
          </p>
        </div>
      )}
      
      <div className="flex justify-center gap-4 mt-6">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Xem đơn hàng của tôi
        </Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          Tiếp tục mua sắm
        </Button>
      </div>
    </div>
  );
};

export default PaypalSuccess; 