import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import addressReducer from './slices/addressSlice';

// Cấu hình persist cho auth - lưu thông tin xác thực giữa các phiên làm việc
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

// Cấu hình persist cho cart - chỉ lưu dữ liệu cart, bỏ qua trạng thái loading và error
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['data'],
  blacklist: ['loading', 'error']
};

// Cấu hình persist cho address - chỉ lưu dữ liệu địa chỉ
const addressPersistConfig = {
  key: 'address',
  storage,
  whitelist: ['data'],
  blacklist: ['loading', 'error']
};

// Root reducer với các reducers của từng module
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  cart: persistReducer(cartPersistConfig, cartReducer),
  address: persistReducer(addressPersistConfig, addressReducer),
});

// Cấu hình store với các middleware tối ưu
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Bỏ qua các actions của redux-persist để tránh lỗi serialization
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  // Tối ưu hóa trong môi trường development
  devTools: process.env.NODE_ENV !== 'production',
});

// Tạo persistor để lưu trạng thái redux vào storage
export const persistor = persistStore(store);

export default store; 