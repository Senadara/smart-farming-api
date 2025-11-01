"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId3 = "objk003-0000-0000-0000-000000000003";
    const objekBudidayaId4 = "objk004-0000-0000-0000-000000000004";
    const laporanId2 = "lapor002-0000-0000-0000-000000000002";

    await queryInterface.bulkInsert(
      "harianKebun",
      [
        {
          id: "hkeb001-0000-0000-0000-000000000001",
          laporanId: laporanId2,
          penyiraman: true,
          pruning: false,
          repotting: false,
          tinggiTanaman: 15.5,
          kondisiDaun: "sehat",
          statusTumbuh: "vegetatifAwal",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "hkeb002-0000-0000-0000-000000000002",
          laporanId: laporanId2,
          penyiraman: true,
          pruning: false,
          repotting: false,
          tinggiTanaman: 12.0,
          kondisiDaun: "sehat",
          statusTumbuh: "perkecambahan",
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
    await queryInterface.bulkDelete("harianKebun", null, {});
  },
};

