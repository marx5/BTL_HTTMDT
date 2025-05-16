import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api, { apiCallWithoutErrorToast } from '../services/api';
import { showSuccess, showError } from '../utils/notification';
import Loader from '../components/common/Loader';
import Button from '../components/common/Button';
import useTitle from '../hooks/useTitle';
import logoSrc from '../assets/images/logo.png';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Đảm bảo location được lấy từ useLocation
  const [message, setMessage] = useState('Đang xác minh email...');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Loại bỏ trạng thái resendEmail
  // const [resendEmail, setResendEmail] = useState(''); 
  const [isResending, setIsResending] = useState(false);

  // Set tiêu đề trang
  useTitle('Xác minh email');
  
  // Kiểm tra các tham số từ URL
  const params = new URLSearchParams(location.search);
  const status = params.get('status');
  const urlMessage = params.get('message');
  const token = params.get('token');
  
  // Kiểm tra nếu người dùng đến từ trang đăng ký hoặc từ link email
  const fromRegistration = !token && !status;

  useEffect(() => {
    const verify = async () => {
      // Nếu đã có status từ URL (chuyển hướng từ backend), sử dụng trạng thái đó
      if (status) {
        setIsSuccess(status === 'success');
        setMessage(urlMessage || (status === 'success' ? 'Email đã được xác minh thành công!' : 'Xác minh email thất bại.'));
        setIsLoading(false);
        // if (status === 'success') {
        //   showSuccess('Email đã được xác minh thành công!');
        // }
        return;
      }

      // Nếu không có token và người dùng vừa đăng ký, hiển thị thông báo phù hợp
      if (!token) {
        if (fromRegistration) {
          // Người dùng vừa đăng ký, hiển thị thông báo hướng dẫn
          setMessage('Vui lòng kiểm tra email của bạn và nhấp vào liên kết xác minh để hoàn tất quá trình đăng ký.');
          setIsLoading(false);
          return;
        } else {
          // Người dùng truy cập trực tiếp vào URL không có token
          setMessage('Liên kết xác minh không hợp lệ. Vui lòng kiểm tra lại email hoặc liên hệ hỗ trợ.');
          setIsLoading(false);
          return;
        }
      }

      try {
        // Gọi API xác minh nếu có token
        const response = await apiCallWithoutErrorToast('get', `/api/auth/verify-email?token=${token}`);
        setMessage(response.data.message || 'Email đã được xác minh thành công!');
        setIsSuccess(true);
        showSuccess('Email đã được xác minh thành công!');
      } catch (err) {
        const errorMessage = err.response?.data?.message || 
          'Liên kết xác minh không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ hỗ trợ.';
        setMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [location, navigate, fromRegistration, status, token, urlMessage]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    
    const emailToUse = location.state?.email;

    if (!emailToUse) {
      showError('Không thể xác định địa chỉ email để gửi lại. Vui lòng quay lại trang đăng ký hoặc liên hệ hỗ trợ.');
      return;
    }
    
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification', { email: emailToUse });
      showSuccess(`Email xác minh đã được gửi lại đến ${emailToUse}.`);
      // Không cần setResendEmail('') nữa
    } catch (err) {
      console.error('Error resending verification:', err);
      showError(err.response?.data?.message || 'Gửi lại email xác minh thất bại.');
    } finally {
      setIsResending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <img
          src={logoSrc}
          alt="Fashion Store Logo"
          className="h-12 mx-auto mb-6"
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Xác minh email
        </h1>
        
        {/* Icon thành công hoặc thất bại */}
        {status && (
          <div className="mb-4">
            {status === 'success' ? (
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
        )}
        
        <p
          className={
            isSuccess || status === 'success' 
              ? 'text-green-500 text-lg mb-6' 
              : status === 'error'
                ? 'text-red-500 text-lg mb-6'
                : 'text-blue-500 text-lg mb-6'
          }
        >
          {message}
        </p>

        {/* Hiển thị nút đăng nhập nếu xác minh thành công */}
        {(isSuccess || status === 'success') && (
          <div className="mt-6">
            <p className="text-gray-600 mb-4">
              Bạn có thể đăng nhập vào tài khoản của mình ngay bây giờ.
            </p>
            <Link to="/login">
              <Button type="button" className="w-full">
                Đăng nhập
              </Button>
            </Link>
          </div>
        )}
        
        {/* Hiển thị form gửi lại email nếu không thành công */}
        {!isSuccess && status !== 'success' && (
          <div className="mt-6">
            {location.state?.email ? (
              <>
                <p className="text-gray-600 mb-4">
                  Không nhận được email? Chúng tôi sẽ gửi lại đến địa chỉ: <strong>{location.state.email}</strong>
                </p>
                <form onSubmit={handleResendVerification} className="space-y-4">
                  {/* Loại bỏ Input email */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isResending}
                  >
                    {isResending ? 'Đang gửi...' : 'Gửi lại email xác minh'}
                  </Button>
                </form>
              </>
            ) : (
              <p className="text-gray-600 mb-4">
                Không thể tự động gửi lại email xác minh vì không tìm thấy địa chỉ email đã đăng ký. 
                Vui lòng kiểm tra lại hoặc quay lại trang{' '}
                <Link to="/register" className="text-primary hover:underline">
                  đăng ký
                </Link>
                .
              </p>
            )}
            <p className="text-gray-600 mt-4">
              Quay lại{' '}
              <Link to="/register" className="text-primary hover:underline">
                đăng ký
              </Link>
              {' '}hoặc{' '}
              <Link to="/login" className="text-primary hover:underline">
                đăng nhập
              </Link>
            </p>
            <div className="mt-4">
              <p className="text-gray-500 text-sm">Cần hỗ trợ? Liên hệ với chúng tôi:</p>
              <a
                href="mailto:support@fashionstore.com"
                className="text-primary hover:underline"
              >
                support@fashionstore.com
              </a>
              <span className="mx-2">|</span>
              <a href="tel:0901234567" className="text-primary hover:underline">
                0901234567
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
