const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/email');
const Joi = require('joi');
const dotenv = require('dotenv');
const paymentService = require('../services/paymentService');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../constants/paymentStatus');
const qs = require('qs');
const crypto = require('crypto');
const { createHmac } = require('crypto');
const { request } = require('https');
dotenv.config();


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
    });
  } catch (err) {
    console.error('Get payment error:', err);
    next(err);
  }
};

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
      paymentStatus: PAYMENT_STATUS.PENDING, // Chờ thanh toán
      status: ORDER_STATUS.PENDING, // Đang xử lý đơn hàng
      paymentMethod: 'cod'
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

exports.updateOrderPaymentStatus = async (orderId, status, transactionInfo = {}) => {
  try {
    console.log(`Đang cập nhật trạng thái thanh toán cho đơn hàng ${orderId}: ${status}`);

    const order = await Order.findByPk(orderId, {
      include: [{ model: User, attributes: ['id', 'email'] }] // Lấy thông tin User để gửi email
    });
    if (!order) {
      console.error(`Order not found for ID: ${orderId}`);
      return { success: false, message: 'Order not found' };
    }

    console.log(`Đơn hàng được tìm thấy, trạng thái hiện tại: ${order.paymentStatus}`);

    const oldPaymentStatus = order.paymentStatus; // Lưu lại trạng thái cũ

    // Chỉ cập nhật paymentStatus, không động đến order.status
    order.paymentStatus = status;

    // Add transaction information if provided
    if (Object.keys(transactionInfo).length > 0) {
      console.log('Cập nhật thông tin giao dịch:', transactionInfo);
      order.transactionDetails = {
        ...(order.transactionDetails || {}), // Đảm bảo transactionDetails là một object
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
          status: status // Truyền đúng giá trị enum: 'PAID', 'FAILED', 'PENDING', ...
        });
        console.log(`Đã cập nhật trạng thái Payment record: ${payment.status}`);
      } else {
        console.log('Không tìm thấy Payment record cho đơn hàng này');
      }
    } catch (paymentErr) {
      console.error('Lỗi khi cập nhật Payment record:', paymentErr);
    }

    // Gửi email xác nhận nếu thanh toán thành công và trước đó chưa phải là PAID
    if (status === 'PAID' && oldPaymentStatus !== 'PAID' && order.User && order.User.email) {
      try {
        // Sử dụng sendOrderConfirmationEmail vì nội dung phù hợp sau khi thanh toán thành công
        await sendOrderConfirmationEmail(order.User.email, order.id, order.total, order.shippingFee, order.paymentMethod);
        console.log(`Email xác nhận đơn hàng đã được gửi cho đơn hàng ${order.id} sau khi thanh toán.`);
      } catch (emailError) {
        console.error(`Lỗi gửi email xác nhận đơn hàng cho ${order.id} sau thanh toán:`, emailError);
      }
    }

    return { success: true, order };
  } catch (error) {
    console.error('Error updating order payment status:', error);
    return { success: false, message: error.message };
  }
};

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort(); //
  for (const key of keys) {
    sorted[key] = obj[key]; //
  }
  return sorted;
}

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

// Tạo URL thanh toán VNPay
exports.createVNPayPayment = async (req, res) => {
  try {
    const { orderId: orderIdFromBody, amount, orderDescription } = req.body;

    const order = await Order.findOne({
      where: { 
        id: orderIdFromBody,
        UserId: req.user.id 
      }
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrlBase = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const orderId = order.id;

    // 1. Tạo vnp_Params
    let vnp_Params = {
      'vnp_Version': '2.1.0',
      'vnp_Command': 'pay',
      'vnp_TmnCode': tmnCode,
      'vnp_Locale': 'vn',
      'vnp_CurrCode': 'VND',
      'vnp_TxnRef': orderId,
      'vnp_OrderInfo': orderDescription || `Thanh toan don hang ${orderId}`,
      'vnp_OrderType': 'other',
      'vnp_Amount': amount * 100,
      'vnp_ReturnUrl': returnUrl,
      'vnp_IpAddr': ipAddr,
      'vnp_CreateDate': createDate,
      'vnp_BankCode': 'NCB'
    };

    // 2. Sắp xếp, loại bỏ các giá trị rỗng/null/undefined và đưa vào URLSearchParams
    const params = Object.entries(vnp_Params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    const redirectUrl = new URL(vnpUrlBase);
    params.forEach(([key, value]) => {
      redirectUrl.searchParams.append(key, value.toString());
    });

    // 3. Tạo chữ ký với SHA512 từ chuỗi query chưa mã hóa (bỏ dấu `?` đầu tiên)
    const queryStr = redirectUrl.search.slice(1); // remove '?'
    const hmac = require("crypto").createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(queryStr, 'utf-8')).digest("hex");

    // 4. Thêm chữ ký vào URL
    redirectUrl.searchParams.append("vnp_SecureHash", signed);

    // 5. Cập nhật đơn hàng
    await order.update({
      paymentMethod: 'vnpay',
      paymentStatus: PAYMENT_STATUS.PENDING
    });

    // Log để kiểm tra
    console.log('VNPay Params:', vnp_Params);
    console.log('Chuỗi ký:', queryStr);
    console.log('Chữ ký backend:', signed);
    console.log('Chữ ký VNPay:', signed);

    return res.json({ 
      success: true,
      url: redirectUrl.toString()
    });
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Có lỗi xảy ra khi tạo thanh toán VNPay' 
    });
  }
};


// Xử lý callback từ VNPay
exports.vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);
    const secretKey = process.env.VNP_HASH_SECRET;
    const signData = qs.stringify(sortedParams, {
      encode: true, // Quan trọng: đặt là true để encoder được áp dụng
      encoder: function (str, defaultEncoder, charset, type) {
        if (type === 'value') {
          // Mã hóa giá trị: encodeURIComponent rồi thay thế %20 bằng +
          // Điều này mô phỏng cách application/x-www-form-urlencoded mã hóa khoảng trắng
          return encodeURIComponent(str).replace(/%20/g, '+');
        }
        // Đối với 'key', sử dụng trình mã hóa mặc định (thường là encodeURIComponent)
        return defaultEncoder(str, defaultEncoder, charset, type);
      }
    });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    console.log('VNPay Params:', vnp_Params);
    console.log('Chuỗi ký:', signData);
    console.log('Chữ ký backend:', signed);
    console.log('Chữ ký VNPay:', secureHash);

    if (secureHash === signed) {
      const orderId = vnp_Params['vnp_TxnRef'];
      const rspCode = vnp_Params['vnp_ResponseCode'];

      // Cập nhật trạng thái thanh toán
      const gatewayStatus = rspCode === "00" ? "SUCCESS" : "FAILED";
      await paymentService.handleGatewayPaymentStatus(
        orderId,
        gatewayStatus,
        {
          gatewayTransactionId: vnp_Params['vnp_TransactionNo'],
          amount: vnp_Params['vnp_Amount'] / 100,
          gatewayStatus: gatewayStatus,
          timestamp: new Date()
        }
      );

      // Chuyển hướng đến trang frontend với thông tin kết quả
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/order-confirmation/${orderId}`);
    } else {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/order-confirmation/${orderId}`);
    }
  } catch (error) {
    console.error('Error processing VNPay return:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/order-confirmation/${orderId}`);
  }
};

// Helper function to sort object keys theo alphabet, không encode
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Tạo thanh toán MoMo
exports.createMomoPayment = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    console.log('Creating MoMo payment with data:', req.body);

    const { orderId, paymentMethod } = req.body;

    // Validate order exists and belongs to user
    const order = await Order.findOne({
      where: { 
        id: orderId,
        UserId: req.user.id
      },
      transaction
    });

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
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
      return res.status(400).json({
        status: 'error',
        message: 'Đơn hàng đã được thanh toán'
      });
    }

    // MoMo payment parameters
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderId_Momo = order.id;
    const orderInfo = `Thanh toan don hang ${orderId_Momo}`;
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const amount = order.total;
    const requestType = "captureWallet";
    const extraData = "";

    // Create signature
    const rawSignature = 
      "accessKey=" + accessKey +
      "&amount=" + amount +
      "&extraData=" + extraData +
      "&ipnUrl=" + ipnUrl +
      "&orderId=" + orderId_Momo +
      "&orderInfo=" + orderInfo +
      "&partnerCode=" + partnerCode +
      "&redirectUrl=" + redirectUrl +
      "&requestId=" + requestId +
      "&requestType=" + requestType;

    const signature = createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Create request body
    const requestBody = JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: orderId_Momo,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    });

    // Create HTTPS request options
    const options = {
      hostname: 'payment.momo.vn',
      port: 443,
      path: '/v2/gateway/api/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    // Make request to MoMo
    const responseData = await new Promise((resolve, reject) => {
      const req = request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(`Error parsing JSON: ${error.message}`);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    // Create or update payment record
    const [payment, created] = await Payment.findOrCreate({
      where: {
        OrderId: orderId_Momo,
        status: 'pending'
      },
      defaults: {
        OrderId: orderId_Momo,
        paymentMethod: paymentMethod,
        amount: amount,
        status: 'pending',
        momoPaymentId: requestId
      },
      transaction
    });

    if (!created) {
      await payment.update({
        paymentMethod: paymentMethod,
        amount: amount,
        status: 'pending',
        momoPaymentId: requestId
      }, { transaction });
    }

    await transaction.commit();

    return res.json({
      status: 'success',
      message: 'Thanh toán được tạo thành công',
      paymentId: payment.id,
      approvalUrl: responseData.payUrl
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating MoMo payment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi tạo thanh toán MoMo'
    });
  }
};

// Xử lý callback thành công từ MoMo
exports.momoSuccess = async (req, res) => {
  try {
    const requestData = req.body;
    const orderId = requestData.orderId;
    
    // Cập nhật trạng thái thanh toán
    const gatewayStatus = requestData.resultCode === 0 || requestData.resultCode === "0" ? "SUCCESS" : "FAILED";
    await paymentService.handleGatewayPaymentStatus(
      orderId,
      gatewayStatus,
      {
        gatewayTransactionId: requestData.orderId,
        amount: requestData.amount
      }
    );

    res.json({ message: 'Cập nhật trạng thái thanh toán thành công.' });
  } catch (err) {
    console.error('Error processing MoMo success:', err);
    res.status(500).json({ message: 'Lỗi xử lý callback MoMo', error: err.message });
  }
};

// Xử lý hủy thanh toán MoMo
exports.momoCancel = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    if (orderId) {
      const payment = await Payment.findOne({
        where: {
          OrderId: orderId
        }
      });

      if (payment) {
        await payment.update({ status: PAYMENT_STATUS.FAILED });
      }
    }

    res.json({
      message: 'Thanh toán đã được hủy thành công'
    });
  } catch (error) {
    console.error('MoMo payment cancel error:', error);
    next(error);
  }
};