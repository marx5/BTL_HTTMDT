-- Xóa dữ liệu cũ
DELETE FROM Banners;

-- Insert banners
INSERT INTO Banners (
    id,
    imageUrl,
    productId,
    isActive,
    createdAt,
    updatedAt
) VALUES 
(1, '/uploads/banners/banner1.jpg', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, '/uploads/banners/banner2.jpg', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, '/uploads/banners/banner3.jpg', 6, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 