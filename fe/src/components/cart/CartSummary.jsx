import React from 'react';
import Button from '../common/Button';

const CartSummary = ({ cart, onCheckout, isProcessing }) => {
  // Kiểm tra và đảm bảo cart có giá trị
  if (!cart) return null;

  // Lấy các giá trị từ cart với giá trị mặc định
  const { total = 0, shippingFee = 0, items = [] } = cart;

  // Tính tổng số lượng sản phẩm đã chọn
  const selectedItems = items.filter((item) => item.selected);
  const selectedCount = selectedItems.length;
  const selectedTotal = selectedItems.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * (item.quantity || 0);
  }, 0);

  // Tính phí vận chuyển (miễn phí nếu tổng tiền >= 1,000,000)
  const finalShippingFee = selectedTotal >= 1000000 ? 0 : shippingFee;

  // Tính tổng cộng
  const finalTotal = selectedTotal + finalShippingFee;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Tóm tắt đơn hàng</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-gray-600">
          <span>Số lượng sản phẩm:</span>
          <span>{selectedCount}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tổng tiền hàng:</span>
          <span>{selectedTotal.toLocaleString('vi-VN')} VND</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển:</span>
          <span>{finalShippingFee.toLocaleString('vi-VN')} VND</span>
        </div>

        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between font-semibold text-lg">
            <span>Tổng cộng:</span>
            <span>{finalTotal.toLocaleString('vi-VN')} VND</span>
          </div>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        className="w-full mt-6"
        disabled={isProcessing || selectedCount === 0}
      >
        {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
      </Button>

      {selectedCount === 0 && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Vui lòng chọn ít nhất một sản phẩm để thanh toán
        </p>
      )}
    </div>
  );
};

export default CartSummary;
