const OrderSummary = ({ order }) => {
  return (
    <div className="border rounded-lg p-6 bg-neutral">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Chi tiết đơn hàng #{order.id}
      </h3>
      <div className="mb-2">
        <p className="font-semibold">
          Trạng thái:{' '}
          <span
            className={
              order.status === 'pending'
                ? 'text-yellow-500'
                : order.status === 'completed'
                  ? 'text-green-500'
                  : 'text-red-500'
            }
          >
            {order.status === 'pending'
              ? 'Đang chờ xử lý'
              : order.status === 'completed'
                ? 'Đã hoàn thành'
                : 'Đã hủy'}
          </span>
        </p>
        <p>Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Địa chỉ giao hàng:
        </h4>
        <p>{order.address.fullName}</p>
        <p>
          {order.address.addressLine}, {order.address.city},{' '}
          {order.address.state}, {order.address.country}
        </p>
      </div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Sản phẩm:</h4>
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center mb-2">
            <img
              src={
                item.ProductVariant.Product.ProductImages?.[0]?.url ||
                '/assets/images/placeholder.jpg'
              }
              alt={item.ProductVariant.Product.name}
              className="w-16 h-16 object-cover rounded-md mr-4"
            />
            <div>
              <p className="text-gray-800">
                {item.ProductVariant.Product.name}
              </p>
              <p className="text-gray-600">Số lượng: {item.quantity}</p>
              <p className="text-gray-600">
                {item.ProductVariant.Product.price.toLocaleString('vi-VN')} VND
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mb-2">
        <span>Tổng tiền hàng:</span>
        <span>{order.total.toLocaleString('vi-VN')} VND</span>
      </div>
      <div className="flex justify-between mb-2">
        <span>Phí vận chuyển:</span>
        <span>{order.shippingFee.toLocaleString('vi-VN')} VND</span>
      </div>
      <div className="flex justify-between font-semibold text-lg">
        <span>Tổng cộng:</span>
        <span>
          {(order.total + order.shippingFee).toLocaleString('vi-VN')} VND
        </span>
      </div>
    </div>
  );
};

export default OrderSummary;
