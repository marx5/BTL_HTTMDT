import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Bảng điều khiển Admin
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Widget Quản lý danh mục */}
        <Link
          to="/admin/categories"
          className="p-6 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition"
        >
          <h3 className="text-lg font-semibold text-yellow-800">
            Quản lý danh mục
          </h3>
          <p className="text-gray-600 mt-2">
            Xem, thêm, sửa, xóa và cập nhật danh mục.
          </p>
        </Link>

        {/* Widget Quản lý sản phẩm */}
        <Link
          to="/admin/products"
          className="p-6 bg-green-100 rounded-lg hover:bg-green-200 transition"
        >
          <h3 className="text-lg font-semibold text-green-800">
            Quản lý sản phẩm
          </h3>
          <p className="text-gray-600 mt-2">
            Xem, thêm, sửa, xóa và cập nhật sản phẩm.
          </p>
        </Link>

        {/* Widget Quản lý đơn hàng */}
        <Link
          to="/admin/orders"
          className="p-6 bg-purple-100 rounded-lg hover:bg-purple-200 transition"
        >
          <h3 className="text-lg font-semibold text-purple-800">
            Quản lý đơn hàng
          </h3>
          <p className="text-gray-600 mt-2">
            Xem danh sách đơn hàng và cập nhật trạng thái.
          </p>
        </Link>

        {/* Widget Quản lý banner */}
        <Link
          to="/admin/banners"
          className="p-6 bg-red-100 rounded-lg hover:bg-red-200 transition"
        >
          <h3 className="text-lg font-semibold text-red-800">
            Quản lý banner
          </h3>
          <p className="text-gray-600 mt-2">
            Thêm, sửa, xóa và cập nhật banner.
          </p>
        </Link>

        {/* Widget Quản lý người dùng */}
        <Link
          to="/admin/users"
          className="p-6 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
        >
          <h3 className="text-lg font-semibold text-blue-800">
            Quản lý người dùng
          </h3>
          <p className="text-gray-600 mt-2">
            Xem danh sách người dùng, chi tiết và đơn hàng của họ.
          </p>
        </Link>

      </div>
    </div>
  );
};

export default Dashboard;
