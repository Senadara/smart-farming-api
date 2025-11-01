"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const pesananId1 = "pesa001-0000-0000-0000-000000000001";
    const tokoId1 = "toko001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "pendapatan",
      [
        {
          id: "pend001-0000-0000-0000-000000000001",
          pesananId: pesananId1,
          tokoId: tokoId1,
          harga: 170000,
          isDeleted: false,
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
    await queryInterface.bulkDelete("pendapatan", null, {});
  },
};

