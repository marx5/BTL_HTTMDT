const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { sequelize, initializeDatabase } = require('./config/database');
const { logger, consoleLog } = require('./utils/logger'); // Sử dụng module logger mới
const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const addressRoutes = require('./routes/addressRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const cartRoutes = require('./routes/cartRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

// Khởi tạo app Express
require('dotenv').config();
const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
  maxAge: 3600,
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
})); // Bảo mật HTTP headers
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure static files with proper CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static('uploads'));

// Middleware đơn giản để ghi log các requests
app.use((req, res, next) => {
  // Set CORP and COOP headers to allow cross-origin resource access
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  consoleLog.http(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Swagger UI (chỉ bật trong môi trường development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Error handling
app.use(errorHandler);

// Graceful shutdown
let server;
async function startServer() {
  try {
    await initializeDatabase();
    await sequelize.sync({ force: false }); // Đồng bộ database, force: true để tạo lại bảng
    logger.info('Đã đồng bộ cơ sở dữ liệu thành công!');

    const PORT = process.env.PORT || 3456;
    const HOST = '0.0.0.0'; // Lắng nghe trên tất cả các địa chỉ mạng
    server = app.listen(PORT, HOST, () => {
      logger.info(`Máy chủ đang chạy trên cổng ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Swagger UI có sẵn tại http://localhost:${PORT}/api-docs`);
      }
    });

  } catch (error) {
    logger.error('Không thể khởi động máy chủ:', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('Nhận tín hiệu SIGTERM. Đang thực hiện graceful shutdown...');
  if (server) {
    server.close(async () => {
      logger.info('Server đã đóng.');
      try {
        await sequelize.close();
        logger.info('Kết nối database đã đóng.');
      } catch (error) {
        logger.error('Lỗi khi đóng kết nối database:', { error: error.message });
      }
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  logger.info('Nhận tín hiệu SIGINT. Đang thực hiện graceful shutdown...');
  if (server) {
    server.close(async () => {
      logger.info('Server đã đóng.');
      try {
        await sequelize.close();
        logger.info('Kết nối database đã đóng.');
      } catch (error) {
        logger.error('Lỗi khi đóng kết nối database:', { error: error.message });
      }
      process.exit(0);
    });
  }
});

startServer();