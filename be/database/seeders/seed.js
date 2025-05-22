const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Cấu hình database
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'fashion',
  multipleStatements: true
};

async function runSeeders() {
  let connection;
  try {
    // Kết nối database
    connection = await mysql.createConnection(dbConfig);

    console.log('Đang kết nối database...');

    // Đọc và chạy file admin
    console.log('Đang chạy seeder admin...');
    const adminSQL = fs.readFileSync(
      path.join(__dirname, '20240320-admin-seeder.sql'),
      'utf8'
    );
    await connection.query(adminSQL);
    console.log('✅ Đã chạy xong seeder admin');

    // Đọc và chạy file categories
    console.log('Đang chạy seeder danh mục...');
    const categoriesSQL = fs.readFileSync(
      path.join(__dirname, '20240320-categories-seeder.sql'),
      'utf8'
    );
    await connection.query(categoriesSQL);
    console.log('✅ Đã chạy xong seeder danh mục');

    // Đọc và chạy file products
    console.log('Đang chạy seeder sản phẩm...');
    const productsSQL = fs.readFileSync(
      path.join(__dirname, '20240320-products-seeder.sql'),
      'utf8'
    );
    await connection.query(productsSQL);
    console.log('✅ Đã chạy xong seeder sản phẩm');

    // Đọc và chạy file banners
    console.log('Đang chạy seeder banner...');
    const bannersSQL = fs.readFileSync(
      path.join(__dirname, '20240320-banners-seeder.sql'),
      'utf8'
    );
    await connection.query(bannersSQL);
    console.log('✅ Đã chạy xong seeder banner');

    console.log('🎉 Đã chạy xong tất cả seeders!');

  } catch (error) {
    console.error('❌ Lỗi khi chạy seeders:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Đã đóng kết nối database');
    }
  }
}

// Chạy seeders
runSeeders(); 