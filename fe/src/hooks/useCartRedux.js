import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCart,
  addToCart as addToCartAction,
  updateCartItem as updateCartItemAction,
  deleteCartItem as deleteCartItemAction,
  updateCartItemSelected as updateCartItemSelectedAction,
  selectCart,
  selectCartLoading,
  selectSelectedItems,
  selectItemLoading
} from '../redux/slices/cartSlice';

// Hook này giúp chuyển đổi dễ dàng từ context sang redux
// Cung cấp API tương tự với useCart hook cũ
export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const loading = useSelector(selectCartLoading);
  const selectedItems = useSelector(selectSelectedItems);
  const itemsLoadingState = useSelector((state) => state.cart.itemsLoading);

  // Các hàm được bọc để hoạt động tương tự context
  const addToCart = async (variantId, quantity = 1) => {
    const resultAction = await dispatch(addToCartAction({ variantId, quantity }));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const updateCartItem = async (itemId, quantity) => {
    const resultAction = await dispatch(updateCartItemAction({ itemId, quantity }));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const deleteCartItem = async (id) => {
    const resultAction = await dispatch(deleteCartItemAction(id));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const updateCartItemSelected = async (itemId, selected) => {
    const resultAction = await dispatch(updateCartItemSelectedAction({ itemId, selected }));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  // Function to check if a specific item is loading
  const isItemLoading = (itemId) => {
    return itemsLoadingState[itemId] || false;
  };

  return {
    cart,
    loading,
    selectedItems,
    isItemLoading,
    fetchCart: () => dispatch(fetchCart()),
    addToCart,
    updateCartItem,
    deleteCartItem,
    updateCartItemSelected
  };
};

export default useCart; 