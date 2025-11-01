"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const inventarisId1 = "inv001-0000-0000-0000-000000000001"; // Vitamin AD3E
    const inventarisId2 = "inv004-0000-0000-0000-000000000004"; // Disinfektan
    const laporanId3 = "lapor003-0000-0000-0000-000000000003";
    const laporanId4 = "lapor004-0000-0000-0000-000000000004";

    await queryInterface.bulkInsert(
      "penggunaanInventaris",
      [
        {
          id: "pginv001-0000-0000-0000-000000000001",
          inventarisId: inventarisId1,
          laporanId: laporanId3,
          jumlah: 50,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pginv002-0000-0000-0000-000000000002",
          inventarisId: inventarisId2,
          laporanId: laporanId4,
          jumlah: 2.5,
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
    await queryInterface.bulkDelete("penggunaanInventaris", null, {});
  },
};

