import React, { useState, useEffect } from 'react';
import { getUserOrders } from '../services/order';
import { formatCurrency } from '../utils/format';
import { formatDate } from '../utils/date';
import useTitle from '../hooks/useTitle';

const API_BASE_URL = process.env.REACT_APP_IMG_URL;

const cleanImageUrl = (url) => {
  if (!url) return null;
  return url.replace(/^\/+/, '').replace(/^Uploads\//, '');
};

const Orders = () => {
  // Set tiêu đề trang
  useTitle('Đơn hàng của tôi');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getUserOrders(currentPage);
        console.log('Order data:', response.orders);
        setOrders(response.orders);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (err) {
        setError('Failed to fetch orders. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600 p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center text-gray-500">Không có đơn hàng nào</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-sm text-gray-500">
                    Order ID: {order.id}
                  </span>
                  <span
                    className={`ml-4 px-2 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}
                  >
                    {order.status || 'pending'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Địa chỉ giao hàng:</h3>
                <p>{order.Address?.fullName || 'N/A'}</p>
                <p>{order.Address?.addressLine || 'N/A'}</p>
                <p>{order.Address?.city || 'N/A'}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Sản phẩm:</h3>
                <div className="space-y-2">
                  {order.OrderProducts?.map((item) => {
                    const imageUrl = item.ProductVariant?.Product?.image;
                    const fullImageUrl = imageUrl
                      ? imageUrl.startsWith('http')
                        ? imageUrl
                        : `${API_BASE_URL}/${cleanImageUrl(imageUrl)}`
                      : '/placeholder.png';

                    return (
                      <div
                        key={item.ProductVariant?.id}
                        className="flex items-center"
                      >
                        <img
                          src={fullImageUrl}
                          alt={item.ProductVariant?.Product?.name || 'Product'}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="ml-4">
                          <p className="font-medium">
                            {item.ProductVariant?.Product?.name || 'Product'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.ProductVariant?.color || 'N/A'} -{' '}
                            {item.ProductVariant?.size || 'N/A'}
                          </p>
                          <p className="text-sm">
                            {formatCurrency(
                              item.ProductVariant?.Product?.price || 0
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4">
                <div>
                  <span className="text-sm text-gray-500">Trạng thái thanh toán:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-sm ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {order.paymentStatus === 'PAID' 
                      ? 'Đã thanh toán' 
                      : order.paymentStatus === 'PENDING' 
                      ? 'Đang chờ thanh toán' 
                      : 'Chưa thanh toán'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Phí vận chuyển:</p>
                  <p className="font-semibold">
                    {formatCurrency(order.shippingFee || 0)}
                  </p>
                  <p className="text-sm text-gray-500">Total:</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(order.total || 0)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders;
