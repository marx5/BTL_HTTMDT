import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/auth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useTitle from '../hooks/useTitle';

const ForgotPassword = () => {
  useTitle('Quên mật khẩu');
  
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(email);
      setMessage('Liên kết đặt lại mật khẩu đã được gửi qua email.');
      setError(null);
    } catch (err) {
      setError(err.message || 'Không thể gửi liên kết.');
      setMessage('');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Khôi phục mật khẩu
      </h1>
      <form onSubmit={handleSubmit}>
        <Input
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          error={error}
        />
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <Button type="submit" className="w-full">
          Gửi liên kết
        </Button>
      </form>
      <p className="mt-4 text-center">
        Quay lại{' '}
        <Link to="/login" className="text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
