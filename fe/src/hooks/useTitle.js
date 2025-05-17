import { useEffect } from 'react';

/**
 * Hook để thay đổi tiêu đề trang
 * @param {string} title - Tiêu đề trang
 * @param {string} [suffix=" - Fashion Store"] - Hậu tố tiêu đề
 */
export const useTitle = (title, suffix = " - Fashion Store") => {
  useEffect(() => {
    // Thêm tiêu đề mới
    document.title = title + suffix;

    // Cleanup khi component unmount
    return () => {
      document.title = "Fashion Store";
    };
  }, [title, suffix]);
};

export default useTitle;