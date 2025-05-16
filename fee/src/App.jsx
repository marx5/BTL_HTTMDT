import { Routes, Route, Suspense, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCart } from './redux/slices/cartSlice';
import { fetchAddresses } from './redux/slices/addressSlice';
import { fetchUserProfile } from './redux/slices/authSlice';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Addresses from './pages/Addresses';
import Search from './pages/Search';
import Category from './pages/Category';
import Favorites from './pages/Favorites';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import Products from './pages/Products';
import AdminProducts from './pages/admin/Products';
import AdminProductDetail from './pages/admin/ProductDetail';
import OrdersAdmin from './pages/admin/Orders';
import OrderDetail from './pages/admin/OrderDetail';
import Banners from './pages/admin/Banners';
import OrderConfirmation from './pages/OrderConfirmation';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/layout/AdminLayout';
import PaypalSuccess from './pages/PaypalSuccess';
import PaypalCancel from './pages/PaypalCancel';
import VnpayResult from './pages/VnpayResult';
import { Navigate } from 'react-router-dom';

// Tạo component ProtectedRoute để bảo vệ các route cần xác thực
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Fetch dữ liệu người dùng khi đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, isAuthenticated]);
  
  // Fetch dữ liệu cart chỉ khi ở các trang liên quan
  useEffect(() => {
    if (isAuthenticated) {
      const cartRelatedRoutes = ['/cart', '/checkout', '/profile'];
      const needCartData = cartRelatedRoutes.some(route => 
        location.pathname.startsWith(route)
      );
      
      if (needCartData) {
        dispatch(fetchCart());
      }
    }
  }, [dispatch, isAuthenticated, location.pathname]);
  
  // Fetch dữ liệu địa chỉ khi ở các trang liên quan
  useEffect(() => {
    if (isAuthenticated) {
      const addressRelatedRoutes = ['/addresses', '/checkout', '/profile'];
      const needAddressData = addressRelatedRoutes.some(route => 
        location.pathname.startsWith(route)
      );
      
      if (needAddressData) {
        dispatch(fetchAddresses());
      }
    }
  }, [dispatch, isAuthenticated, location.pathname]);
  
  return (
    <>
      {/* Chỉ sử dụng một Toaster duy nhất cho toàn ứng dụng */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            marginTop: '60px', // Điều chỉnh khoảng cách từ header
          },
          duration: 3000,
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />
      
      <Routes>
        {/* Routes công khai */}
        <Route
          path="/*"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />}/>
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/addresses" element={<Addresses />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/category/:id" element={<Category />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/category/:categoryId" element={<Products />}/>
                  <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                  <Route path="/paypal-success" element={<ProtectedRoute><PaypalSuccess /></ProtectedRoute>} />
                  <Route path="/paypal-cancel" element={<ProtectedRoute><PaypalCancel /></ProtectedRoute>} />
                  <Route path="/payment-result" element={<ProtectedRoute><VnpayResult /></ProtectedRoute>} />
                  <Route path="/payment/vnpay-result" element={<ProtectedRoute><VnpayResult /></ProtectedRoute>} />
                </Routes>
              </div>
              <Footer />
            </div>
          }
        />
        {/* Routes dành cho admin - Sử dụng AdminLayout làm layout chung */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="users" element={<Users />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/:id" element={<AdminProductDetail />} />
          <Route path="orders" element={<OrdersAdmin />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="banners" element={<Banners />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
