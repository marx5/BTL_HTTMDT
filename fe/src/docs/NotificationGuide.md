# Hướng dẫn sử dụng hệ thống thông báo

Tài liệu này hướng dẫn cách sử dụng hệ thống thông báo nhất quán trong ứng dụng của chúng ta.

## Giới thiệu

Hệ thống thông báo (notification) của ứng dụng đã được chuẩn hóa để đảm bảo tính nhất quán về nội dung thông báo và giao diện người dùng. Việc này giúp:

1. **Tránh trùng lặp**: Một thông báo lỗi/thành công chỉ cần được định nghĩa một lần
2. **Nhất quán**: Cùng một hành động luôn hiển thị cùng một thông báo
3. **Dễ bảo trì**: Tập trung tất cả thông báo vào một nơi, dễ thay đổi, cập nhật
4. **Đa ngôn ngữ**: Dễ dàng mở rộng sang nhiều ngôn ngữ trong tương lai

## Cách sử dụng

### 1. Import đúng cách

```jsx
// Luôn import từ utils/notification thay vì trực tiếp từ react-hot-toast
import { showSuccess, showError, NOTIFICATIONS } from '../utils/notification';

// KHÔNG sử dụng cách này
// import toast from 'react-hot-toast';
```

### 2. Sử dụng thông báo chuẩn hóa

```jsx
// Sử dụng thông báo chuẩn hóa từ NOTIFICATIONS
showSuccess(NOTIFICATIONS.auth.loginSuccess);
showError(NOTIFICATIONS.common.generalError);

// Với thông báo động
showError(NOTIFICATIONS.cart.outOfStock(5)); // "Số lượng vượt quá hàng tồn kho (5)"
```

### 3. Xử lý lỗi từ API

```jsx
try {
  await apiCall();
  showSuccess(NOTIFICATIONS.common.operationSuccess);
} catch (error) {
  // showError sẽ tự động trích xuất thông báo lỗi từ response
  showError(error);
}
```

### 4. Xử lý thông báo có thời gian dài

```jsx
// Hiển thị thông báo loading
const toastId = showLoading('Đang xử lý đơn hàng...');

try {
  await processOrder();
  // Cập nhật thông báo thành công
  updateToast(toastId, NOTIFICATIONS.order.createSuccess, 'success');
} catch (error) {
  // Cập nhật thành thông báo lỗi
  updateToast(toastId, error.message || NOTIFICATIONS.common.operationFailed, 'error');
}
```

### 5. Tùy chỉnh

```jsx
// Tùy chỉnh thời gian hiển thị
showSuccess(NOTIFICATIONS.auth.loginSuccess, { duration: 5000 });

// Tùy chỉnh kiểu và vị trí hiển thị
showError(NOTIFICATIONS.common.generalError, {
  position: 'bottom-center',
  style: { background: '#F9FAFB' }
});
```

## Các loại thông báo

### Success
```jsx
showSuccess('Thao tác thành công');
```

### Error
```jsx
showError('Có lỗi xảy ra');
showError(error); // Tự động trích xuất thông báo lỗi từ đối tượng error
```

### Info
```jsx
showInfo('Thông tin hữu ích');
```

### Warning
```jsx
showWarning('Cảnh báo người dùng');
```

## Danh sách thông báo chuẩn hóa

Tất cả thông báo chuẩn hóa được định nghĩa trong `NOTIFICATIONS` trong file `utils/notification.js` và được tổ chức thành các nhóm:

- `auth`: Thông báo liên quan đến xác thực (đăng nhập, đăng ký, ...)
- `cart`: Thông báo liên quan đến giỏ hàng
- `product`: Thông báo liên quan đến sản phẩm
- `order`: Thông báo liên quan đến đơn hàng
- `address`: Thông báo liên quan đến địa chỉ
- `admin`: Thông báo trong trang quản trị
- `common`: Thông báo chung
- `profile`: Thông báo liên quan đến hồ sơ người dùng

## Quy ước

1. **Không sử dụng trực tiếp react-hot-toast**: Luôn sử dụng các hàm từ `utils/notification`
2. **Sử dụng thông báo chuẩn hóa**: Ưu tiên sử dụng thông báo từ `NOTIFICATIONS`
3. **Xử lý nhất quán**: Tất cả lỗi từ API nên được xử lý thông qua `showError(error)`
4. **Dùng ID cho thông báo phức tạp**: Với các thao tác dài, sử dụng `showLoading` và `updateToast`

## Mở rộng

Khi cần thêm một thông báo mới:

1. Thêm vào nhóm thích hợp trong `NOTIFICATIONS` trong file `utils/notification.js`
2. Sử dụng thông báo mới này trong các components

```jsx
// Thêm thông báo mới (ví dụ)
export const NOTIFICATIONS = {
  // ...existing notifications
  product: {
    // ...existing product notifications
    reviewSuccess: 'Cảm ơn bạn đã đánh giá sản phẩm!'
  }
};

// Sử dụng
showSuccess(NOTIFICATIONS.product.reviewSuccess);
``` 