import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../../services/address';
import { showSuccess, showError } from '../../utils/notification';

// Async thunks
export const fetchAddresses = createAsyncThunk(
  'address/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getAddresses();
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể tải danh sách địa chỉ');
    }
  }
);

export const createAddress = createAsyncThunk(
  'address/createAddress',
  async (addressData, { rejectWithValue }) => {
    try {
      const response = await addAddress(addressData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể thêm địa chỉ');
    }
  }
);

export const updateAddressById = createAsyncThunk(
  'address/updateAddress',
  async ({ id, addressData }, { rejectWithValue }) => {
    try {
      const response = await updateAddress(id, addressData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể cập nhật địa chỉ');
    }
  }
);

export const deleteAddressById = createAsyncThunk(
  'address/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      await deleteAddress(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể xóa địa chỉ');
    }
  }
);

export const setAddressAsDefault = createAsyncThunk(
  'address/setDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      await setDefaultAddress(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Không thể đặt địa chỉ mặc định');
    }
  }
);

// Initial state
const initialState = {
  data: [],
  loading: false,
  error: null
};

// Slice
const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Create Address
      .addCase(createAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.data.push(action.payload);
        showSuccess('Đã thêm địa chỉ mới');
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Update Address
      .addCase(updateAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddressById.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(addr => addr.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        showSuccess('Đã cập nhật địa chỉ');
      })
      .addCase(updateAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Delete Address
      .addCase(deleteAddressById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddressById.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(addr => addr.id !== action.payload);
        showSuccess('Đã xóa địa chỉ');
      })
      .addCase(deleteAddressById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      })
      
      // Set Default Address
      .addCase(setAddressAsDefault.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setAddressAsDefault.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.map(addr => ({
          ...addr,
          isDefault: addr.id === action.payload
        }));
        showSuccess('Đã đặt địa chỉ mặc định');
      })
      .addCase(setAddressAsDefault.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        showError(action.payload);
      });
  }
});

// Selectors
export const selectAddresses = (state) => state.address.data;
export const selectAddressLoading = (state) => state.address.loading;
export const selectAddressError = (state) => state.address.error;
export const selectDefaultAddress = (state) => 
  state.address.data.find(addr => addr.isDefault) || state.address.data[0] || null;

export const { clearAddressError } = addressSlice.actions;
export default addressSlice.reducer; 