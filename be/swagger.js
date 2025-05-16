const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Cửa Hàng Quần Áo',
      version: '1.0.0',
      description: 'Tài liệu API cho hệ thống thương mại điện tử bán quần áo',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`, 
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Quét các file route để lấy comment JSDoc
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;