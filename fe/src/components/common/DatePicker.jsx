import React, { useState, useEffect } from 'react';

const DatePicker = ({ value, onChange, name, error, required = false }) => {
  // Phân tích giá trị date từ props (định dạng 'YYYY-MM-DD')
  const parseDate = (dateString) => {
    if (!dateString) return { day: '', month: '', year: '' };
    const [year, month, day] = dateString.split('-');
    return { day, month, year };
  };

  // State lưu trữ ngày, tháng, năm đã chọn
  const [date, setDate] = useState(parseDate(value));

  // Cập nhật state khi prop value thay đổi
  useEffect(() => {
    setDate(parseDate(value));
  }, [value]);

  // Tạo danh sách năm: chỉ 5 năm gần nhất, không vượt quá năm hiện tại
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Tạo danh sách tháng (1-12), nếu chọn năm hiện tại thì chỉ hiển thị đến tháng hiện tại
  const selectedYear = parseInt(date.year, 10);
  const maxMonth = selectedYear === currentYear ? new Date().getMonth() + 1 : 12;
  const months = Array.from({ length: maxMonth }, (_, i) => i + 1);

  // Tạo danh sách ngày (1-31, tùy thuộc vào tháng và năm), nếu chọn năm và tháng hiện tại thì chỉ hiển thị đến ngày hiện tại
  const selectedMonth = parseInt(date.month, 10);
  let maxDay;
  if (selectedYear === currentYear && selectedMonth === new Date().getMonth() + 1) {
    maxDay = new Date().getDate();
  } else if (selectedYear && selectedMonth) {
    maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
  } else {
    maxDay = 31;
  }
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  // Xử lý khi thay đổi giá trị
  const handleChange = (e) => {
    const { name: fieldName, value: fieldValue } = e.target;
    const newDate = { ...date, [fieldName]: fieldValue };
    setDate(newDate);

    // Nếu đủ 3 thông tin, tạo chuỗi date và gọi hàm onChange
    if (newDate.day && newDate.month && newDate.year) {
      const formattedMonth = String(newDate.month).padStart(2, '0');
      const formattedDay = String(newDate.day).padStart(2, '0');
      const dateString = `${newDate.year}-${formattedMonth}-${formattedDay}`;
      onChange({ target: { name, value: dateString } });
    } else if (onChange) {
      onChange({ target: { name, value: '' } });
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <select
          name="year"
          value={date.year}
          onChange={handleChange}
          className={`select-year block w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
          required={required}
        >
          <option value="">Năm</option>
          {years.map((year) => (
            <option key={`year-${year}`} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          name="month"
          value={date.month}
          onChange={handleChange}
          className={`block w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
          required={required}
        >
          <option value="">Tháng</option>
          {months.map((month) => (
            <option key={`month-${month}`} value={String(month).padStart(2, '0')}>
              {month}
            </option>
          ))}
        </select>
      </div>
      <div>
        <select
          name="day"
          value={date.day}
          onChange={handleChange}
          className={`block w-full px-3 py-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary`}
          required={required}
        >
          <option value="">Ngày</option>
          {days.map((day) => (
            <option key={`day-${day}`} value={String(day).padStart(2, '0')}>
              {day}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm col-span-3 mt-1">{error}</p>}
    </div>
  );
};

export default DatePicker;

// Thêm CSS cho dropdown năm chỉ hiển thị 5 dòng và có thể cuộn
const style = document.createElement('style');
style.innerHTML = `
  select.select-year option {
    /* Không thể kiểm soát số dòng option, nhưng có thể kiểm soát chiều cao dropdown */
  }
  select.select-year {
    max-height: 180px; /* Chiều cao tương ứng khoảng 5 dòng, có thể điều chỉnh */
    overflow-y: auto;
  }
`;
document.head.appendChild(style);