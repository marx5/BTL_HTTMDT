import { useDispatch, useSelector } from 'react-redux';
import { 
  loginUser, 
  registerUser, 
  updateUserProfile, 
  fetchUserProfile,
  logout as logoutAction,
  clearError as clearErrorAction
} from '../redux/slices/authSlice';

// Hook này giúp chuyển đổi dễ dàng từ context sang redux
// Cung cấp API tương tự với useAuth hook cũ
export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading, error } = useSelector(state => state.auth);

  // Các hàm được bọc để hoạt động tương tự context
  const login = async (email, password, recaptchaToken) => {
    const resultAction = await dispatch(loginUser({ email, password, recaptchaToken }));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const register = async (userData) => {
    const resultAction = await dispatch(registerUser(userData));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const updateProfile = async (userData) => {
    const resultAction = await dispatch(updateUserProfile(userData));
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };

  const logout = () => {
    dispatch(logoutAction());
  };
  
  // Thêm phương thức để tải lại thông tin người dùng
  const getProfile = async () => {
    const resultAction = await dispatch(fetchUserProfile());
    if (resultAction.error) {
      throw new Error(resultAction.error.message);
    }
    return resultAction.payload;
  };
  
  // Thêm phương thức để xóa lỗi
  const clearAuthError = () => {
    dispatch(clearErrorAction());
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    getProfile,
    clearError: clearAuthError
  };
};

export default useAuth; 