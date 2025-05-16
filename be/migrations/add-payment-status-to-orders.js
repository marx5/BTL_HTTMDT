'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'paymentStatus', {
      type: Sequelize.ENUM('PENDING', 'PAID', 'FAILED'),
      defaultValue: 'PENDING',
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'transactionDetails', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'transactionDetails');
    await queryInterface.removeColumn('Orders', 'paymentStatus');
    
    // Loại bỏ ENUM type sau khi đã xóa column
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Orders_paymentStatus";');
  }
}; 