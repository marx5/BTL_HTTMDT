/* eslint-disable no-useless-catch */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';
import { showSuccess, showError } from '../utils/notification';
import useTitle from '../hooks/useTitle';

const Register = () => {
  // Set tiêu đề trang
  useTitle('Đăng ký');

  const navigate = useNavigate();
  const { register, user, loading } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (data) => {
    try {
      console.log('Registering with data:', data);
      const response = await register(data);
      console.log('Registration response:', response);
      showSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác minh.');
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err.response?.data?.message || err.message || 'Đăng ký thất bại.';
      setError(errorMessage);
      // Không hiển thị thông báo lỗi ở đây nữa vì đã được xử lý ở interceptor
      // showError sẽ được gọi trong API interceptor
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Đăng ký
          </h1>
          <RegisterForm onSubmit={handleSubmit} error={error} />
          <p className="mt-4 text-center text-gray-600">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
