'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy 5 sản phẩm cụ thể từ các danh mục khác nhau
    const products = await queryInterface.sequelize.query(
      `SELECT p.id, p.name, c.name as categoryName 
       FROM Products p 
       JOIN Categories c ON p.CategoryId = c.id 
       WHERE p.name IN (
         'Áo Polo Nam Cổ Trụ',
         'Quần Jeans Nữ Skinny',
         'Giày Sneaker Nam Thể Thao',
         'Áo Sơ Mi Nữ Cổ Trụ',
         'Túi Xách Nữ Thời Trang'
       )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Tạo banner cho 5 sản phẩm đã chọn
    const banners = products.map((product, index) => ({
      imageUrl: `/uploads/banners/Banner${index + 1}.jpg`,
      productId: product.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Thêm banner vào database
    await queryInterface.bulkInsert('banners', banners, {});
  },

  async down(queryInterface, Sequelize) {
    // Xóa tất cả các banner
    await queryInterface.bulkDelete('banners', null, {});
  }
}; 