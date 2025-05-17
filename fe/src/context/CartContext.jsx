import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  getCart,
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  deleteCartItem as deleteCartItemService,
  updateCartItemSelected as updateCartItemSelectedService,
} from '../services/cart';
import { useAuth } from './AuthContext';
import { showSuccess, showError } from '../utils/notification';
import { useNavigate } from 'react-router-dom';

const CartContext = createContext();

// Helper function to format cart data
const formatCartData = (cartData) => {
  if (!cartData) return null;

  return {
    ...cartData,
    shippingFee: cartData.shippingFee || 0,
    items: (cartData.items || []).map((item) => ({
      ...item,
      size: item.ProductVariant?.size || '',
      color: item.ProductVariant?.color || '',
      product: {
        ...item.product,
        image: item.product.image
          ? `http://localhost:3456/${item.product.image.replace(/^\/+/, '').replace(/^Uploads\//, '')}`
          : null,
      },
    })),
  };
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart();
      setCart(formatCartData(response));
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        showError('Không thể tải giỏ hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const addToCart = useCallback(
    async (variantId, quantity = 1) => {
      try {
        const response = await addToCartService(variantId, quantity);
        setCart((prev) => ({
          ...prev,
          items: [...(prev?.items || []), response.cartItem],
        }));
        showSuccess('Đã thêm sản phẩm vào giỏ hàng');
      } catch (error) {
        console.error('Error adding to cart:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.data?.error === 'stock_exceeded') {
          showError('Số lượng sản phẩm vượt quá tồn kho');
        } else {
          showError(error, 'Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại sau.');
        }
      }
    },
    [navigate]
  );

  const updateCartItem = useCallback(
    async (itemId, quantity) => {
      try {
        const response = await updateCartItemService(itemId, { quantity });
        setCart((prev) => ({
          ...prev,
          total: response.total,
          shippingFee: response.shippingFee,
          items: prev.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  product: {
                    ...item.product,
                    price: response.cartItem.product.price,
                  },
                  ProductVariant: {
                    ...item.ProductVariant,
                    Product: {
                      ...item.ProductVariant.Product,
                      price: response.cartItem.ProductVariant.Product.price,
                    },
                  },
                }
              : item
          ),
        }));
      } catch (error) {
        console.error('Error updating cart item:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
          showError('Sản phẩm không tồn tại trong giỏ hàng');
          await fetchCart();
        } else if (error.response?.data?.error === 'stock_exceeded') {
          showError('Số lượng sản phẩm vượt quá tồn kho');
        } else {
          showError(error, 'Không thể cập nhật số lượng. Vui lòng thử lại sau.');
        }
      }
    },
    [navigate, fetchCart]
  );

  const deleteCartItem = useCallback(
    async (id) => {
      try {
        console.log('Deleting cart item in context:', id);
        const updatedCart = await deleteCartItemService(id);
        console.log('Updated cart after deletion:', updatedCart);

        if (!updatedCart) {
          throw new Error('Không nhận được phản hồi từ server');
        }

        setCart(formatCartData(updatedCart));
      } catch (error) {
        console.error('Error deleting cart item in context:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
          showError('Sản phẩm không tồn tại trong giỏ hàng');
          await fetchCart();
        } else {
          showError(error, 'Không thể xóa sản phẩm. Vui lòng thử lại sau.');
        }
      }
    },
    [navigate, fetchCart]
  );

  const updateCartItemSelected = useCallback(
    async (itemId, selected) => {
      try {
        const response = await updateCartItemSelectedService(itemId, selected);
        if (response) {
          setCart((prev) => ({
            ...prev,
            total: response.total,
            shippingFee: response.shippingFee,
            items: prev.items.map((item) =>
              item.id === itemId ? { ...item, selected } : item
            ),
          }));
        }
      } catch (error) {
        console.error('Error updating cart item selected status:', error);
        if (error.response?.status === 401) {
          navigate('/login');
          showError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 404) {
          showError('Sản phẩm không tồn tại trong giỏ hàng');
          await fetchCart();
        } else {
          showError(error, 'Không thể cập nhật trạng thái chọn. Vui lòng thử lại sau.');
        }
      }
    },
    [navigate, fetchCart]
  );

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const selectedItems = cart?.items?.filter((item) => item.selected) || [];

  const value = {
    cart,
    loading: loading || authLoading,
    selectedItems,
    fetchCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    updateCartItemSelected,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
