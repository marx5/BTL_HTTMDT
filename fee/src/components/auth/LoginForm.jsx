import { useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import ReCAPTCHA from 'react-google-recaptcha';
import useFormValidation from '../../hooks/useFormValidation';

const LoginForm = ({ onSubmit }) => {
  const recaptchaRef = useRef(null);
  
  // Define validation schema
  const validationSchema = {
    email: { 
      required: true, 
      email: true,
      label: 'email'
    },
    password: { 
      required: true, 
      minLength: 6,
      label: 'mật khẩu'
    },
  };
  
  // Initial form values
  const initialValues = {
    email: '',
    password: '',
    recaptchaToken: null,
  };

  // Use our form validation hook
  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    setFieldValue,
    handleSubmit,
  } = useFormValidation(initialValues, validationSchema);

  const handleRecaptchaChange = (value) => {
    setFieldValue('recaptchaToken', value);
  };

  const resetRecaptcha = () => {
    if (recaptchaRef.current) {
      setFieldValue('recaptchaToken', null);
      recaptchaRef.current.reset();
    }
  };

  const handleFormSubmit = async (formValues) => {
    try {
      // Form is already validated by the hook
      if (!formValues.recaptchaToken) {
        throw { field: 'recaptchaToken', message: 'Vui lòng xác nhận reCAPTCHA' };
      }
      
      await onSubmit(formValues.email, formValues.password, formValues.recaptchaToken);
    } catch (err) {
      console.error('Login error:', err);
      resetRecaptcha();
      
      // Throw the error to be caught by the form hook
      throw err;
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Input
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Email"
        error={touched.email && errors.email ? errors.email : null}
        className="w-full"
        required
      />
      
      <Input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Mật khẩu"
        error={touched.password && errors.password ? errors.password : null}
        className="w-full"
        required
      />
      
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={handleRecaptchaChange}
        />
      </div>
      
      {errors._form && (
        <p className="text-red-500 text-sm text-center">{errors._form}</p>
      )}
      
      {errors.recaptchaToken && (
        <p className="text-red-500 text-sm text-center">{errors.recaptchaToken}</p>
      )}
      
      <Button
        type="submit"
        className="w-full"
        disabled={!values.email || !values.password || !values.recaptchaToken || isSubmitting}
      >
        {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
      </Button>
    </form>
  );
};

export default LoginForm;
