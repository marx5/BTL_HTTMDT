'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo mật khẩu đã được mã hóa
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Thêm tài khoản admin mặc định
    await queryInterface.bulkInsert('Users', [{
      email: 'vulv.nvgb@gmail.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  async down(queryInterface, Sequelize) {
    // Xóa tài khoản admin mặc định
    await queryInterface.bulkDelete('Users', {
      email: 'vulv.nvgb@gmail.com'
    }, {});
  }
}; 