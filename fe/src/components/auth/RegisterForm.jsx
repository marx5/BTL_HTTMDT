import { useState, useRef, useEffect } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import DatePicker from '../common/DatePicker';
import ReCAPTCHA from 'react-google-recaptcha';

const RegisterForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    birthday: '',
  });
  const [error, setError] = useState(null);
  const [passwordMatchError, setPasswordMatchError] = useState(null);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const recaptchaRef = useRef(null);
  const [formIsValid, setFormIsValid] = useState(false);

  // Kiểm tra form có hợp lệ không mỗi khi dữ liệu thay đổi
  useEffect(() => {
    const isValid = 
      !!formData.email &&
      !!formData.password &&
      !!formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      !!formData.name &&
      !!formData.phone &&
      !!formData.birthday &&
      !!recaptchaValue;
    
    setFormIsValid(isValid);
    // console.log("Form valid:", isValid, formData);
  }, [formData, recaptchaValue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'password' || name === 'confirmPassword') {
      const password =
        name === 'password' ? value : formData.password;
      const confirmPassword =
        name === 'confirmPassword'
          ? value
          : formData.confirmPassword;
      if (password && confirmPassword && password !== confirmPassword) {
        setPasswordMatchError('Mật khẩu không khớp.');
      } else {
        setPasswordMatchError(null);
      }
    }
    
    // console.log(`Field ${name} updated to:`, value);
  };

  const handleRecaptchaChange = (value) => {
    console.log('reCAPTCHA value:', value);
    setRecaptchaValue(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPasswordMatchError(null);

    if (formData.password !== formData.confirmPassword) {
      setPasswordMatchError('Mật khẩu không khớp.');
      return;
    }

    if (!recaptchaValue) {
      setError('Vui lòng xác nhận reCAPTCHA');
      return;
    }

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        birthday: formData.birthday,
        recaptchaToken: recaptchaValue,
      };
      console.log('Submitting registration data:', registerData);
      await onSubmit(registerData);
      setError(null);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Đăng ký thất bại.');
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaValue(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
        error={error?.includes('email') ? error : null}
        className="w-full"
        required
      />
      
      <Input
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Mật khẩu"
        error={
          error?.includes('password') || passwordMatchError
            ? error || passwordMatchError
            : null
        }
        className="w-full"
        required
      />
      
      <Input
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Xác nhận mật khẩu"
        error={passwordMatchError}
        className="w-full"
        required
      />

      <Input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Họ và tên"
        error={error?.includes('name') ? error : null}
        className="w-full"
        required
      />
      <Input
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="Số điện thoại"
        error={error?.includes('phone') ? error : null}
        className="w-full"
        required
      />
      
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Ngày sinh
        </label>
        <DatePicker
          name="birthday"
          value={formData.birthday}
          onChange={handleChange}
          error={error?.includes('birthday') ? error : null}
          required
        />
      </div>
      
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'}
          onChange={handleRecaptchaChange}
        />
      </div>
      
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      
      <Button
        type="submit"
        className="w-full"
        disabled={!formIsValid}
      >
        Đăng ký
      </Button>
    </form>
  );
};

export default RegisterForm;
