import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/slices/authSlice';
import LoginForm from '../components/auth/LoginForm';
import { showSuccess } from '../utils/notification';
import useTitle from '../hooks/useTitle';

const Login = () => {
  // Set tiêu đề trang
  useTitle('Đăng nhập');

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);

  useEffect(() => {
    if (loading) return;

    if (user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (email, password, recaptchaToken) => {
    try {
      console.log('Login attempt with:', { email, recaptchaToken });
      const resultAction = await dispatch(loginUser({ email, password, recaptchaToken }));
      // Sử dụng unwrap() để kiểm tra lỗi và trích xuất kết quả
      await resultAction.unwrap();
      showSuccess('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      // Tạo một đối tượng lỗi có field và message để form validation hook xử lý
      const errorMessage = err.message || 'Đăng nhập thất bại';
      throw { field: '_form', message: errorMessage };
    }
  };

  if (loading) return <div className="text-center mt-10">Đang tải...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Đăng nhập
          </h1>
          <LoginForm onSubmit={handleSubmit} />
          <p className="mt-4 text-center text-gray-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
