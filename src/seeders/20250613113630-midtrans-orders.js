"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "midtransorders",
      [
        {
          id: "ORDER-001",
          transaction_id: "TRX-001",
          transaction_status: "settlement",
          payment_type: "bank_transfer",
          bank: "bca",
          va_number: "1234567890",
          gross_amount: "170000",
          transaction_time: new Date(),
          expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
          fraud_status: "accept",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ORDER-002",
          transaction_id: "TRX-002",
          transaction_status: "pending",
          payment_type: "bank_transfer",
          bank: "mandiri",
          va_number: "0987654321",
          gross_amount: "50000",
          transaction_time: new Date(),
          expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000),
          fraud_status: "accept",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        ignoreDuplicates: false,
        returning: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("midtransorders", null, {});
  },
};

