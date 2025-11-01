"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const inventarisId1 = "inv001-0000-0000-0000-000000000001";
    const laporanId3 = "lapor003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "vitamin",
      [
        {
          id: "vita001-0000-0000-0000-000000000001",
          inventarisId: inventarisId1,
          laporanId: laporanId3,
          tipe: "vitamin",
          jumlah: 50,
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
    await queryInterface.bulkDelete("vitamin", null, {});
  },
};

