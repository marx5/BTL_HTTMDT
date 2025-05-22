import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';

function PaymentResult() {
  const [result, setResult] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    setResult(result);
  }, [location]);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleViewOrder = () => {
    if (result?.vnp_TxnRef) {
      navigate(`/orders/${result.vnp_TxnRef}`);
    }
  };

  if (!result) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Đang xử lý kết quả thanh toán...</h2>
          <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  if (result.vnp_ResponseCode === "00") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán thành công!</h2>
          <p className="text-gray-600 mb-6">Mã giao dịch: {result.vnp_TransactionNo}</p>
          <div className="flex justify-center space-x-4">
            <Button variant="primary" onClick={handleViewOrder}>
              Xem đơn hàng
            </Button>
            <Button variant="outline" onClick={handleBackToHome}>
              Về trang chủ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-center">
      <div className="bg-white rounded-lg shadow p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanh toán thất bại</h2>
        <p className="text-gray-600 mb-6">Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau.</p>
        <div className="flex justify-center space-x-4">
          <Button variant="primary" onClick={() => navigate(-1)}>
            Thử lại
          </Button>
          <Button variant="outline" onClick={handleBackToHome}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}

export default PaymentResult; 