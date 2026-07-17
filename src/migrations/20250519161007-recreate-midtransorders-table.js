'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('midtransOrders');

    await queryInterface.createTable('midtransorders', {
      id: {
        type: Sequelize.STRING, // order_id dari Midtrans
        allowNull: false,
        primaryKey: true
      },
      transaction_id: Sequelize.STRING,
      transaction_status: Sequelize.STRING,
      payment_type: Sequelize.STRING,
      bank: Sequelize.STRING,
      va_number: Sequelize.STRING,
      gross_amount: Sequelize.STRING,
      transaction_time: Sequelize.DATE,
      expiry_time: Sequelize.DATE,
      fraud_status: Sequelize.STRING,
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('midtransorders');
  }
};
