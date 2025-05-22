-- Insert parent categories
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(1, 'Nam', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Nữ', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Trẻ em', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert subcategories for Nam
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(11, 'Nam - Áo thun', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'Nam - Áo sơ mi', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, 'Nam - Quần jean', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 'Nam - Quần khaki', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(15, 'Nam - Quần short', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(16, 'Nam - Áo khoác', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert subcategories for Nữ
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(21, 'Nữ - Áo thun', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(22, 'Nữ - Áo sơ mi', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(23, 'Nữ - Váy', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(24, 'Nữ - Quần jean', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(25, 'Nữ - Quần short', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(26, 'Nữ - Áo khoác', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(27, 'Nữ - Đầm', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert subcategories for Trẻ em
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(31, 'Trẻ em - Bé trai', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(32, 'Trẻ em - Bé gái', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(33, 'Trẻ em - Sơ sinh', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert subcategories for Bé trai
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(311, 'Bé trai - Áo thun', 31, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(312, 'Bé trai - Quần jean', 31, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(313, 'Bé trai - Quần short', 31, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(314, 'Bé trai - Áo khoác', 31, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert subcategories for Bé gái
INSERT INTO Categories (id, name, parentId, createdAt, updatedAt) VALUES
(321, 'Bé gái - Áo thun', 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(322, 'Bé gái - Váy', 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(323, 'Bé gái - Quần jean', 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(324, 'Bé gái - Quần short', 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(325, 'Bé gái - Áo khoác', 32, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 