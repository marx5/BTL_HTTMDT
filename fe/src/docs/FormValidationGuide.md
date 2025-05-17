# Form Validation Guide

Hướng dẫn này giải thích cách thực hiện xác thực biểu mẫu (form validation) nhất quán trong ứng dụng của chúng ta.

## Giới thiệu

Chúng ta đã triển khai một hệ thống xác thực biểu mẫu nhất quán, tận dụng hook `useFormValidation` tùy chỉnh. Cách tiếp cận này cung cấp một giao diện thống nhất cho tất cả các thành phần biểu mẫu và xác thực, đảm bảo tính nhất quán trong trải nghiệm người dùng.

## Tệp tin chính

1. **validation.js**: Chứa các tiện ích xác thực để kiểm tra giá trị.
2. **useFormValidation.js**: Hook tùy chỉnh mà các thành phần biểu mẫu sẽ sử dụng.

## Cách sử dụng

### 1. Định nghĩa lược đồ xác thực (Validation Schema)

```jsx
// Lược đồ xác thực mô tả quy tắc cho từng trường
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
  // Các trường khác...
};
```

### 2. Sử dụng useFormValidation Hook

```jsx
import useFormValidation from '../../hooks/useFormValidation';

const MyForm = ({ onSubmit }) => {
  // Giá trị ban đầu của biểu mẫu
  const initialValues = {
    email: '',
    password: '',
    // Các trường khác...
  };

  // Sử dụng hook xác thực biểu mẫu
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

  // Hàm xử lý gửi biểu mẫu
  const handleFormSubmit = async (formValues) => {
    try {
      // formValues đã được xác thực
      await onSubmit(formValues);
    } catch (err) {
      // Ném lỗi để hook xác thực biểu mẫu bắt được
      throw { field: 'fieldName', message: 'Thông báo lỗi' };
      // hoặc
      throw { field: '_form', message: 'Lỗi chung cho toàn bộ biểu mẫu' };
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.email && errors.email ? errors.email : null}
      />
      {/* Các trường khác... */}
      
      {/* Hiển thị lỗi chung */}
      {errors._form && (
        <p className="text-red-500">{errors._form}</p>
      )}
      
      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Đang xử lý...' : 'Gửi'}
      </button>
    </form>
  );
};
```

### 3. Các quy tắc xác thực có sẵn

- **required**: Trường không được để trống
- **email**: Phải là địa chỉ email hợp lệ
- **minLength**: Độ dài tối thiểu
- **match**: Khớp với giá trị của trường khác
- **phone**: Phải là số điện thoại hợp lệ (10-11 số)
- **validate**: Hàm xác thực tùy chỉnh

### 4. Xử lý lỗi từ API

Khi gặp lỗi từ API, bạn có thể ném lỗi với cấu trúc đặc biệt để hook xác thực biểu mẫu xử lý:

```jsx
try {
  await apiCall();
} catch (error) {
  // Lỗi cho trường cụ thể
  throw { field: 'email', message: 'Email đã tồn tại' };
  
  // HOẶC lỗi chung
  throw { field: '_form', message: 'Có lỗi xảy ra, vui lòng thử lại' };
}
```

## Ví dụ đầy đủ

Xem `src/components/auth/LoginForm.jsx` để thấy ví dụ về triển khai đầy đủ.

## Lợi ích

- **Nhất quán**: Tất cả biểu mẫu hoạt động theo cùng một cách
- **Dễ bảo trì**: Logic xác thực được tập trung trong một hook có thể tái sử dụng
- **Tiết kiệm code**: Không cần viết lại logic xác thực cho mỗi biểu mẫu
- **Trải nghiệm người dùng tốt hơn**: Xác thực theo trường, hiển thị lỗi nhất quán

## Quy ước

1. Mọi biểu mẫu nên sử dụng hook `useFormValidation` cho xác thực
2. Biểu mẫu nên xác thực khi người dùng rời khỏi trường (onBlur)
3. Lỗi chỉ nên hiển thị sau khi trường đã được chạm vào (touched)
4. Dùng trường errors._form cho lỗi toàn bộ biểu mẫu 