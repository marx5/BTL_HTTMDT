const { Op } = require('sequelize'); // Op để query dữ liệu
const Product = require('../models/Product'); // Product để tạo sản phẩm
const ProductVariant = require('../models/ProductVariant'); // ProductVariant để tạo biến thể sản phẩm
const ProductImage = require('../models/ProductImage'); // ProductImage để tạo ảnh sản phẩm
const Category = require('../models/Category'); // Category để tạo danh mục sản phẩm
const multer = require('multer'); // multer để upload ảnh
const path = require('path'); // path để xử lý đường dẫn file
const AppError = require('../utils/appError'); // AppError để xử lý lỗi
const Joi = require('joi'); // Joi để validate dữ liệu
const fs = require('fs').promises; // fs.promises để đổi tên file
const { v4: uuidv4 } = require('uuid'); // uuid để tạo id sản phẩm tạm thời

// Biến đếm upload cho từng request (chỉ dùng cho cập nhật)
let uploadCounter = {};

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: async (req, file, cb) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase();

      if (!req.params.id) { // << TẠO SẢN PHẨM MỚI
        // Tạo tên file tạm thời duy nhất bằng UUID
        const tempFilename = `${uuidv4()}${ext}`;
        
        // Lưu thông tin file tạm để xử lý sau khi tạo sản phẩm
        // req.files sẽ chứa thông tin từ multer, bao gồm cả 'filename' mà chúng ta vừa cb() ở dưới
        // Không cần req.uploadedFilesInfo riêng nữa nếu dùng req.files[i].filename và req.files[i].path
        // Không cần req.uploadedFilesInfo riêng nữa nếu dùng req.files[i].filename và req.files[i].path
        cb(null, tempFilename);
      } else { // << CẬP NHẬT SẢN PHẨM ĐÃ CÓ (logic này giữ nguyên)
        let productId = req.params.id;

        // Tạo key duy nhất cho mỗi lần upload (theo productId + thời gian)
        if (!req._uploadKey) {
          req._uploadKey = `${productId}_${Date.now()}`;
        }
        const uploadKey = req._uploadKey;
        if (!uploadCounter[uploadKey]) uploadCounter[uploadKey] = 1;
        else uploadCounter[uploadKey]++;

        // Đếm số ảnh hiện có nếu là cập nhật
        let index = uploadCounter[uploadKey];
        const existingImages = await ProductImage.count({ where: { ProductId: productId } });
        index += existingImages;

        const newFilename = `Sanpham${productId}_${index}${ext}`;
        cb(null, newFilename);

        // Xóa biến đếm sau khi upload xong (dọn dẹp)
        setTimeout(() => { delete uploadCounter[uploadKey]; }, 10000);
      }
    } catch (error) {
      cb(error);
    }
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('only_images_allowed'));
  },
}).array('images', 15);

exports.uploadImages = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
};

const getAllProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  categoryId: Joi.number().integer().optional(),
  search: Joi.string().optional(),
});
exports.getAllProducts = async (req, res, next) => {
  try {
    const { error, value } = getAllProductsSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { page, limit, categoryId, search } = value;
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    if (categoryId) {
      where.CategoryId = categoryId;
    }
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
      limit,
      offset,
    });

    // Tính toán totalStock cho mỗi sản phẩm
    const productsWithTotalStock = products.rows.map(product => {
      const plainProduct = product.toJSON(); // Chuyển Sequelize instance thành plain object
      plainProduct.totalStock = plainProduct.ProductVariants.reduce((sum, variant) => {
        return sum + (variant.stock || 0);
      }, 0);
      // Không cần trả về mảng ProductVariants đầy đủ nếu frontend chỉ cần totalStock
      // delete plainProduct.ProductVariants; // Bạn có thể bỏ dòng này nếu frontend vẫn cần ProductVariants cho mục đích khác
      return plainProduct;
    });

    res.json({
      products: productsWithTotalStock, // Trả về danh sách sản phẩm đã có totalStock
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    next(err);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductVariant, as: 'ProductVariants', required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
    });
    if (!product) {
      throw new Error('product_not_found');
    }
    res.json(product);
  } catch (err) {
    console.error('Error in getProductById:', err);
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, categoryId, variants, mainImageId } = req.body; // mainImageId ở đây nên là originalname của file ảnh chính

    // 1. Tạo sản phẩm "thật" trước tiên
    const product = await Product.create({
      name,
      description,
      price,
      CategoryId: categoryId,
      isActive: true // Mặc định sản phẩm mới là active
    });
    const realProductId = product.id;

    const createdImageRecords = []; // Để lưu các bản ghi ProductImage đã tạo

    // 2. Xử lý các file ảnh đã upload (nếu có)
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const fileFromMulter = req.files[i]; // file.filename ở đây là tên tạm (UUID.ext)
        const originalFileExtension = path.extname(fileFromMulter.originalname).toLowerCase();
        
        const imageIndex = i + 1; // Chỉ số đơn giản cho ảnh của sản phẩm mới
        const finalFilename = `Sanpham${realProductId}_${imageIndex}${originalFileExtension}`;
        const finalPathInUploadsDir = path.join('./uploads/', finalFilename);

        try {
          // Đổi tên file từ tên tạm (do multer lưu) sang tên cuối cùng
          // fileFromMulter.path là đường dẫn đầy đủ của file tạm multer đã lưu
          await fs.rename(fileFromMulter.path, finalPathInUploadsDir);

          // Tạo bản ghi ProductImage trong database
          const productImageRecord = await ProductImage.create({
            ProductId: realProductId,
            url: `/uploads/${finalFilename}`, // Lưu đường dẫn tương đối
            isMain: false, // Mặc định tất cả không phải ảnh chính ban đầu
          });
          createdImageRecords.push(productImageRecord);
        } catch (fileProcessingError) {
          console.error(`Lỗi xử lý file ${fileFromMulter.originalname}:`, fileProcessingError);
          // Cân nhắc: Xóa file đã upload nếu không đổi tên được, hoặc đánh dấu lỗi
          // throw new AppError('Lỗi trong quá trình xử lý ảnh upload.', 500); // Hoặc xử lý nhẹ nhàng hơn
        }
      }
    }

    // 3. Thiết lập ảnh chính
    if (createdImageRecords.length > 0) {
      let imageToSetAsMain = null;
      if (mainImageId && typeof mainImageId === 'string' && req.files) {
        // Tìm bản ghi ảnh tương ứng với originalname mà client gửi lên là mainImageId
        const mainFileOriginalName = mainImageId;
        const mainFileUploadedIndex = req.files.findIndex(f => f.originalname === mainFileOriginalName);
        
        if (mainFileUploadedIndex !== -1 && createdImageRecords[mainFileUploadedIndex]) {
          // Kiểm tra xem file đó có được xử lý thành công và có trong createdImageRecords không
          // (index của createdImageRecords có thể không khớp hoàn toàn nếu có lỗi xảy ra với 1 file nào đó)
          // Cách an toàn hơn là tìm trong createdImageRecords dựa trên url (nếu biết cách map originalname -> finalFilename -> url)
          // Tuy nhiên, nếu tất cả file được xử lý tuần tự và thành công, index sẽ khớp.
          // Để đơn giản, giả sử mainFileUploadedIndex hợp lệ cho createdImageRecords
          const potentialMainImage = createdImageRecords.find(imgRec => {
              const expectedSuffix = `_${mainFileUploadedIndex + 1}${path.extname(req.files[mainFileUploadedIndex].originalname).toLowerCase()}`;
              return imgRec.url.endsWith(expectedSuffix) && imgRec.url.includes(`/Sanpham${realProductId}_`);
          });
          if(potentialMainImage) imageToSetAsMain = potentialMainImage;

        }
      }

      if (imageToSetAsMain) {
        await imageToSetAsMain.update({ isMain: true });
      } else {
        // Nếu không có mainImageId hợp lệ, hoặc không tìm thấy, mặc định lấy ảnh đầu tiên
        await createdImageRecords[0].update({ isMain: true });
      }
    }

    // 4. Xử lý variants (logic này giữ nguyên, chỉ đảm bảo dùng realProductId)
    if (variants) {
      const parsedVariants = JSON.parse(variants);
      for (const variant of parsedVariants) {
        await ProductVariant.create({
          ProductId: realProductId, // Sử dụng ID sản phẩm thật
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        });
      }
    }
    
    // Lấy lại thông tin sản phẩm đầy đủ để trả về
    const finalProductDetails = await Product.findByPk(realProductId, {
        include: [
            { model: ProductImage, as: 'ProductImages' },
            { model: ProductVariant, as: 'ProductVariants' },
            { model: Category, as: 'Category' },
        ]
    });

    res.status(201).json({
      message: 'Sản phẩm đã được tạo thành công.',
      product: finalProductDetails,
    });

  } catch (err) {
    console.error('Error in createProduct:', err);
    // QUAN TRỌNG: Xử lý lỗi và dọn dẹp file
    // Nếu có lỗi xảy ra sau khi file đã được upload nhưng trước khi hoàn tất,
    // bạn có thể còn lại các file tạm trong thư mục uploads.
    if (req.files && req.files.length > 0 && !res.headersSent) {
        for (const file of req.files) {
            if (file.path) { // file.path là nơi multer đã lưu file tạm
                try {
                    await fs.unlink(file.path); 
                } catch (cleanupError) {
                    console.error('Lỗi dọn dẹp file tạm:', file.path, cleanupError);
                }
            }
        }
    }
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, categoryId, mainImageId } = req.body;
    const files = req.files;

    const product = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    if (!product) {
      throw new AppError('product_not_found', 404);
    }

    // Cập nhật thông tin cơ bản
    await product.update({
      name,
      description,
      price,
      CategoryId: categoryId,
    });

    // Xử lý ảnh
    if (files && files.length > 0) {
      // Thêm ảnh mới
      const newImages = files.map((file) => ({
        url: `/uploads/${file.filename}`,
        isMain: false,
        ProductId: product.id,
      }));

      await ProductImage.bulkCreate(newImages);
    }

    // Cập nhật ảnh chính nếu có thay đổi
    if (mainImageId !== undefined) {
      await ProductImage.update(
        { isMain: false },
        { where: { ProductId: product.id } }
      );
      await ProductImage.update(
        { isMain: true },
        { where: { ProductId: product.id, id: mainImageId } }
      );
    }

    // Lấy lại sản phẩm với thông tin đầy đủ
    const updatedProduct = await Product.findByPk(id, {
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in updateProduct:', err);
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      throw new Error('product_not_found');
    }
    await product.destroy();
    res.json({ message: 'Sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in deleteProduct:', err);
    next(err);
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const product = await Product.findByPk(id);
    if (!product) {
      throw new Error('product_not_found');
    }
    const image = await ProductImage.findByPk(imageId);
    if (!image || image.ProductId !== product.id) {
      throw new Error('image_not_found');
    }
    await image.destroy();
    res.json({ message: 'Hình ảnh sản phẩm đã được xóa thành công.' });
  } catch (err) {
    console.error('Error in deleteProductImage:', err);
    next(err);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // console.log('Search parameters by name or description:', { q, pageNum, limitNum });

    const where = {};
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductVariant, as: 'ProductVariants', required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
      limit: limitNum,
      offset,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limitNum),
    });
  } catch (err) {
    console.error('Error in searchProductsByName:', err);
    next(err);
  }
};

exports.filterProducts = async (req, res, next) => {
  try {
    const { categoryId, size, color, minPrice, maxPrice, inStock, page = 1, limit = 10 } = req.query;
    // console.log('Filter parameters:', { categoryId, size, color, minPrice, maxPrice, inStock, page, limit });
    
    // Xây dựng điều kiện bộ lọc
    const where = {};
    const variantWhere = {};
    
    if (categoryId) where.CategoryId = categoryId;
    if (minPrice) where.price = { [Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: maxPrice };
    if (size) variantWhere.size = size;
    if (color) variantWhere.color = color;
    if (inStock) variantWhere.stock = { [Op.gt]: 0 };

    // console.log('Where conditions:', where);
    // console.log('Variant where conditions:', variantWhere);

    const products = await Product.findAndCountAll({
      where,
      include: [
        { model: ProductVariant, as: 'ProductVariants', where: variantWhere, required: false },
        { model: ProductImage, as: 'ProductImages', required: false },
        { model: Category, as: 'Category', required: false },
      ],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    console.error('Error in filterProducts:', err);
    next(err);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: ProductVariant,
          as: 'ProductVariants',
          attributes: ['id', 'size', 'color', 'stock'],
          required: false,
        },
      ],
    });
    const inventory = products.map((product) => ({
      id: product.id,
      name: product.name,
      variants: product.ProductVariants.map((variant) => ({
        variantId: variant.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
      })),
      totalStock: product.ProductVariants.reduce((sum, variant) => sum + variant.stock, 0),
    }));
    res.json({
      message: 'Sản phẩm đã được tạo thành công.',
      inventory,
    });
  } catch (err) {
    console.error('Error in getInventoryReport:', err);
    next(err);
  }
};

exports.addProductVariants = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const variants = req.body;

    // Validate input
    if (!Array.isArray(variants)) {
      throw new AppError('variants_must_be_array', 400);
    }

    // Validate each variant
    for (const variant of variants) {
      if (!variant.size || !variant.color || typeof variant.stock !== 'number') {
        throw new AppError('invalid_variant_data', 400);
      }
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new AppError('product_not_found', 404);
    }

    // Check for existing variants
    const existingVariants = await ProductVariant.findAll({
      where: {
        ProductId: productId,
        [Op.or]: variants.map(v => ({
          size: v.size,
          color: v.color
        }))
      }
    });

    if (existingVariants.length > 0) {
      throw new AppError('variants_already_exist', 400);
    }

    const newVariants = variants.map(variant => ({
      ProductId: productId,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
    }));

    await ProductVariant.bulkCreate(newVariants);

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
        { model: ProductImage, as: 'ProductImages' },
        { model: Category, as: 'Category' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in addProductVariants:', err);
    next(err);
  }
};

exports.updateProductVariant = async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;
    const { stock } = req.body;

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        ProductId: productId,
      },
    });

    if (!variant) {
      throw new AppError('variant_not_found', 404);
    }

    await variant.update({ stock });

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in updateProductVariant:', err);
    next(err);
  }
};

exports.deleteProductVariant = async (req, res, next) => {
  try {
    const { productId, variantId } = req.params;

    const variant = await ProductVariant.findOne({
      where: {
        id: variantId,
        ProductId: productId,
      },
    });

    if (!variant) {
      throw new AppError('variant_not_found', 404);
    }

    await variant.destroy();

    const updatedProduct = await Product.findByPk(productId, {
      include: [
        { model: ProductVariant, as: 'ProductVariants' },
      ],
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error('Error in deleteProductVariant:', err);
    next(err);
  }
};

exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Lấy danh mục cha và tất cả danh mục con
    const category = await Category.findByPk(categoryId, {
      include: [{
        model: Category,
        as: 'Children',
        attributes: ['id'],
      }],
    });

    if (!category) {
      throw new AppError('category_not_found', 404);
    }

    // Tạo mảng chứa tất cả ID danh mục cần tìm
    const categoryIds = [
      category.id,
      ...category.Children.map(child => child.id)
    ];

    const products = await Product.findAndCountAll({
      where: {
        CategoryId: categoryIds,
        isActive: true
      },
      include: [
        { model: ProductImage, as: 'ProductImages' },
        { model: ProductVariant, as: 'ProductVariants' },
        { model: Category, as: 'Category' },
      ],
      limit,
      offset,
    });

    res.json({
      products: products.rows,
      totalPages: Math.ceil(products.count / limit),
    });
  } catch (err) {
    next(err);
  }
};