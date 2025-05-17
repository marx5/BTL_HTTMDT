import { toast } from 'react-hot-toast';

/**
 * Thông báo chuẩn hóa - Centralized notification messages
 */
export const NOTIFICATIONS = {
  auth: {
    loginSuccess: 'Đăng nhập thành công!',
    logoutSuccess: 'Đăng xuất thành công!',
    registerSuccess: 'Đăng ký thành công! Vui lòng kiểm tra email để xác minh.',
    sessionExpired: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    resendVerifySuccess: 'Email xác minh đã được gửi lại.',
    unauthorized: 'Bạn không có quyền thực hiện thao tác này',
    accessDenied: 'Bạn không có quyền truy cập trang này',
    loginRequired: 'Vui lòng đăng nhập để tiếp tục'
  },
  cart: {
    addSuccess: 'Đã thêm sản phẩm vào giỏ hàng',
    removeSuccess: 'Đã xóa sản phẩm khỏi giỏ hàng',
    updateSuccess: 'Đã cập nhật giỏ hàng',
    outOfStock: (available) => `Số lượng vượt quá hàng tồn kho (${available || 'không đủ'})`,
    notExist: 'Sản phẩm không tồn tại trong giỏ hàng',
    empty: 'Giỏ hàng không tồn tại hoặc trống',
    selectRequired: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán'
  },
  product: {
    favoriteAddSuccess: 'Đã thêm sản phẩm vào danh sách yêu thích',
    favoriteRemoveSuccess: 'Đã xóa sản phẩm khỏi danh sách yêu thích',
    variantRequired: 'Vui lòng chọn biến thể sản phẩm',
    deleteSuccess: 'Xóa sản phẩm thành công!',
    updateSuccess: 'Cập nhật sản phẩm thành công!',
    createSuccess: 'Tạo sản phẩm thành công!'
  },
  order: {
    createSuccess: 'Đơn hàng đã được tạo thành công!',
    paymentFailed: 'Không thể tạo thanh toán. Vui lòng thử lại.',
    addressRequired: 'Vui lòng chọn địa chỉ giao hàng',
    updateStatusSuccess: 'Cập nhật trạng thái đơn hàng thành công!',
    loadFailed: 'Không thể tải thông tin đơn hàng'
  },
  address: {
    createSuccess: 'Đã thêm địa chỉ mới',
    updateSuccess: 'Đã cập nhật địa chỉ',
    deleteSuccess: 'Đã xóa địa chỉ',
    setDefaultSuccess: 'Đã đặt địa chỉ mặc định',
    validationError: 'Vui lòng điền đầy đủ thông tin địa chỉ'
  },
  admin: {
    categoryCreateSuccess: 'Thêm danh mục thành công!',
    categoryUpdateSuccess: 'Cập nhật danh mục thành công!',
    categoryDeleteSuccess: 'Xóa danh mục thành công!',
    userDeleteSuccess: 'Xóa người dùng thành công!',
    bannerCreateSuccess: 'Thêm banner thành công!',
    bannerUpdateSuccess: 'Cập nhật banner thành công!',
    bannerDeleteSuccess: 'Xóa banner thành công!'
  },
  common: {
    operationSuccess: 'Thao tác thành công!',
    operationFailed: 'Thao tác thất bại. Vui lòng thử lại sau.',
    generalError: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
    validationError: 'Vui lòng kiểm tra lại thông tin nhập vào.',
    loadFailed: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
    saveFailed: 'Không thể lưu dữ liệu. Vui lòng thử lại sau.',
    deleteFailed: 'Không thể xóa. Vui lòng thử lại sau.',
    uploadFailed: 'Tải lên thất bại. Vui lòng thử lại sau.',
    invalidFields: 'Một số trường không hợp lệ. Vui lòng kiểm tra lại.',
    missingRequired: 'Vui lòng nhập đầy đủ thông tin bắt buộc.',
    tooManyRequests: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
  },
  profile: {
    updateSuccess: 'Hồ sơ đã được cập nhật thành công'
  }
};

/**
 * Hiển thị thông báo thành công
 * @param {string} message - Nội dung thông báo
 * @param {object} options - Tùy chọn cho toast
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Hiển thị thông báo lỗi
 * @param {Error|string|object} error - Đối tượng lỗi hoặc thông báo lỗi
 * @param {string} defaultMessage - Thông báo mặc định khi không xác định được lỗi
 * @param {object} options - Tùy chọn cho toast
 */
export const showError = (error, defaultMessage = NOTIFICATIONS.common.generalError, options = {}) => {
  let errorMessage = defaultMessage;

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  }

  return toast.error(errorMessage, {
    duration: 3000,
    ...options,
  });
};

/**
 * Hiển thị thông báo thông tin
 * @param {string} message - Nội dung thông báo
 * @param {object} options - Tùy chọn cho toast
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Hiển thị thông báo cảnh báo
 * @param {string} message - Nội dung thông báo
 * @param {object} options - Tùy chọn cho toast
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    duration: 3000,
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B',
    },
    ...options,
  });
};

/**
 * Phân loại và hiển thị thông báo dựa trên loại
 * @param {string} type - Loại thông báo (success, error, info, warning)
 * @param {string} message - Nội dung thông báo
 * @param {object} options - Tùy chọn cho toast
 */
export const showNotification = (type, message, options = {}) => {
  switch (type.toLowerCase()) {
    case 'success':
      return showSuccess(message, options);
    case 'error':
      return showError(message, undefined, options);
    case 'warning':
      return showWarning(message, options);
    case 'info':
    default:
      return showInfo(message, options);
  }
};

/**
 * Hiển thị thông báo thành công với ID để có thể cập nhật sau
 * @param {string} message - Nội dung thông báo
 * @param {object} options - Tùy chọn cho toast
 * @returns {string} - ID của toast để có thể cập nhật
 */
export const showSuccessWithId = (message, options = {}) => {
  return toast.success(message, {
    duration: 3000,
    ...options,
  });
};

/**
 * Hiển thị thông báo thao tác đang xử lý, trả về ID để cập nhật kết quả sau
 * @param {string} message - Nội dung thông báo
 * @returns {string} - ID của toast để cập nhật sau
 */
export const showLoading = (message = 'Đang xử lý...') => {
  return toast.loading(message);
};

/**
 * Cập nhật thông báo đã hiển thị
 * @param {string} toastId - ID của toast cần cập nhật
 * @param {string} message - Nội dung thông báo mới
 * @param {string} type - Loại thông báo mới (success, error, warning, info)
 * @param {object} options - Tùy chọn cho toast
 */
export const updateToast = (toastId, message, type = 'success', options = {}) => {
  toast.dismiss(toastId);
  
  switch (type.toLowerCase()) {
    case 'success':
      return showSuccess(message, options);
    case 'error':
      return showError(message, message, options);
    case 'warning':
      return showWarning(message, options);
    case 'info':
    default:
      return showInfo(message, options);
  }
};

/**
 * Dismiss a specific toast
 * @param {string} toastId - ID of toast to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Tạo mặc định là toast để tương thích ngược
export default toast;