import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCart,
  addToCart as addToCartService,
  updateCartItem as updateCartItemService,
  deleteCartItem as deleteCartItemService,
  updateCartItemSelected as updateCartItemSelectedService,
} from '../../services/cart';
import { showSuccess, showError } from '../../utils/notification';

// Helper function từ CartContext
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

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCart();
      return formatCartData(response);
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể tải giỏ hàng');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ variantId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await addToCartService(variantId, quantity);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể thêm vào giỏ hàng');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await updateCartItemService(itemId, { quantity });
      return response;
    } catch (error) {
      // Handle specific error codes
      if (error.response?.data?.error === 'stock_exceeded') {
        showError(`Số lượng vượt quá hàng tồn kho (${error.response?.data?.availableStock || 'không đủ'})`);
        return rejectWithValue({
          message: 'Số lượng vượt quá hàng tồn kho',
          code: 'stock_exceeded',
          availableStock: error.response?.data?.availableStock
        });
      }
      
      // Handle other errors
      console.error('Error updating cart item:', error);
      return rejectWithValue(error.message || 'Không thể cập nhật giỏ hàng');
    }
  }
);

export const deleteCartItem = createAsyncThunk(
  'cart/deleteCartItem',
  async (itemId, { rejectWithValue }) => {
    try {
      const response = await deleteCartItemService(itemId);
      return formatCartData(response);
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể xóa mục khỏi giỏ hàng');
    }
  }
);

export const updateCartItemSelected = createAsyncThunk(
  'cart/updateCartItemSelected',
  async ({ itemId, selected }, { rejectWithValue, getState }) => {
    try {
      const response = await updateCartItemSelectedService(itemId, selected);
      if (!response) throw new Error('Không nhận được phản hồi từ server');
      
      // Tạo bản sao và cập nhật
      const { cart } = getState();
      const updatedCart = { ...cart.data };
      
      if (updatedCart && updatedCart.items) {
        updatedCart.total = response.total;
        updatedCart.shippingFee = response.shippingFee;
        updatedCart.items = updatedCart.items.map(item => 
          item.id === itemId ? { ...item, selected } : item
        );
      }
      
      return updatedCart;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể cập nhật trạng thái chọn');
    }
  }
);

// Initial state
const initialState = {
  data: null,
  loading: false,
  error: null,
  itemsLoading: {} // Track loading state per item
};

// Slice
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCart: (state) => {
      state.data = null;
    },
    clearCartError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add to Cart
      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data.items = [...(state.data.items || []), action.payload.cartItem];
        }
        showSuccess('Đã thêm sản phẩm vào giỏ hàng');
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Update Cart Item
      .addCase(updateCartItem.pending, (state, action) => {
        // Extract the itemId from the action
        const { itemId } = action.meta.arg;
        // Set loading state for this specific item
        state.itemsLoading[itemId] = true;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { cartItem, total, shippingFee } = action.payload;
        // Clear loading state for this item
        state.itemsLoading[cartItem.id] = false;
        
        if (state.data && state.data.items) {
          state.data.total = total;
          state.data.shippingFee = shippingFee;
          state.data.items = state.data.items.map(item => 
            item.id === cartItem.id ? {
              ...item,
              quantity: cartItem.quantity,
              product: {
                ...item.product,
                price: cartItem.product.price
              },
              ProductVariant: {
                ...item.ProductVariant,
                Product: {
                  ...item.ProductVariant.Product,
                  price: cartItem.ProductVariant.Product.price
                }
              }
            } : item
          );
        }
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        // Clear loading state for this item
        const { itemId } = action.meta.arg;
        state.itemsLoading[itemId] = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Delete Cart Item
      .addCase(deleteCartItem.pending, (state, action) => {
        // The argument is just the itemId
        const itemId = action.meta.arg;
        state.itemsLoading[itemId] = true;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.data = action.payload;
        // We don't need to clear the loading state since the item is gone
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        // The argument is just the itemId
        const itemId = action.meta.arg;
        state.itemsLoading[itemId] = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Update Cart Item Selected
      .addCase(updateCartItemSelected.pending, (state, action) => {
        const { itemId } = action.meta.arg;
        state.itemsLoading[itemId] = true;
      })
      .addCase(updateCartItemSelected.fulfilled, (state, action) => {
        // The loading flag for specific item gets cleared automatically
        // as we replace the whole state.data
        state.data = action.payload;
        // Clear all itemsLoading for safety
        const { itemId } = action.meta.arg;
        state.itemsLoading[itemId] = false;
      })
      .addCase(updateCartItemSelected.rejected, (state, action) => {
        const { itemId } = action.meta.arg;
        state.itemsLoading[itemId] = false;
        state.error = action.payload;
        showError(action.payload);
      });
  }
});

// Selectors
export const selectCart = (state) => state.cart.data;
export const selectCartLoading = (state) => state.cart.loading;
export const selectCartError = (state) => state.cart.error;
export const selectItemLoading = (state, itemId) => state.cart.itemsLoading[itemId] || false;
export const selectSelectedItems = (state) => 
  state.cart.data?.items?.filter(item => item.selected) || [];

export const { clearCart, clearCartError } = cartSlice.actions;
export default cartSlice.reducer; 