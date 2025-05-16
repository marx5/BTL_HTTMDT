/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/**/*.{js,jsx,ts,tsx}', // Áp dụng Tailwind cho tất cả file trong src
    ],
    theme: {
      extend: {
        colors: {
          primary: '#1D4ED8', // Màu chính (xanh đậm)
          secondary: '#F59E0B', // Màu phụ (vàng)
          neutral: '#F3F4F6', // Màu trung tính (xám nhạt)
          error: '#EF4444', // Màu lỗi (đỏ)
          success: '#10B981', // Màu thành công (xanh lá)
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'], // Font chính
        },
        spacing: {
          sm: '8px',
          md: '16px',
          lg: '24px',
        },
      },
    },
    plugins: [],
  };