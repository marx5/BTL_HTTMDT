-- Insert products for Áo thun Nam
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(1, 'Áo thun nam basic', 'Áo thun nam basic chất liệu cotton 100%', 199000, 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Áo thun nam polo', 'Áo thun nam polo cổ trụ', 299000, 11, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Áo thun Nam
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(1, 'S', 'Đen', 50),
(1, 'M', 'Đen', 50),
(1, 'L', 'Đen', 50),
(1, 'S', 'Trắng', 50),
(1, 'M', 'Trắng', 50),
(1, 'L', 'Trắng', 50),
(2, 'S', 'Xanh', 50),
(2, 'M', 'Xanh', 50),
(2, 'L', 'Xanh', 50),
(2, 'S', 'Đỏ', 50),
(2, 'M', 'Đỏ', 50),
(2, 'L', 'Đỏ', 50);

-- Insert product images for Áo thun Nam
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(1, '/uploads/sanpham1_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, '/uploads/sanpham1_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, '/uploads/sanpham1_3.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '/uploads/sanpham2_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '/uploads/sanpham2_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '/uploads/sanpham2_3.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Áo sơ mi Nam
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(3, 'Áo sơ mi nam trắng', 'Áo sơ mi nam trắng công sở', 399000, 12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Áo sơ mi nam kẻ', 'Áo sơ mi nam kẻ caro', 349000, 12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Áo sơ mi Nam
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(3, 'S', 'Trắng', 50),
(3, 'M', 'Trắng', 50),
(3, 'L', 'Trắng', 50),
(4, 'S', 'Xanh', 50),
(4, 'M', 'Xanh', 50),
(4, 'L', 'Xanh', 50);

-- Insert product images for Áo sơ mi Nam
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(3, '/uploads/sanpham3_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '/uploads/sanpham3_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, '/uploads/sanpham4_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, '/uploads/sanpham4_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Quần jean Nam
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(5, 'Quần jean nam slim', 'Quần jean nam slim fit', 499000, 13, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Quần jean nam regular', 'Quần jean nam regular fit', 459000, 13, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Quần jean Nam
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(5, '28', 'Xanh đậm', 50),
(5, '30', 'Xanh đậm', 50),
(5, '32', 'Xanh đậm', 50),
(6, '28', 'Xanh nhạt', 50),
(6, '30', 'Xanh nhạt', 50),
(6, '32', 'Xanh nhạt', 50);

-- Insert product images for Quần jean Nam
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(5, '/uploads/sanpham5_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, '/uploads/sanpham5_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, '/uploads/sanpham6_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, '/uploads/sanpham6_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Áo thun Nữ
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(7, 'Áo thun nữ basic', 'Áo thun nữ basic cotton', 179000, 21, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Áo thun nữ crop top', 'Áo thun nữ crop top', 199000, 21, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Áo thun Nữ
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(7, 'S', 'Hồng', 50),
(7, 'M', 'Hồng', 50),
(7, 'L', 'Hồng', 50),
(8, 'S', 'Đen', 50),
(8, 'M', 'Đen', 50),
(8, 'L', 'Đen', 50);

-- Insert product images for Áo thun Nữ
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(7, '/uploads/sanpham7_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, '/uploads/sanpham7_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, '/uploads/sanpham8_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, '/uploads/sanpham8_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Váy Nữ
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(9, 'Váy liền thân', 'Váy liền thân công sở', 399000, 23, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'Váy xòe', 'Váy xòe dự tiệc', 499000, 23, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Váy Nữ
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(9, 'S', 'Đen', 50),
(9, 'M', 'Đen', 50),
(9, 'L', 'Đen', 50),
(10, 'S', 'Đỏ', 50),
(10, 'M', 'Đỏ', 50),
(10, 'L', 'Đỏ', 50);

-- Insert product images for Váy Nữ
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(9, '/uploads/sanpham9_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, '/uploads/sanpham9_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, '/uploads/sanpham10_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, '/uploads/sanpham10_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Áo thun Bé trai
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(11, 'Áo thun bé trai', 'Áo thun bé trai cotton', 99000, 311, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'Áo thun bé trai in hình', 'Áo thun bé trai in hình ngộ nghĩnh', 119000, 311, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Áo thun Bé trai
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(11, '3-4', 'Xanh', 50),
(11, '5-6', 'Xanh', 50),
(11, '7-8', 'Xanh', 50),
(12, '3-4', 'Đỏ', 50),
(12, '5-6', 'Đỏ', 50),
(12, '7-8', 'Đỏ', 50);

-- Insert product images for Áo thun Bé trai
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(11, '/uploads/sanpham11_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, '/uploads/sanpham11_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, '/uploads/sanpham12_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, '/uploads/sanpham12_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert products for Váy Bé gái
INSERT INTO Products (id, name, description, price, CategoryId, isActive, createdAt, updatedAt) VALUES
(13, 'Váy bé gái hoa', 'Váy bé gái họa tiết hoa', 159000, 322, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 'Váy bé gái công chúa', 'Váy bé gái kiểu công chúa', 199000, 322, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert product variants for Váy Bé gái
INSERT INTO ProductVariants (ProductId, size, color, stock) VALUES
(13, '3-4', 'Hồng', 50),
(13, '5-6', 'Hồng', 50),
(13, '7-8', 'Hồng', 50),
(14, '3-4', 'Xanh', 50),
(14, '5-6', 'Xanh', 50),
(14, '7-8', 'Xanh', 50);

-- Insert product images for Váy Bé gái
INSERT INTO ProductImages (ProductId, url, isMain, createdAt, updatedAt) VALUES
(13, '/uploads/sanpham13_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, '/uploads/sanpham13_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, '/uploads/sanpham14_1.jpg', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, '/uploads/sanpham14_2.jpg', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 