"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0"; // user
    const tokoId1 = "toko001-0000-0000-0000-000000000001";
    const tokoId2 = "toko002-0000-0000-0000-000000000002";
    const midtransOrderId1 = "ORDER-001";
    const midtransOrderId2 = "ORDER-002";
    const buktiDiterimaId1 = "bkti001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "pesanan",
      [
        {
          id: "pesa001-0000-0000-0000-000000000001",
          userId: userId,
          tokoId: tokoId1,
          MidtransOrderId: midtransOrderId1,
          buktiDiterimaId: buktiDiterimaId1,
          status: "selesai",
          totalHarga: 170000,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pesa002-0000-0000-0000-000000000002",
          userId: userId,
          tokoId: tokoId2,
          MidtransOrderId: midtransOrderId2,
          buktiDiterimaId: null,
          status: "menunggu",
          totalHarga: 50000,
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
    await queryInterface.bulkDelete("pesanan", null, {});
  },
};

