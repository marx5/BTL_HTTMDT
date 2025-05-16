const API_BASE_URL = process.env.REACT_APP_IMG_URL;
const OrderItem = ({ order }) => {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">Mã đơn hàng: {order.id}</span>
        <span
          className={`text-sm ${order.status === 'pending' ? 'text-yellow-500' : order.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}
        >
          {order.status === 'pending'
            ? 'Đang chờ xử lý'
            : order.status === 'completed'
              ? 'Đã hoàn thành'
              : 'Đã hủy'}
        </span>
      </div>
      <div className="mb-2">
        <p>
          Tổng tiền: {(order.total + order.shippingFee).toLocaleString('vi-VN')}{' '}
          VND
        </p>
        <p>Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</p>
      </div>
      <div>
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
    </div>
  );
};

export default OrderItem;
