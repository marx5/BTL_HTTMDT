import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { deleteCartItem } from '../services/cart';
import { toast } from 'react-hot-toast';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Button from '../components/common/Button';
import useTitle from '../hooks/useTitle';

const Cart = () => {
  // Set tiêu đề trang
  useTitle('Giỏ hàng');

  const navigate = useNavigate();
  const {
    cart,
    loading,
    error,
    updateQuantity,
    removeItem,
    updateCartItemSelected,
    fetchCart,
  } = useCart();
  const { token, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Separate initial loading state for cart fetch 
  useEffect(() => {
    if (!initialLoading) return;
    
    if (!loading && cart !== null) {
      setInitialLoading(false);
    }
  }, [loading, cart, initialLoading]);

  const handleCheckout = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }

    if (!cart || !cart.items) {
      toast.error('Giỏ hàng không tồn tại hoặc trống');
      return;
    }

    const selectedItems = cart.items.filter((item) => item && item.selected);
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    navigate('/checkout');
  };

  const handleSelectItem = async (itemId, selected) => {
    if (!itemId) return;
    
    try {
      await updateCartItemSelected(itemId, selected);
    } catch (error) {
      console.error('Error selecting item:', error);
    }
  };

  // Only show loading indicator during initial cart fetch
  if (initialLoading)
    return <div className="text-center mt-10">Đang tải giỏ hàng...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-semibold text-gray-900">Giỏ hàng trống</h2>
        <p className="mt-2 text-gray-600">
          Hãy thêm sản phẩm vào giỏ hàng của bạn
        </p>
        <Button onClick={() => navigate('/products')} className="mt-4">
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  // Filter out any invalid items (without product information)
  const validItems = cart.items.filter(item => item && item.product);

  if (validItems.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-semibold text-gray-900">Giỏ hàng có lỗi</h2>
        <p className="mt-2 text-gray-600">
          Có lỗi xảy ra với sản phẩm trong giỏ hàng
        </p>
        <Button onClick={() => navigate('/products')} className="mt-4">
          Tiếp tục mua sắm
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            {validItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
                onSelect={handleSelectItem}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <CartSummary
            cart={{...cart, items: validItems}}
            onCheckout={handleCheckout}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;
