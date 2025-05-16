import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, getUserOrders } from '../../services/user';
import { showError } from '../../utils/notification';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getUserById(id);
      setUser(response);
      setError(null);
    } catch (err) {
      setError(err.message);
      showError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        Không tìm thấy người dùng
      </div>
    );
  }

  const formatDate = (dateString, includeTime = true) => {
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('vi-VN', options);
  };

  const formatStatus = (status) => {
    const statusMap = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Thông tin người dùng</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Thông tin cơ bản</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">Tên:</span> {user.name}
              </p>
              <p>
                <span className="font-medium">Số điện thoại:</span>{' '}
                {user.phone || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Ngày sinh:</span>{' '}
                {user.birthday ? formatDate(user.birthday, false) : 'N/A'}
              </p>
              <p>
                <span className="font-medium">Vai trò:</span> {user.role}
              </p>
              <p>
                <span className="font-medium">Ngày tạo:</span>{' '}
                {formatDate(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Lịch sử đơn hàng</h2>

        {user.Orders && user.Orders.length > 0 ? (
          <div className="space-y-6">
            {user.Orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-medium">Mã đơn hàng: #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {formatDate(order.createdAt)}
                    </p>
                    {order.Address && (
                      <div className="mt-2 text-sm">
                        <p className="font-medium">Địa chỉ giao hàng:</p>
                        <p>
                          {order.Address.fullName} - {order.Address.phone}
                        </p>
                        <p>
                          {order.Address.addressLine}, {order.Address.city},{' '}
                          {order.Address.country}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Tổng tiền: {order.total.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-sm text-gray-500">
                      Phí vận chuyển:{' '}
                      {order.shippingFee.toLocaleString('vi-VN')}đ
                    </p>
                    <p className="text-sm text-gray-500">
                      Phương thức:{' '}
                      {order.paymentMethod === 'cod'
                        ? 'Thanh toán khi nhận hàng'
                        : 'PayPal'}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Sản phẩm</h3>
                  <div className="space-y-4">
                    {order.OrderProducts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-4"
                      >
                        <img
                          src={
                            `http://localhost:3456${item.ProductVariant?.Product?.ProductImages?.[0]?.url}` ||
                            '/placeholder.png'
                          }
                          alt={item.ProductVariant?.Product?.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">
                            {item.ProductVariant?.Product?.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Size: {item.ProductVariant?.size}, Màu:{' '}
                            {item.ProductVariant?.color}
                          </p>
                          <p className="text-sm">
                            Số lượng: {item.quantity} x{' '}
                            {item.ProductVariant?.Product?.price.toLocaleString(
                              'vi-VN'
                            )}
                            đ
                          </p>
                          <p className="text-sm font-medium">
                            Thành tiền:{' '}
                            {(
                              item.quantity *
                              item.ProductVariant?.Product?.price
                            ).toLocaleString('vi-VN')}
                            đ
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.Payment && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-2">Thông tin thanh toán</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm">
                          Phương thức:{' '}
                          {order.Payment.method === 'cod'
                            ? 'Thanh toán khi nhận hàng'
                            : 'PayPal'}
                        </p>
                        <p className="text-sm">
                          Trạng thái: {order.Payment.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Ngày thanh toán:{' '}
                          {formatDate(order.Payment.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Người dùng chưa có đơn hàng nào</p>
        )}
      </div>
    </div>
  );
};

export default UserDetail;
