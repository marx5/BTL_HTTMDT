import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showSuccess, showError } from '../../utils/notification';
import {
  FaHome,
  FaBox,
  FaUsers,
  FaShoppingCart,
  FaChartBar,
  FaBars,
  FaTimes,
  FaFolder
} from 'react-icons/fa';

const AdminLayout = () => {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (!loading && user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      showSuccess('Đăng xuất thành công');
    } catch (error) {
      console.error('Logout error:', error);
      showError('Đăng xuất thất bại');
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  if (!user || user.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { path: '/admin', icon: <FaHome />, label: 'Dashboard' },
    { path: '/admin/categories', icon: <FaFolder />, label: 'Danh mục' },
    { path: '/admin/products', icon: <FaBox />, label: 'Sản phẩm' },
    { path: '/admin/orders', icon: <FaShoppingCart />, label: 'Đơn hàng' },
    { path: '/admin/banners', icon: <FaChartBar />, label: 'Banner' },
    { path: '/admin/users', icon: <FaUsers />, label: 'Người dùng' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white md:hidden"
      >
        {isSidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-0'
        } md:w-64`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-4 hover:bg-gray-700 ${
                  location.pathname === item.path ? 'bg-gray-700' : ''
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span className={`${!isSidebarOpen && 'hidden'} md:block`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <button
              onClick={confirmLogout}
              className="w-full p-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'ml-64' : 'ml-0'
        } md:ml-64`}
      >
        <div className="p-4">
          <Outlet />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-500 mb-6">
              Bạn có chắc chắn muốn đăng xuất?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
