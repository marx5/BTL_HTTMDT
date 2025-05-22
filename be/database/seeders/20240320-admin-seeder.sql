-- Xóa dữ liệu cũ
DELETE FROM Users WHERE email = 'admin@gmail.com';

-- Insert admin user
INSERT INTO Users (
    id,
    email,
    password,
    name,
    role,
    isVerified,
    createdAt,
    updatedAt
) VALUES (
    1,
    'admin@gmail.com',
    '12345678',
    'Admin',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
); 