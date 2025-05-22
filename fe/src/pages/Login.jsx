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
      await dispatch(loginUser({ email, password, recaptchaToken })).unwrap();
      showSuccess('Đăng nhập thành công!');
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || (typeof err === 'string' ? err : 'Đăng nhập thất bại');
      throw new Error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Đăng nhập
          </h1>
          <LoginForm onSubmit={handleSubmit} isLoading={loading} />
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
