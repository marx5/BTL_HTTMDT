import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/auth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useTitle from '../hooks/useTitle';

const ResetPassword = () => {
  // Set tiêu đề trang
  useTitle('Đặt lại mật khẩu');

  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (!tokenParam) {
      setError('Token không hợp lệ.');
    } else {
      setToken(tokenParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(token, newPassword);
      setMessage(
        'Mật khẩu đã được đặt lại thành công. Bạn sẽ được chuyển hướng đến trang đăng nhập.'
      );
      setError(null);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message || 'Không thể đặt lại mật khẩu.');
      setMessage('');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Đặt lại mật khẩu
      </h1>
      <form onSubmit={handleSubmit}>
        <Input
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Mật khẩu mới"
          error={error}
        />
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Button type="submit" className="w-full">
          Đặt lại mật khẩu
        </Button>
      </form>
    </div>
  );
};

export default ResetPassword;
