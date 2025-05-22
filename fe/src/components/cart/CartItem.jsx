import React, { useState, useEffect } from 'react';
import useCart from '../../hooks/useCart';
import { showError, NOTIFICATIONS } from '../../utils/notification';
import { FaTrash, FaMinus, FaPlus } from 'react-icons/fa';

const CartItem = ({ item, onUpdateQuantity, onRemove, onSelect }) => {
  const { updateCartItem, deleteCartItem, updateCartItemSelected, isItemLoading } = useCart();
  const [quantity, setQuantity] = useState(item?.quantity || 1);
  const [isSelected, setIsSelected] = useState(item?.selected || false);
  const [error, setError] = useState(null);
  
  // Get the maximum stock available
  const maxStock = item?.ProductVariant?.stock || 99;
  // Get item-specific loading state
  const isUpdating = isItemLoading(item?.id);

  useEffect(() => {
    if (item) {
      // Ensure quantity is within valid range compared to stock
      const validQuantity = Math.min(Math.max(1, item.quantity || 1), maxStock);
      setQuantity(validQuantity);
      setIsSelected(item.selected || false);
    }
  }, [item, item?.quantity, item?.selected, maxStock]);

  const formatPrice = (price) => {
    return (price || 0).toLocaleString('vi-VN') + 'đ';
  };

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > maxStock) {
      if (newQuantity > maxStock) {
        showError(NOTIFICATIONS.cart.outOfStock(maxStock));
      }
      return;
    }
    
    if (isUpdating || !item?.id) return;
    
    setError(null);
    try {
      await updateCartItem(item.id, newQuantity);
      setQuantity(newQuantity);
      if (onUpdateQuantity) {
        onUpdateQuantity(item.id, newQuantity);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      if (error.message?.includes('stock_exceeded') || error.response?.data?.error === 'stock_exceeded') {
        showError(NOTIFICATIONS.cart.outOfStock(maxStock));
      } else {
        // General error handling
        showError(error);
      }
      // Reset to previous valid quantity
      setQuantity(item.quantity);
    }
  };

  const handleSelectedChange = async (e) => {
    if (!item?.id) return;
    
    const newSelected = e.target.checked;
    setIsSelected(newSelected);
    try {
      await updateCartItemSelected(item.id, newSelected);
      if (onSelect) {
        onSelect(item.id, newSelected);
      }
    } catch (error) {
      console.error('Error updating selected status:', error);
      showError(NOTIFICATIONS.common.operationFailed);
      setIsSelected(!newSelected); // Revert the change if it fails
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    
    try {
      await deleteCartItem(item.id);
      if (onRemove) {
        onRemove(item.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      showError(NOTIFICATIONS.common.deleteFailed);
    }
  };

  const handleIncrement = () => handleQuantityChange(quantity + 1);
  const handleDecrement = () => handleQuantityChange(quantity - 1);

  // If item or its product is undefined, return nothing
  if (!item || !item.product) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectedChange}
          className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
          disabled={isUpdating}
        />
      </div>

      <div className="w-24 h-24 flex-shrink-0">
        {item.product.image ? (
          <img
            src={item.product.image}
            alt={item.product.name || 'Product image'}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
      </div>

      <div className="flex-grow">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-gray-900">{item.product.name || 'Unnamed product'}</h3>
          <p className="text-sm text-gray-500">
            Size: {item.ProductVariant?.size || 'N/A'} | Color:{' '}
            {item.ProductVariant?.color || 'N/A'}
            {maxStock > 0 && <span className="ml-2 text-xs">(Còn lại: {maxStock})</span>}
          </p>
          <p className="text-lg font-semibold text-primary">
            {formatPrice(
              item.ProductVariant?.Product?.price || item.product?.price || 0
            )}
          </p>
          {error === 'stock_exceeded' && (
            <p className="text-sm text-red-500">Số lượng vượt quá hàng tồn kho</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleDecrement}
          disabled={quantity <= 1 || isUpdating}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaMinus className="w-4 h-4 text-gray-600" />
        </button>

        <span className="w-8 text-center font-medium">{quantity}</span>

        <button
          onClick={handleIncrement}
          disabled={quantity >= maxStock || isUpdating}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaPlus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <button
        onClick={handleDelete}
        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
        disabled={isUpdating}
      >
        <FaTrash className="w-5 h-5" />
      </button>
      
      {isUpdating && (
        <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center z-10">
          <div className="flex items-center space-x-2">
            <svg
              className="animate-spin h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-primary font-medium">Đang cập nhật...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItem;
