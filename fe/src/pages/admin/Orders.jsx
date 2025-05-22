import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from '../../services/adminOrder';
import toast from 'react-hot-toast';
import useTitle from '../../hooks/useTitle';
const Orders = () => {
  // Set tiêu đề trang
  useTitle('Quản lý đơn hàng');

  const { token } = useAuth();
  const { data: ordersData, loading, error, callApi: fetchOrders } = useApi();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userId, setUserId] = useState('');
  const [showOrderModal, setShowOrderModal] = useState(false);

  const API_BASE_URL = 'http://localhost:3456';

  useEffect(() => {
    fetchOrders(() => getOrders(page, limit, statusFilter, token));
  }, [page, limit, statusFilter, fetchOrders, token]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus, token);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
      fetchOrders(() => getOrders(page, limit, statusFilter, token));
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái đơn hàng');
    }
  };

  const handleViewOrder = async (order) => {
    try {
      const response = await getOrderById(order.id, token);
      console.log('Order details:', response);
      setSelectedOrder(response);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Không thể lấy chi tiết đơn hàng');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;

  const orders = ordersData?.data?.orders || [];
  const totalPages = ordersData?.data?.totalPages || 1;
  const currentPage = ordersData?.data?.currentPage || 1;
  const totalOrders = ordersData?.data?.totalOrders || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="refunded">Đã hoàn trả</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Người dùng</th>
              <th className="py-2 px-4 border-b">Tổng tiền</th>
              <th className="py-2 px-4 border-b">Phương thức thanh toán</th>
              <th className="py-2 px-4 border-b">Trạng thái</th>
              <th className="py-2 px-4 border-b">Ngày tạo</th>
              <th className="py-2 px-4 border-b">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{order.id}</td>
                  <td className="py-2 px-4 border-b">
                    {order.User?.email || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {formatPrice(order.total)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod} 
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'refunded'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="completed">Đã hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                      <option value="refunded">Đã hoàn trả</option>
                    </select>
                  </td>
                  <td className="py-2 px-4 border-b">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewOrder(order)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="py-2 px-4 text-center text-gray-500"
                >
                  Không có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2 mx-1">{`Trang ${page} / ${totalPages}`}</span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-4 py-2 mx-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Tiếp
          </button>
        </div>
      )}

      {/* Modal chi tiết đơn hàng */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto ml-64">
            <div className="sticky top-0 bg-white z-10 pb-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Chi tiết đơn hàng #{selectedOrder.id}
                </h2>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Thông tin người dùng */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Thông tin người dùng
                </h3>
                <p>
                  <span className="font-medium">Tên:</span>{' '}
                  {selectedOrder.User?.name || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Email:</span>{' '}
                  {selectedOrder.User?.email || 'N/A'}
                </p>
              </div>

              {/* Địa chỉ giao hàng */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Địa chỉ giao hàng
                </h3>
                <p>
                  <span className="font-medium">Người nhận:</span>{' '}
                  {selectedOrder.Address?.fullName || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Địa chỉ:</span>{' '}
                  {selectedOrder.Address?.addressLine || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Thành phố:</span>{' '}
                  {selectedOrder.Address?.city || 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Quốc gia:</span>{' '}
                  {selectedOrder.Address?.country || 'N/A'}
                </p>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-3">Sản phẩm</h3>
                <div className="space-y-4">
                  {selectedOrder.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      {item.image && (
                        <img
                          src={`${API_BASE_URL}${item.image}`}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded"
                          onError={(e) => {
                            e.target.src = '/assets/images/placeholder.jpg';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-600">
                          Số lượng: {item.quantity}
                        </p>
                        <p className="text-gray-600">
                          Giá: {formatPrice(item.price)}
                        </p>
                        {item.variant && (
                          <p className="text-gray-600">
                            Phân loại: {item.variant.size} -{' '}
                            {item.variant.color}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          Tổng: {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng đơn hàng */}
              <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Tổng đơn hàng</h3>
                <div className="flex justify-between mb-2">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Phí vận chuyển:</span>
                  <span>{formatPrice(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Tổng cộng:</span>
                  <span>
                    {formatPrice(
                      selectedOrder.total + selectedOrder.shippingFee
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
