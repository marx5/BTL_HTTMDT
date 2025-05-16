const winston = require('winston');

// Định nghĩa các màu sắc cho console
const colors = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  http: '\x1b[35m',  // Magenta
  debug: '\x1b[32m'  // Green
};

// Tạo định dạng cho console
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const color = colors[level] || '\x1b[0m';
  const reset = '\x1b[0m';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
  
  // Format thời gian ngắn gọn
  const time = new Date(timestamp).toLocaleTimeString();
  
  return `${color}[${time}] [${level.toUpperCase()}]${reset}: ${message} ${metaStr}`;
});

// Tạo logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// Thêm console transport trong môi trường không phải production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      consoleFormat
    )
  }));
}

// Helper functions cho console logs đơn giản
const consoleLog = {
  error: (message) => console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${message}`),
  warn: (message) => console.log('\x1b[33m%s\x1b[0m', `[WARNING] ${message}`),
  info: (message) => console.log('\x1b[36m%s\x1b[0m', `[INFO] ${message}`),
  debug: (message) => console.log('\x1b[32m%s\x1b[0m', `[DEBUG] ${message}`),
  http: (message) => console.log('\x1b[35m%s\x1b[0m', `[HTTP] ${message}`),
  success: (message) => console.log('\x1b[32m%s\x1b[0m', `[SUCCESS] ${message}`),

  // Logs cho đối tượng phức tạp
  object: (label, obj) => {
    console.log('\x1b[34m%s\x1b[0m', `--- ${label} ---`);
    console.dir(obj, { depth: null, colors: true });
    console.log('\x1b[34m%s\x1b[0m', '-'.repeat(label.length + 6));
  },

  // Tạo group log
  group: (label) => {
    console.log('\n\x1b[34m%s\x1b[0m', `=== ${label} ===`);
    return {
      end: () => console.log('\x1b[34m%s\x1b[0m', '='.repeat(label.length + 8) + '\n')
    };
  }
};

module.exports = { logger, consoleLog };