'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm các danh mục cha
    const categories = [
      {
        name: 'Nam',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nữ',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Phụ kiện',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Thêm danh mục cha
    const insertedCategories = await queryInterface.bulkInsert('Categories', categories, { returning: true });

    // Lấy ID của danh mục cha
    const [namId, nuId, phuKienId] = insertedCategories;

    // Thêm danh mục con
    await queryInterface.bulkInsert('Categories', [
      // Danh mục con của Nam
      {
        name: 'Áo Nam',
        parentId: namId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Quần Nam',
        parentId: namId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Danh mục con của Nữ
      {
        name: 'Áo Nữ',
        parentId: nuId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Quần Nữ',
        parentId: nuId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Danh mục con của Phụ kiện
      {
        name: 'Giày Dép',
        parentId: phuKienId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Túi Xách',
        parentId: phuKienId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // Xóa tất cả các danh mục
    await queryInterface.bulkDelete('Categories', null, {});
  }
}; 