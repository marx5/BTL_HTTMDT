import { useState, useCallback } from 'react';

const useApi = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const response = await apiFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi khi gọi API.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, callApi };
};

export default useApi;
