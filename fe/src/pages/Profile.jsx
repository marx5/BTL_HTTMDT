import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../redux/slices/authSlice';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import DatePicker from '../components/common/DatePicker';
import { showSuccess, showError } from '../utils/notification';
import useTitle from '../hooks/useTitle';

const Profile = () => {
  useTitle('Thông tin cá nhân');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    birthday: user?.birthday
      ? new Date(user.birthday).toISOString().split('T')[0]
      : '',
  });
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        birthday: user.birthday
          ? new Date(user.birthday).toISOString().split('T')[0]
          : '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      showError('Vui lòng đăng nhập để xem hồ sơ.');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await dispatch(updateUserProfile(formData));
      // Kiểm tra kết quả trực tiếp từ redux thunk
      if (result.error) {
        throw new Error(result.error.message || 'Không thể cập nhật thông tin');
      }
      
      // Nếu không có lỗi thì cập nhật thành công
      showSuccess('Hồ sơ đã được cập nhật thành công');
      setIsEditing(false);
    } catch (err) {
      showError(err.message || 'Không thể cập nhật thông tin.');
      setError(err.message || 'Không thể cập nhật thông tin.');
    }
  };

  const handleCancel = () => {
    // Reset form data và quay lại chế độ xem
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      birthday: user?.birthday
        ? new Date(user.birthday).toISOString().split('T')[0]
        : '',
    });
    setError(null);
    setIsEditing(false);
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  // Format ngày sinh cho hiển thị
  const formattedBirthday = user?.birthday 
    ? new Date(user.birthday).toLocaleDateString('vi-VN')
    : '';

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Hồ sơ cá nhân
      </h1>
      
      <div className="space-y-6">
        {isEditing ? (
          // Form chỉnh sửa
          <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <Input
                name="email"
                value={user?.email || ''}
                disabled
                readOnly
                placeholder="Email"
              />
              <p className="text-xs text-gray-500 mt-1">Email không thể thay đổi</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Họ và tên
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Họ và tên"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Số điện thoại
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Số điện thoại"
                error={error?.includes('phone') ? error : null}
              />
            </div>
            
            <div className="space-y-1 mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Ngày sinh
              </label>
              <DatePicker
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                error={error?.includes('birthday') ? error : null}
              />
            </div>
            
            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            <div className="flex space-x-3 mt-6">
              <Button type="submit" className="flex-1">
                Lưu thay đổi
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={handleCancel}>
                Hủy
              </Button>
            </div>
          </form>
        ) : (
          // Chế độ xem thông tin
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            {/* Thông tin cá nhân */}
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-500 text-sm">Email</h3>
                <p className="text-gray-900 font-medium">{user?.email || 'Chưa cập nhật'}</p>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm">Họ và tên</h3>
                <p className="text-gray-900 font-medium">{user?.name || 'Chưa cập nhật'}</p>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm">Số điện thoại</h3>
                <p className="text-gray-900 font-medium">{user?.phone || 'Chưa cập nhật'}</p>
              </div>
              
              <div>
                <h3 className="text-gray-500 text-sm">Ngày sinh</h3>
                <p className="text-gray-900 font-medium">{formattedBirthday || 'Chưa cập nhật'}</p>
              </div>
            </div>
            
            <Button onClick={() => setIsEditing(true)} className="w-full mt-6">
              Cập nhật thông tin
            </Button>
          </div>
        )}
        
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/addresses')} className="px-6">
            Quản lý địa chỉ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
