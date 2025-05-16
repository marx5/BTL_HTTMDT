const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo Sequelize với cấu hình từ .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    // Chỉ hiển thị logging trong chế độ development và sử dụng hàm tùy chỉnh để hiển thị gọn hơn
    logging: process.env.NODE_ENV !== 'production' 
      ? (query) => {
          // Chỉ hiển thị các câu SQL ngắn gọn, không hiển thị đầy đủ câu truy vấn
          if (query.startsWith('Executing')) {
            const shortQuery = query.split(':')[0] + ': ' + query.split(':')[1]?.substring(0, 50);
            console.log('\x1b[34m%s\x1b[0m', shortQuery + (query.split(':')[1]?.length > 50 ? '...' : ''));
          }
        }
      : false,
  }
);

// Hàm khởi tạo database
async function initializeDatabase() {
  // Tạo Sequelize tạm thời không gắn với database cụ thể để kiểm tra/tạo DB
  const adminSequelize = new Sequelize(
    '',
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false, // Tắt logging cho adminSequelize để tránh nhiễu
    }
  );

  try {
    // Kiểm tra xem database đã tồn tại chưa
    const [results] = await adminSequelize.query(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
    if (results.length === 0) {
      // console.log(`Cơ sở dữ liệu ${process.env.DB_NAME} chưa tồn tại. Đang tạo...`);
      // console.log('--------------------------------');
      await adminSequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      // console.log(`Đã tạo cơ sở dữ liệu ${process.env.DB_NAME} thành công!`);
      // console.log('--------------------------------');
    } else {
      // console.log(`Cơ sở dữ liệu ${process.env.DB_NAME} đã tồn tại.`);
      // console.log('--------------------------------');
    }

    // Kiểm tra kết nối đến database
    await sequelize.authenticate();
    // console.log('Đã kết nối đến cơ sở dữ liệu thành công.');
    // console.log('--------------------------------');
  } catch (error) {
    // console.error('Lỗi khi khởi tạo cơ sở dữ liệu:', error.message);
    // console.log('--------------------------------');
    throw error;
  } finally {
    // Đóng kết nối adminSequelize
    await adminSequelize.close();
    // console.log('Admin Sequelize connection closed.');
    // console.log('--------------------------------');
  }
}

module.exports = { sequelize, initializeDatabase };