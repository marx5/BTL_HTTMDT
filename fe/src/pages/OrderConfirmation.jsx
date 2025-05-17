import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getOrderById } from '../services/order';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import { toast } from 'react-hot-toast';

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await getOrderById(id, token);
        setOrder(response);
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng');
        toast.error('Không thể tải thông tin đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchOrder();
    }
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            {error || 'Không tìm thấy đơn hàng'}
          </h1>
          <Button variant="primary" onClick={() => navigate('/')}>
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Xác định trạng thái đơn hàng và thông điệp hiển thị
  let orderStatus = {
    iconColor: 'green',
    title: 'Đơn hàng của bạn đã được xác nhận!',
    message: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ gửi email xác nhận đến bạn sớm.',
    icon: (
      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    )
  };

  // Nếu đơn hàng đang chờ thanh toán
  if (paymentStatus === 'pending' || order.paymentStatus === 'PENDING') {
    orderStatus = {
      iconColor: 'yellow',
      title: 'Đơn hàng đang chờ thanh toán!',
      message: 'Vui lòng hoàn tất thanh toán trong tab đã mở hoặc kiểm tra email của bạn.',
      icon: (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <div className={`w-16 h-16 bg-${orderStatus.iconColor}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              {orderStatus.icon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {orderStatus.title}
            </h1>
            <p className="text-gray-600">
              {orderStatus.message}
            </p>
            
            {paymentStatus === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>Lưu ý:</strong> Đơn hàng của bạn sẽ được xử lý sau khi việc thanh toán được hoàn tất.
                  Nếu bạn đã đóng cổng thanh toán, bạn có thể thanh toán lại từ trang Chi tiết đơn hàng.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Thông tin đơn hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Mã đơn hàng
                </h3>
                <p className="mt-1 text-sm text-gray-900">#{order.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Ngày đặt hàng
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tổng tiền</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND',
                  }).format(order.total)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Phương thức thanh toán
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {order.paymentMethod === 'cod'
                    ? 'Thanh toán khi nhận hàng'
                    : order.paymentMethod}
                </p>
                <p className={`text-sm mt-1 ${
                  order.paymentStatus === 'PAID' ? 'text-green-600' : 
                  order.paymentStatus === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {order.paymentStatus === 'PAID' 
                    ? 'Đã thanh toán' 
                    : order.paymentStatus === 'PENDING' 
                    ? 'Đang chờ thanh toán' 
                    : 'Chưa thanh toán'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Địa chỉ giao hàng
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-900">{order.Address.fullName}</p>
              <p className="text-sm text-gray-900">{order.Address.phone}</p>
              <p className="text-sm text-gray-900">
                {order.Address.addressLine}
              </p>
              <p className="text-sm text-gray-900">
                {order.Address.city}, {order.Address.state}
              </p>
              <p className="text-sm text-gray-900">
                {order.Address.country}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sản phẩm đã đặt
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-16 h-16">
                    <img
                      src={`${process.env.REACT_APP_IMG_URL}${item.image}` || '/placeholder-product.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.variant.size} - {item.variant.color}
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(item.price)}{' '}
                      x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <Button variant="primary" onClick={() => navigate('/')}>
              Tiếp tục mua sắm
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/orders`)}
            >
              Xem đơn hàng của tôi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
