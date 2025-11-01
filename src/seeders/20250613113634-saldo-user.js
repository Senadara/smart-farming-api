"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId1 = "f6f87523-3a83-4917-9f71-b773ac9acc3a"; // Rooftop Farming Center
    const userId2 = "37d2ea06-ff8e-4c20-80e3-5c35510d37c4"; // Toko Buah Segar Akay

    await queryInterface.bulkInsert(
      "saldo_user",
      [
        {
          id: "sldo001-0000-0000-0000-000000000001",
          userId: userId1,
          saldoTersedia: 500000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "sldo002-0000-0000-0000-000000000002",
          userId: userId2,
          saldoTersedia: 250000,
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
    await queryInterface.bulkDelete("saldo_user", null, {});
  },
};

