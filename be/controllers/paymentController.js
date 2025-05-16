const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const paypal = require('paypal-rest-sdk');
const axios = require('axios');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendPaymentConfirmationEmail } = require('../utils/email');
const Joi = require('joi');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const querystring = require('querystring');
const dotenv = require('dotenv');
const paymentService = require('../services/paymentService');
const { PAYMENT_STATUS } = require('../constants/paymentStatus');

dotenv.config();

// Configure PayPal with environment variables
paypal.configure({
  mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

// Cấu hình VNPay
const vnp_TmnCode = process.env.VNP_TMN_CODE;
const vnp_HashSecret = process.env.VNP_HASH_SECRET;
const vnp_Url = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

// Thêm hỗ trợ cho thư viện VNPay mới (có thể cài đặt với npm install vnpay)
// Cần chạy: npm install vnpay --save
let vnpayInstance = null;
try {
  const { VNPay, ProductCode, VnpLocale, dateFormat } = require('vnpay');
  
  // Khởi tạo VNPay instance nếu thư viện đã được cài đặt
  vnpayInstance = new VNPay({
    tmnCode: vnp_TmnCode,
    secureSecret: vnp_HashSecret,
    vnpayHost: process.env.NODE_ENV === 'production' 
      ? 'https://sandbox.vnpayment.vn' 
      : 'https://sandbox.vnpayment.vn',
    testMode: process.env.NODE_ENV !== 'production',
    enableLog: true
  });
  
  console.log('VNPay library initialized successfully');
} catch (err) {
  console.log('VNPay library initialization error:', err);
  console.log('Using legacy implementation.');
}

// Get base URL for callback URLs
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FE_URL || 'https://your-production-domain.com';
  }
  return 'http://localhost:3000';
};

const createPaymentSchema = Joi.object({
  orderId: Joi.number().integer().required().messages({
    'number.base': 'orderId phải là số',
    'number.integer': 'orderId phải là số nguyên',
    'any.required': 'orderId là bắt buộc'
  }),
  paymentMethod: Joi.string().valid('paypal', 'cod', 'vnpay').required().messages({
    'string.base': 'Phương thức thanh toán không hợp lệ',
    'any.only': 'Chỉ hỗ trợ thanh toán qua PayPal, COD hoặc VNPAY',
    'any.required': 'Phương thức thanh toán là bắt buộc'
  })
});

async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const response = await axios.get(`http://data.fixer.io/api/latest`, {
      params: {
        access_key: process.env.FIXER_API_KEY,
        base: 'EUR',
        symbols: `${fromCurrency},${toCurrency}`,
      },
    });

    if (!response.data.success) {
      console.error('Fixer API error:', response.data.error);
      throw new AppError('failed_exchange_rate', 500);
    }

    const rates = response.data.rates;
    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new AppError('currency_not_supported', 400);
    }

    const vndToEur = rates[fromCurrency];
    const usdToEur = rates[toCurrency];
    const vndToUsd = usdToEur / vndToEur;
    return vndToUsd;
  } catch (error) {
    console.error('Exchange rate error:', error);
    throw new AppError('failed_exchange_rate', 500);
  }
}

exports.createPayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    console.log('Creating payment with data:', req.body);
    
    // Validate request body
    const { error, value } = createPaymentSchema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });

    if (error) {
      console.error('Validation error:', error.details);
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: errorMessage
      });
    }

    const { orderId, paymentMethod } = value;

    // Check if order exists and belongs to user
    const order = await Order.findOne({
      where: { 
        id: orderId, 
        UserId: req.user.id, 
        status: 'pending' 
      },
      transaction
    });

    if (!order) {
      console.error('Order not found:', { orderId, userId: req.user.id });
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy đơn hàng hoặc đơn hàng không hợp lệ'
      });
    }

    // Check if order is already paid
    const existingPayment = await Payment.findOne({
      where: { 
        OrderId: orderId, 
        status: 'completed' 
      },
      transaction
    });

    if (existingPayment) {
      console.error('Order already paid:', { orderId });
      return res.status(400).json({
        status: 'error',
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // Get exchange rate and convert amount
    const exchangeRate = await getExchangeRate('VND', 'USD');
    const totalInUSD = (order.total * exchangeRate).toFixed(2);
    console.log('Converted amount:', { vnd: order.total, usd: totalInUSD, rate: exchangeRate });

    // Prepare PayPal payment data
    const baseUrl = getBaseUrl();
    const paymentData = {
      intent: 'sale',
      payer: { payment_method: 'paypal' },
      redirect_urls: {
        return_url: `${baseUrl}/api/payments/success?orderId=${orderId}`,
        cancel_url: `${baseUrl}/api/payments/cancel?orderId=${orderId}`,
      },
      transactions: [
        {
          amount: {
            total: totalInUSD,
            currency: 'USD',
            details: {
              subtotal: totalInUSD,
              tax: '0.00',
              shipping: '0.00',
            },
          },
          description: `Payment for Order #${orderId}`,
          item_list: {
            items: [
              {
                name: `Order #${orderId}`,
                description: 'Your order items',
                quantity: '1',
                price: totalInUSD,
                currency: 'USD',
              },
            ],
          },
        },
      ],
    };

    console.log('Creating PayPal payment with data:', paymentData);

    // Create PayPal payment
    const payment = await new Promise((resolve, reject) => {
      paypal.payment.create(paymentData, (error, payment) => {
        if (error) {
          console.error('PayPal payment creation error:', error);
          reject(error);
          return;
        }
        resolve(payment);
      });
    });

    if (!payment || !payment.id) {
      return res.status(500).json({
        status: 'error',
        message: 'Không thể tạo thanh toán PayPal'
      });
    }

    console.log('PayPal payment created:', payment);

    // Create payment record in database
    const dbPayment = await Payment.create(
      {
        OrderId: orderId,
        paymentMethod,
        amount: order.total,
        status: 'pending',
        paypalPaymentId: payment.id,
      },
      { transaction }
    );

    await transaction.commit();
    console.log('Payment record created:', dbPayment.toJSON());

    // Get approval URL
    const approvalUrl = payment.links.find((link) => link.rel === 'approval_url')?.href;
    if (!approvalUrl) {
      return res.status(500).json({
        status: 'error',
        message: 'Không thể lấy URL thanh toán PayPal'
      });
    }

    console.log('Approval URL:', approvalUrl);

    return res.json({
      status: 'success',
      message: 'Thanh toán đã được tạo thành công.',
      paymentId: payment.id,
      approvalUrl,
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Payment creation error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Có lỗi xảy ra khi tạo thanh toán'
    });
  }
};

exports.paymentSuccess = async (req, res, next) => {
  try {
    const { orderId, paymentId, status, transactionId, amount } = req.body;

    const result = await paymentService.handlePaymentCallback({
      orderId,
      status,
      transactionId,
      amount
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.paymentCancel = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const result = await paymentService.updatePaymentStatus(
      orderId,
      PAYMENT_STATUS.CANCELLED,
      {
        reason: 'User cancelled payment',
        timestamp: new Date()
      }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.getPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({
      where: { OrderId: orderId },
      include: [
        {
          model: Order,
          as: 'Order',
          where: { UserId: req.user.id },
        },
      ],
    });

    if (!payment) {
      throw new AppError('payment_not_found', 404);
    }

    res.json({
      id: payment.id,
      orderId: payment.OrderId,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      amount: payment.amount,
      paypalPaymentId: payment.paypalPaymentId,
      paypalTransactionId: payment.paypalTransactionId,
    });
  } catch (err) {
    console.error('Get payment error:', err);
    next(err);
  }
};

// Xử lý thanh toán COD (Cash On Delivery)
exports.createCodPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: 'Mã đơn hàng không hợp lệ' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Cập nhật trạng thái đơn hàng
    await order.update({
      paymentStatus: 'PENDING', // Chờ thanh toán
      status: 'PROCESSING', // Đang xử lý đơn hàng
      paymentMethod: 'COD'
    });

    return res.status(200).json({
      success: true,
      message: 'Đặt hàng thành công, bạn sẽ thanh toán khi nhận hàng',
      order: order
    });
  } catch (error) {
    console.error('Error processing COD payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý thanh toán COD',
      error: error.message
    });
  }
};

// Tạo thanh toán VNPay
exports.createVnpayPayment = async (req, res) => {
  try {
    const { orderId, amount, ipAddr, orderInfo, returnUrl } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    // Tìm đơn hàng
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Cập nhật phương thức thanh toán
    await order.update({ paymentMethod: 'VNPAY' });

    let paymentUrl;
    
    // Sử dụng thư viện VNPay mới nếu đã cài đặt
    if (vnpayInstance) {
      console.log('Using VNPay library for payment URL generation');
      try {
        // Tạo ngày hết hạn (24h sau)
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 1);
        
        // Import các thành phần cần thiết từ thư viện
        const { ProductCode, VnpLocale, dateFormat } = require('vnpay');
        
        // Tạo mã giao dịch duy nhất: orderId-timestamp
        const txnRef = `${orderId}-${Date.now()}`;
        
        // Tạo URL thanh toán
        paymentUrl = vnpayInstance.buildPaymentUrl({
          vnp_Amount: amount, // Thư viện sẽ tự nhân 100
          vnp_IpAddr: ipAddr || req.ip || '127.0.0.1',
          vnp_TxnRef: txnRef,
          vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
          vnp_OrderType: ProductCode.Other,
          vnp_ReturnUrl: returnUrl || vnp_ReturnUrl || `${process.env.CLIENT_URL}/payment-result`,
          vnp_Locale: VnpLocale.VN,
          vnp_CreateDate: dateFormat(new Date()),
          vnp_ExpireDate: dateFormat(expireDate)
        }, {
          withHash: true,
          logger: {
            type: 'all',
            loggerFn: (data) => {
              console.log('VNPay Payment URL Data:', data);
            }
          }
        });
        
        console.log('VNPay payment URL generated:', paymentUrl);
      } catch (libError) {
        console.error('Error using VNPay library:', libError);
        // Fallback to legacy implementation if library fails
        paymentUrl = createLegacyVnpayUrl(orderId, amount, ipAddr, req);
      }
    } else {
      // Sử dụng cách tiếp cận cũ
      console.log('Using legacy VNPay implementation');
      paymentUrl = createLegacyVnpayUrl(orderId, amount, ipAddr, req);
    }

    // Trả về URL thanh toán
    return res.status(200).json({
      success: true,
      paymentUrl: paymentUrl,
      order: order
    });
  } catch (error) {
    console.error('Error creating VNPAY payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo thanh toán VNPay',
      error: error.message
    });
  }
};

// Hàm tạo URL thanh toán theo cách cũ (để backward compatibility)
function createLegacyVnpayUrl(orderId, amount, ipAddr, req) {
  // Tạo thông tin thanh toán VNPay
  let date = new Date();
  let createDate = date.getFullYear().toString() +
    ('0' + (date.getMonth() + 1)).slice(-2) +
    ('0' + date.getDate()).slice(-2) +
    ('0' + date.getHours()).slice(-2) +
    ('0' + date.getMinutes()).slice(-2) +
    ('0' + date.getSeconds()).slice(-2);

  // Thêm 24h để tạo ngày hết hạn
  let expireDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  let expireDateTime = expireDate.getFullYear().toString() +
    ('0' + (expireDate.getMonth() + 1)).slice(-2) +
    ('0' + expireDate.getDate()).slice(-2) +
    ('0' + expireDate.getHours()).slice(-2) +
    ('0' + expireDate.getMinutes()).slice(-2) +
    ('0' + expireDate.getSeconds()).slice(-2);

  // Mã tham chiếu cho VNPay (unique cho mỗi giao dịch)
  let vnp_TxnRef = `${orderId}-${Date.now()}`;
  let vnp_Amount = amount * 100; // Nhân 100 vì VNPay yêu cầu số tiền tính bằng tiền nhỏ nhất của đơn vị tiền tệ (VND: 100 = 1đ)

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
    vnp_OrderType: 'billpayment',
    vnp_Amount: vnp_Amount,
    vnp_ReturnUrl: vnp_ReturnUrl || `${process.env.CLIENT_URL}/payment-result`,
    vnp_IpAddr: ipAddr || req.ip || '127.0.0.1',
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDateTime
  };

  // Sắp xếp các trường theo alphabet để tạo URL
  const sortedParams = sortObject(vnp_Params);
  
  // Tạo chữ ký
  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex"); 
  
  // Thêm chữ ký vào params
  sortedParams['vnp_SecureHash'] = signed;
  
  // Tạo URL thanh toán
  return vnp_Url + '?' + querystring.stringify(sortedParams, { encode: false });
}

// VNPay payment return URL callback
exports.vnpayReturn = async (req, res) => {
  try {
    // Log all query parameters for debugging
    console.log('VNPay return query params:', req.query);
    
    // Get all VNPAY parameters from the request URL
    const vnpParams = req.query;
    
    // Check for the transaction reference
    const transactionRef = vnpParams.vnp_TxnRef;
    if (!transactionRef) {
      console.log('No transaction reference found in VNPAY return');
      // Redirect with error information for the frontend to handle
      return res.redirect(`${process.env.FE_URL}/payment/vnpay-result?message=missing_txn_ref`);
    }
    
    // Extract orderId from txnRef (orderId_timestamp format)
    let orderId;
    if (transactionRef.includes('_')) {
      orderId = transactionRef.split('_')[0];
    } else if (transactionRef.includes('-')) {
      orderId = transactionRef.split('-')[0];
    } else {
      orderId = transactionRef; // Fallback if no separator is found
    }
    
    console.log(`Extracted orderId: ${orderId} from txnRef: ${transactionRef}`);
    
    // Check if order exists
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.log(`Order with ID ${orderId} not found`);
      // Redirect with order not found parameter
      return res.redirect(
        `${process.env.FE_URL}/payment/vnpay-result?vnp_TxnRef=${transactionRef}&vnp_ResponseCode=99&order_not_found=true`
      );
    }
    
    try {
      // Use vnpay library to verify signature and process payment
      const vnp_Params = req.query;
      const secureHash = vnp_Params['vnp_SecureHash'];
      
      // Remove hash from vnp_Params
      delete vnp_Params['vnp_SecureHash'];
      if (vnp_Params['vnp_SecureHashType']) {
        delete vnp_Params['vnp_SecureHashType'];
      }
      
      // Sort params by key before signing
      const sortedParams = sortObject(vnp_Params);
      
      // Create signature string
      const secretKey = process.env.VNP_HASH_SECRET;
      const signData = querystring.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac('sha512', secretKey);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
      
      // Verify signature
      if (secureHash !== signed) {
        console.log('Invalid signature from VNPay');
        console.log('Expected:', signed);
        console.log('Received:', secureHash);
        
        // Redirect with invalid signature parameter
        return res.redirect(
          `${process.env.FE_URL}/payment/vnpay-result?vnp_TxnRef=${transactionRef}&vnp_ResponseCode=${vnp_Params.vnp_ResponseCode || '99'}&invalid_signature=true`
        );
      }
      
      // Process the payment based on response code
      const responseCode = vnp_Params['vnp_ResponseCode'];
      console.log(`VNPay response code: ${responseCode}`);
      
      // Create transaction info object
      const transactionInfo = {
        transactionId: vnp_Params['vnp_TransactionNo'] || '',
        bankCode: vnp_Params['vnp_BankCode'] || '',
        cardType: vnp_Params['vnp_CardType'] || '',
        payDate: vnp_Params['vnp_PayDate'] || '',
        amount: vnp_Params['vnp_Amount'] ? Number(vnp_Params['vnp_Amount'])/100 : 0,
        responseCode: responseCode
      };
      
      // Update order payment status using the exported function
      const updateResult = await exports.updateOrderPaymentStatus(
        orderId, 
        responseCode === '00' ? 'PAID' : 'FAILED',
        transactionInfo
      );
      
      if (!updateResult.success) {
        console.error('Failed to update order payment status:', updateResult.message);
      }
      
      // Redirect to frontend with all original VNPay parameters
      const redirectUrl = `${process.env.FE_URL}/payment/vnpay-result?${querystring.stringify(vnp_Params)}`;
      console.log('Redirecting to:', redirectUrl);
      return res.redirect(redirectUrl);
      
    } catch (verificationError) {
      console.error('Error during VNPay verification:', verificationError);
      
      // Try legacy handling as fallback
      return exports.handleVnpayLegacy(req, res, order);
    }
  } catch (error) {
    console.error('Error in vnpayReturn:', error);
    
    // Redirect with server error parameter
    return res.redirect(`${process.env.FE_URL}/payment/vnpay-result?message=server_error`);
  }
};

// Helper function to update order payment status
exports.updateOrderPaymentStatus = async (orderId, status, transactionInfo = {}) => {
  try {
    console.log(`Đang cập nhật trạng thái thanh toán cho đơn hàng ${orderId}: ${status}`);
    
    const order = await Order.findByPk(orderId);
    if (!order) {
      console.error(`Order not found for ID: ${orderId}`);
      return { success: false, message: 'Order not found' };
    }
    
    console.log(`Đơn hàng được tìm thấy, trạng thái hiện tại: ${order.paymentStatus}`);
    
    // Cập nhật trạng thái thanh toán
    order.paymentStatus = status;
    
    // Add transaction information if provided
    if (Object.keys(transactionInfo).length > 0) {
      console.log('Cập nhật thông tin giao dịch:', transactionInfo);
      order.transactionDetails = {
        ...order.transactionDetails,
        ...transactionInfo,
        updatedAt: new Date()
      };
    }
    
    await order.save();
    console.log(`Đã cập nhật trạng thái thanh toán thành công: ${status}`);
    
    // Cập nhật cả Payment record nếu có
    try {
      const payment = await Payment.findOne({ where: { OrderId: orderId } });
      if (payment) {
        await payment.update({
          status: status === 'PAID' ? 'completed' : status === 'FAILED' ? 'failed' : 'pending'
        });
        console.log(`Đã cập nhật trạng thái Payment record: ${payment.status}`);
      } else {
        console.log('Không tìm thấy Payment record cho đơn hàng này');
      }
    } catch (paymentErr) {
      console.error('Lỗi khi cập nhật Payment record:', paymentErr);
    }
    
    return { success: true, order };
  } catch (error) {
    console.error('Error updating order payment status:', error);
    return { success: false, message: error.message };
  }
};

// Legacy VNPAY handling function
exports.handleVnpayLegacy = async (req, res, order) => {
  try {
    console.log('Falling back to legacy VNPay handling');
    
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    
    // Remove hash from vnp_Params
    delete vnp_Params['vnp_SecureHash'];
    if (vnp_Params['vnp_SecureHashType']) {
      delete vnp_Params['vnp_SecureHashType'];
    }
    
    // Sort params by key before signing
    const sortedParams = sortObject(vnp_Params);
    
    // Create signature string
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", process.env.VNP_HASH_SECRET);
    const signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
    
    // Verify signature
    if (secureHash !== signed) {
      console.log('Invalid signature in legacy handler');
      
      // Redirect with invalid signature parameter
      return res.redirect(
        `${process.env.FE_URL}/payment/vnpay-result?vnp_TxnRef=${vnp_Params.vnp_TxnRef}&vnp_ResponseCode=${vnp_Params.vnp_ResponseCode || '99'}&invalid_signature=true`
      );
    }
    
    // Process payment based on response code
    const responseCode = vnp_Params['vnp_ResponseCode'];
    
    // Create transaction info object
    const transactionInfo = {
      transactionId: vnp_Params['vnp_TransactionNo'] || '',
      bankCode: vnp_Params['vnp_BankCode'] || '',
      cardType: vnp_Params['vnp_CardType'] || '',
      payDate: vnp_Params['vnp_PayDate'] || '',
      amount: vnp_Params['vnp_Amount'] ? Number(vnp_Params['vnp_Amount'])/100 : 0,
      responseCode: responseCode
    };
    
    // Update order payment status using the exported function
    const orderId = order.id;
    const updateResult = await exports.updateOrderPaymentStatus(
      orderId, 
      responseCode === '00' ? 'PAID' : 'FAILED',
      transactionInfo
    );
    
    if (!updateResult.success) {
      console.error('Failed to update order payment status in legacy handler:', updateResult.message);
    }
    
    // Redirect to frontend with all VNPay parameters
    const redirectUrl = `${process.env.FE_URL}/payment/vnpay-result?${querystring.stringify(vnp_Params)}`;
    console.log('Legacy handler redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in handleVnpayLegacy:', error);
    return res.redirect(`${process.env.FE_URL}/payment/vnpay-result?message=server_error`);
  }
};

// Tạo thanh toán PayPal
exports.createPaypalPayment = async (req, res) => {
  try {
    const { orderId, returnUrl, cancelUrl } = req.body;

    if (!orderId || !returnUrl || !cancelUrl) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    const order = await Order.findByPk(orderId, {
      include: { all: true }
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Cập nhật phương thức thanh toán
    await order.update({ paymentMethod: 'PAYPAL' });

    // Tính toán tổng tiền (đổi VND sang USD với tỷ giá xấp xỉ)
    const exchangeRate = 0.000042; // 1 VND ≈ 0.000042 USD
    const totalAmount = (order.totalAmount * exchangeRate).toFixed(2);

    // Tạo thanh toán PayPal
    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal"
      },
      redirect_urls: {
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      transactions: [{
        item_list: {
          items: [{
            name: `Đơn hàng #${orderId}`,
            sku: `ORDER-${orderId}`,
            price: totalAmount,
            currency: "USD",
            quantity: 1
          }]
        },
        amount: {
          currency: "USD",
          total: totalAmount
        },
        description: `Thanh toán đơn hàng #${orderId}`
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        console.error('Error creating PayPal payment:', error);
        return res.status(500).json({
          success: false,
          message: 'Có lỗi xảy ra khi tạo thanh toán PayPal',
          error: error.response || error
        });
      } else {
        // Tìm URL phê duyệt từ các links trả về
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === 'approval_url') {
            return res.status(200).json({
              success: true,
              approvalUrl: payment.links[i].href,
              paymentId: payment.id,
              order: order
            });
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi tạo thanh toán PayPal',
      error: error.message
    });
  }
};

// Xử lý callback thành công từ PayPal
exports.executePaypalPayment = async (req, res) => {
  try {
    const { paymentId, PayerID, orderId } = req.body;

    if (!paymentId || !PayerID || !orderId) {
      return res.status(400).json({ message: 'Thiếu thông tin thanh toán' });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Tính toán tổng tiền (đổi VND sang USD với tỷ giá xấp xỉ)
    const exchangeRate = 0.000042; // 1 VND ≈ 0.000042 USD
    const totalAmount = (order.totalAmount * exchangeRate).toFixed(2);

    const execute_payment_json = {
      payer_id: PayerID,
      transactions: [{
        amount: {
          currency: "USD",
          total: totalAmount
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
      if (error) {
        console.error('Error executing PayPal payment:', error);
        await order.update({ paymentStatus: 'FAILED' });
        return res.status(500).json({
          success: false,
          message: 'Có lỗi xảy ra khi hoàn tất thanh toán PayPal',
          error: error.response || error
        });
      } else {
        if (payment.state === 'approved') {
          // Thanh toán thành công
          await order.update({
            paymentStatus: 'PAID',
            status: 'PROCESSING'
          });
          return res.status(200).json({
            success: true,
            message: 'Thanh toán thành công',
            payment: payment,
            order: order
          });
        } else {
          // Thanh toán thất bại
          await order.update({ paymentStatus: 'FAILED' });
          return res.status(400).json({
            success: false,
            message: 'Thanh toán không được chấp thuận',
            paymentState: payment.state
          });
        }
      }
    });
  } catch (error) {
    console.error('Error executing PayPal payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi hoàn tất thanh toán PayPal',
      error: error.message
    });
  }
};

// Hàm sắp xếp object theo alphabet
function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let i = 0; i < keys.length; i++) {
    sorted[keys[i]] = obj[keys[i]];
  }
  return sorted;
}