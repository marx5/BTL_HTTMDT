// Script để thêm cột paymentStatus và transactionDetails vào bảng Orders
const { sequelize } = require('../config/database');

async function addPaymentStatusColumns() {
  try {
    console.log('Bắt đầu thêm cột paymentStatus và transactionDetails vào bảng Orders...');
    
    // Kiểm tra xem cột paymentStatus đã tồn tại chưa
    const [paymentStatusColumns] = await sequelize.query(
      "SHOW COLUMNS FROM Orders LIKE 'paymentStatus'"
    );
    
    if (paymentStatusColumns.length === 0) {
      console.log('Đang thêm cột paymentStatus...');
      await sequelize.query(
        "ALTER TABLE Orders ADD COLUMN paymentStatus ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING'"
      );
      console.log('Đã thêm cột paymentStatus thành công!');
    } else {
      console.log('Cột paymentStatus đã tồn tại, bỏ qua bước này.');
    }
    
    // Kiểm tra xem cột transactionDetails đã tồn tại chưa
    const [transactionDetailsColumns] = await sequelize.query(
      "SHOW COLUMNS FROM Orders LIKE 'transactionDetails'"
    );
    
    if (transactionDetailsColumns.length === 0) {
      console.log('Đang thêm cột transactionDetails...');
      await sequelize.query(
        "ALTER TABLE Orders ADD COLUMN transactionDetails JSON DEFAULT NULL"
      );
      console.log('Đã thêm cột transactionDetails thành công!');
    } else {
      console.log('Cột transactionDetails đã tồn tại, bỏ qua bước này.');
    }
    
    console.log('Hoàn tất việc thêm cột!');
  } catch (error) {
    console.error('Lỗi khi thêm cột:', error);
  } finally {
    await sequelize.close();
  }
}

// Chạy function
addPaymentStatusColumns(); 