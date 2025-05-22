const express = require('express');
const router = express.Router();
const { Product, ProductVariant, Category } = require('../models');

// Lấy thông tin sản phẩm từ database
async function getProductsInfo() {
  try {
    console.log('Bắt đầu lấy sản phẩm');
    const products = await Product.findAll({
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariants',
          attributes: ['size', 'color', 'stock']
        },
        {
          model: Category,
          as: 'Category',
          attributes: ['name']
        }
      ],
      limit: 50
    });
    console.log('Danh sách sản phẩm:', JSON.stringify(products, null, 2)); // Thêm dòng này

    return products.map(product => ({
      name: product.name,
      price: product.price,
      category: product.Category?.name || 'Không có danh mục',
      variants: product.ProductVariants?.map(v => ({
        size: v.size,
        color: v.color,
        inStock: v.stock > 0
      })) || []
    }));
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Không thể kết nối với cơ sở dữ liệu');
  }
}

// Xử lý câu hỏi
function processQuestion(message, products) {
  message = message.toLowerCase();

  // Kiểm tra phủ định hoặc câu hỏi có/không
  const negativePatterns = [
    'không có sản phẩm', 
    'không có hàng', 
    'có sản phẩm nào không', 
    'có hàng không', 
    'shop có sản phẩm không', 
    'shop có hàng không'
  ];
  if (negativePatterns.some(pattern => message.includes(pattern))) {
    if (!products.length) {
      return 'Hiện tại cửa hàng không có sản phẩm nào.';
    }
    return `Cửa hàng hiện đang có ${products.length} sản phẩm. Bạn muốn xem chi tiết sản phẩm nào không?`;
  }

  // Danh sách sản phẩm
  if (
    message.includes('có những loại') ||
    message.includes('danh sách') ||
    message.includes('quần áo') ||
    message.includes('sản phẩm')
  ) {
    if (!products.length) {
      return 'Xin lỗi, hiện tại chưa có sản phẩm nào trong cửa hàng.';
    }
    return `Danh sách sản phẩm hiện có:\n${
      products.map(p => 
        `- ${p.name} (${p.price.toLocaleString('vi-VN')}đ)\n  Danh mục: ${p.category}\n  Biến thể: ${
          p.variants.length
            ? p.variants.map(v => `${v.size} - ${v.color} (${v.inStock ? 'Còn hàng' : 'Hết hàng'})`).join(', ')
            : 'Không có'
        }`
      ).join('\n\n')
    }`;
  }

  // Giá sản phẩm
  if (message.includes('giá') || message.includes('bao nhiêu')) {
    const productName = message.split('giá').pop().trim();
    const product = products.find(p => p.name.toLowerCase().includes(productName));
    if (product) {
      return `${product.name} có giá ${product.price.toLocaleString('vi-VN')}đ`;
    }
    return 'Xin lỗi, tôi không tìm thấy sản phẩm bạn đang hỏi. Bạn có thể mô tả rõ hơn được không?';
  }

  // Size/màu sắc
  if (message.includes('size') || message.includes('màu')) {
    const availableProducts = products.filter(p => p.variants && p.variants.some(v => v.inStock));
    if (availableProducts.length === 0) {
      return 'Xin lỗi, hiện tại chưa có thông tin về size và màu sắc.';
    }
    const sizes = [...new Set(availableProducts.flatMap(p => p.variants.map(v => v.size)))];
    const colors = [...new Set(availableProducts.flatMap(p => p.variants.map(v => v.color)))];
    return `Chúng tôi có các size: ${sizes.join(', ')}\nVà các màu: ${colors.join(', ')}`;
  }

  // Tình trạng còn hàng
  if (message.includes('còn hàng') || message.includes('còn size')) {
    const availableProducts = products.filter(p => p.variants && p.variants.some(v => v.inStock));
    if (availableProducts.length === 0) {
      return 'Xin lỗi, hiện tại không có sản phẩm nào còn hàng.';
    }
    return `Hiện tại cửa hàng còn ${availableProducts.length} sản phẩm.\nMột số sản phẩm nổi bật:\n${
      availableProducts.slice(0, 5).map(p => `- ${p.name} (${p.variants.filter(v => v.inStock).map(v => v.size).join(', ')})`).join('\n')
    }`;
  }

  // Hình thức thanh toán
  if (message.includes('thanh toán')) {
    return `Các hình thức thanh toán hiện có:
- Thanh toán khi nhận hàng (COD)
- Chuyển khoản qua VNPAY
- Ví điện tử MoMo`;
  }

  // Mặc định
  return `Xin chào! Tôi có thể giúp bạn:\n- Xem danh sách sản phẩm\n- Kiểm tra giá\n- Tư vấn size và màu sắc\n- Kiểm tra tình trạng còn hàng\nBạn cần hỗ trợ gì ạ?`;
}

// Route chatbot
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống' });
    }
    const products = await getProductsInfo();
    const response = processQuestion(message, products);
    res.json({ message: response });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Có lỗi xảy ra khi xử lý tin nhắn' });
  }
});

module.exports = router; 