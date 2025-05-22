'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lấy danh sách category con
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM Categories WHERE parentId IS NOT NULL',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const products = [];
    const variants = [];
    const images = [];

    // Định nghĩa tên sản phẩm theo danh mục
    const productNames = {
      'Áo Nam': [
        'Áo Polo Nam Cổ Trụ',
        'Áo Sơ Mi Nam Cổ Trụ',
        'Áo Thun Nam Cổ Tròn',
        'Áo Khoác Nam Bomber',
        'Áo Len Nam Cổ Lọ',
        'Áo Vest Nam Lịch Lãm',
        'Áo Hoodie Nam Thể Thao',
        'Áo Cardigan Nam Dáng Rộng'
      ],
      'Quần Nam': [
        'Quần Jeans Nam Slim Fit',
        'Quần Kaki Nam Công Sở',
        'Quần Short Nam Thể Thao',
        'Quần Tây Nam Lịch Lãm',
        'Quần Jogger Nam Năng Động',
        'Quần Cargo Nam Phong Cách',
        'Quần Tây Nam Vải Mềm',
        'Quần Jeans Nam Rách Phong Cách'
      ],
      'Áo Nữ': [
        'Áo Sơ Mi Nữ Cổ Trụ',
        'Áo Thun Nữ Cổ Tròn',
        'Áo Khoác Nữ Bomber',
        'Áo Len Nữ Cổ Lọ',
        'Áo Vest Nữ Thanh Lịch',
        'Áo Hoodie Nữ Thể Thao',
        'Áo Cardigan Nữ Dáng Rộng',
        'Áo Blazer Nữ Công Sở'
      ],
      'Quần Nữ': [
        'Quần Jeans Nữ Skinny',
        'Quần Kaki Nữ Công Sở',
        'Quần Short Nữ Thể Thao',
        'Quần Tây Nữ Thanh Lịch',
        'Quần Jogger Nữ Năng Động',
        'Quần Culottes Nữ Thời Trang',
        'Quần Tây Nữ Vải Mềm',
        'Quần Jeans Nữ Rách Phong Cách'
      ],
      'Giày Dép': [
        'Giày Sneaker Nam Thể Thao',
        'Giày Lười Nam Công Sở',
        'Giày Boots Nam Phong Cách',
        'Giày Cao Gót Nữ Thanh Lịch',
        'Giày Sneaker Nữ Thể Thao',
        'Giày Sandal Nữ Mùa Hè',
        'Dép Quai Hậu Nam Nữ',
        'Giày Lười Nữ Công Sở'
      ],
      'Túi Xách': [
        'Túi Đeo Chéo Nam Thể Thao',
        'Túi Laptop Nam Công Sở',
        'Túi Backpack Nam Phong Cách',
        'Túi Xách Nữ Thời Trang',
        'Túi Đeo Chéo Nữ Thanh Lịch',
        'Túi Clutch Nữ Dự Tiệc',
        'Túi Tote Nữ Đi Chợ',
        'Túi Backpack Nữ Học Sinh'
      ]
    };

    // Tạo 50 sản phẩm
    for (let i = 1; i <= 50; i++) {
      // Chọn category ngẫu nhiên từ danh sách category con
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // Lấy danh sách tên sản phẩm cho category này
      const categoryProducts = productNames[category.name];
      const randomProductName = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
      
      // Tạo sản phẩm
      const product = {
        name: randomProductName,
        description: `Đây là một sản phẩm chất lượng cao với thiết kế hiện đại và phong cách thời trang.`,
        price: Math.floor(Math.random() * (200000 - 50000) + 50000), // Giá từ 50k đến 200k
        CategoryId: category.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      products.push(product);
    }

    // Thêm sản phẩm và lấy ID
    const insertedProducts = await queryInterface.bulkInsert('Products', products, { returning: true });

    // Tạo biến thể và hình ảnh cho mỗi sản phẩm
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const colors = ['Đen', 'Trắng', 'Xanh', 'Đỏ', 'Vàng'];

    for (let i = 0; i < insertedProducts.length; i++) {
      const productId = insertedProducts[i].id;
      const productNumber = i + 1;

      // Tạo 5 biến thể cho mỗi sản phẩm
      for (let j = 0; j < 5; j++) {
        variants.push({
          ProductId: productId,
          size: sizes[j],
          color: colors[j],
          stock: Math.floor(Math.random() * 50) + 10, // Số lượng từ 10-60
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Tạo 5 hình ảnh cho mỗi sản phẩm
      for (let k = 1; k <= 5; k++) {
        images.push({
          ProductId: productId,
          url: `/uploads/Sanpham${productNumber}_${k}.jpg`,
          isMain: k === 1, // Ảnh đầu tiên là ảnh chính
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    // Thêm biến thể và hình ảnh
    await queryInterface.bulkInsert('ProductVariants', variants, {});
    await queryInterface.bulkInsert('ProductImages', images, {});
  },

  async down(queryInterface, Sequelize) {
    // Xóa theo thứ tự để tránh lỗi khóa ngoại
    await queryInterface.bulkDelete('ProductImages', null, {});
    await queryInterface.bulkDelete('ProductVariants', null, {});
    await queryInterface.bulkDelete('Products', null, {});
  }
}; 