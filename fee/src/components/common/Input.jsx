import { useState } from 'react';

const Input = ({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  className = '',
  error,
  showPassword, // Thêm prop để kiểm soát từ bên ngoài
  toggleShowPassword, // Thêm prop để thay đổi trạng thái từ bên ngoài
}) => {
  // Sử dụng state nội bộ nếu không có kiểm soát từ bên ngoài
  const [localShowPassword, setLocalShowPassword] = useState(false);
  
  // Kiểm tra xem có kiểm soát từ bên ngoài không
  const isControlledPassword = type === 'password' && showPassword !== undefined;
  
  // Chỉ hiện nút con mắt nếu trường là password
  const isPasswordField = type === 'password';
  
  // Quyết định type thực tế dựa trên trạng thái showPassword
  const actualType = isPasswordField && (isControlledPassword ? showPassword : localShowPassword) ? 'text' : type;
  
  // Hàm xử lý khi nhấp vào biểu tượng con mắt
  const handleTogglePassword = () => {
    if (isControlledPassword && toggleShowPassword) {
      // Sử dụng hàm từ bên ngoài nếu được cung cấp
      toggleShowPassword();
    } else {
      // Nếu không, sử dụng state nội bộ
      setLocalShowPassword(!localShowPassword);
    }
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type={actualType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-primary ${error ? 'border-red-500' : ''} ${className}`}
        />
        
        {/* Nút con mắt hiển thị/ẩn mật khẩu */}
        {isPasswordField && (
          <button
            type="button"
            onClick={handleTogglePassword}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
            tabIndex="-1" // Để người dùng không nhấn Tab vào nút này
          >
            {isControlledPassword ? showPassword : localShowPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
