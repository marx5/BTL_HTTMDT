const Address = require('../models/Address');
const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const { sequelize } = require('../config/database');
const Joi = require('joi');

const addressSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  addressLine: Joi.string().min(5).max(200).required(),
  city: Joi.string().min(2).max(100).required(),
  state: Joi.string().min(2).max(100).required(),
  country: Joi.string().min(2).max(100).required(),
  isDefault: Joi.boolean().default(false),
});

exports.addAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const addressCount = await Address.count({
      where: { UserId: req.user.id },
      transaction,
    });
    if (addressCount >= 10) {
      throw new AppError('max_addresses_reached', 400);
    }

    const address = await Address.create(
      {
        UserId: req.user.id,
        ...value,
      },
      { transaction }
    );

    if (value.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { UserId: req.user.id, id: { [Op.ne]: address.id } }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      message: 'Địa chỉ đã được thêm thành công.',
      address,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await Address.findAll({
      where: { UserId: req.user.id },
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
};

exports.updateAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const address = await Address.findOne(
      { where: { id, UserId: req.user.id } },
      { transaction }
    );
    if (!address) {
      throw new AppError('address_not_found', 404);
    }

    await address.update(value, { transaction });

    if (value.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { UserId: req.user.id, id: { [Op.ne]: address.id } }, transaction }
      );
    }

    await transaction.commit();

    res.json({
      message: 'Địa chỉ đã được cập nhật thành công.',
      address,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const address = await Address.findOne(
      { where: { id, UserId: req.user.id } },
      { transaction }
    );
    if (!address) {
      throw new AppError('address_not_found', 404);
    }
    await address.destroy({ transaction });
    await transaction.commit();
    res.json({ message: 'Địa chỉ đã được xóa thành công.' });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.setDefaultAddress = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const address = await Address.findOne(
      { where: { id, UserId: req.user.id } },
      { transaction }
    );
    if (!address) {
      throw new AppError('address_not_found', 404);
    }

    await Address.update(
      { isDefault: false },
      { where: { UserId: req.user.id }, transaction }
    );
    await address.update({ isDefault: true }, { transaction });

    await transaction.commit();

    res.json({
      message: 'Địa chỉ đã được đặt làm mặc định thành công.',
      address,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};