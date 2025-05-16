import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useApiWithToken = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const callApi = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      // Truyền token từ AuthContext vào các hàm API
      const response = await apiFunction(...args, token);
      setData(response);
      return response;
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi gọi API.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { data, loading, error, callApi };
};

export default useApiWithToken; 