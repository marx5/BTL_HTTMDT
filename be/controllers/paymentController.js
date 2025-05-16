const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const { sendOrderConfirmationEmail } = require('../utils/email');
const Joi = require('joi');
const dotenv = require('dotenv');
const paymentService = require('../services/paymentService');
const { PAYMENT_STATUS } = require('../constants/paymentStatus');

dotenv.config();

const createPaymentSchema = Joi.object({
  orderId: Joi.number().integer().required().messages({
    'number.base': 'orderId phải là số',
    'number.integer': 'orderId phải là số nguyên',
    'any.required': 'orderId là bắt buộc'
  }),
  paymentMethod: Joi.string().valid('cod').required().messages({
    'string.base': 'Phương thức thanh toán không hợp lệ',
    'any.only': 'Chỉ hỗ trợ thanh toán qua COD',
    'any.required': 'Phương thức thanh toán là bắt buộc'
  })
});

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

    // Cập nhật trạng thái thanh toán
    order.paymentStatus = status;
    if (status === 'PAID') {
      order.status = 'PROCESSING'; // Cập nhật cả trạng thái đơn hàng chính
    } else if (status === 'FAILED' && order.status !== 'CANCELLED') {
      // Cân nhắc có nên đổi order.status thành FAILED hay không, tùy logic nghiệp vụ
      // Hiện tại chỉ cập nhật paymentStatus
    }

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
          status: status === 'PAID' ? 'completed' : status === 'FAILED' ? 'failed' : 'pending'
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