"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const objekBudidayaId2 = "objk002-0000-0000-0000-000000000002";
    const laporanId1 = "lapor001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "harianTernak",
      [
        {
          id: "hter001-0000-0000-0000-000000000001",
          laporanId: laporanId1,
          pakan: true,
          cekKandang: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "hter002-0000-0000-0000-000000000002",
          laporanId: laporanId1,
          pakan: true,
          cekKandang: false,
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
    await queryInterface.bulkDelete("harianTernak", null, {});
  },
};

