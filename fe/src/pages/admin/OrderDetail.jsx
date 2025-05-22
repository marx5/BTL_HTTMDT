import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { getOrderById, updateOrderStatus } from '../../services/adminOrder';
import toast from 'react-hot-toast';
import useTitle from '../../hooks/useTitle';
const OrderDetail = () => {
  // Set tiêu đề trang
  useTitle('Chi tiết đơn hàng');

  const { id } = useParams();
  const { token } = useAuth();
  const { data: orderData, loading, error, callApi: fetchOrder } = useApi();
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchOrder(() => getOrderById(id, token));
  }, [id, token, fetchOrder]);

  useEffect(() => {
    if (orderData) {
      setStatus(orderData.status);
    }
  }, [orderData]);

  const handleUpdateStatus = async () => {
    try {
      await updateOrderStatus(id, status, token);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
      fetchOrder(() => getOrderById(id, token));
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  const order = orderData || {};

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Chi tiết đơn hàng #{order.id}
        </h2>
        <Link
          to="/admin/orders"
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Quay lại
        </Link>
      </div>

      {/* Thông tin đơn hàng */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Thông tin đơn hàng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">
              <strong>ID:</strong> {order.id}
            </p>
            <p className="text-gray-600">
              <strong>Người dùng:</strong> {order.User?.email || 'Không có'}
            </p>
            <p className="text-gray-600">
              <strong>Tổng tiền:</strong>{' '}
              {order.total?.toLocaleString('vi-VN')} VND
            </p>
            <p className="text-gray-600">
              <strong>Phí vận chuyển:</strong>{' '}
              {order.shippingFee?.toLocaleString('vi-VN')} VND
            </p>
          </div>
          <div>
            <p className="text-gray-600">
              <strong>Phương thức thanh toán:</strong> {order.paymentMethod}
            </p>
            <p className="text-gray-600">
              <strong>Ngày đặt:</strong>{' '}
              {new Date(order.createdAt).toLocaleDateString('vi-VN')}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">
                <strong>Trạng thái:</strong>
              </p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border rounded-md p-2"
              >
                <option value="pending">Đang xử lý</option>
                <option value="shipped">Đã giao</option>
                <option value="delivered">Đã nhận</option>
                <option value="cancelled">Đã hủy</option>
                <option value="refunded">Đã hoàn trả</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Địa chỉ giao hàng */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Địa chỉ giao hàng
        </h3>
        {order.Address ? (
          <div>
            <p className="text-gray-600">
              <strong>Họ và tên:</strong> {order.Address.fullName}
            </p>
            <p className="text-gray-600">
              <strong>Địa chỉ:</strong> {order.Address.addressLine},{' '}
              {order.Address.city}
            </p>
            <p className="text-gray-600">
              <strong>Số điện thoại:</strong> {order.Address.phone}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Không có thông tin địa chỉ.</p>
        )}
      </div>

      {/* Danh sách sản phẩm trong đơn hàng */}
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Sản phẩm trong đơn hàng
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Tên sản phẩm</th>
              <th className="py-2 px-4 border-b">Số lượng</th>
              <th className="py-2 px-4 border-b">Giá</th>
              <th className="py-2 px-4 border-b">Tổng</th>
            </tr>
          </thead>
          <tbody>
            {order.OrderItems?.length > 0 ? (
              order.OrderItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item.id}</td>
                  <td className="py-2 px-4 border-b">
                    {item.ProductVariant?.Product?.name || 'Không có'}
                  </td>
                  <td className="py-2 px-4 border-b">{item.quantity}</td>
                  <td className="py-2 px-4 border-b">
                    {item.price.toLocaleString('vi-VN')} VND
                  </td>
                  <td className="py-2 px-4 border-b">
                    {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="py-2 px-4 text-center text-gray-500"
                >
                  Không có sản phẩm nào trong đơn hàng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderDetail;
