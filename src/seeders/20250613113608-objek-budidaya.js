"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";
    const unitBudidayaId2 = "unit003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "objekBudidaya",
      [
        {
          id: "objk001-0000-0000-0000-000000000001",
          unitBudidayaId: unitBudidayaId1,
          namaId: "AYAM-001",
          status: true,
          deskripsi: "Ayam broiler berumur 25 hari",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "objk002-0000-0000-0000-000000000002",
          unitBudidayaId: unitBudidayaId1,
          namaId: "AYAM-002",
          status: true,
          deskripsi: "Ayam broiler berumur 30 hari",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "objk003-0000-0000-0000-000000000003",
          unitBudidayaId: unitBudidayaId2,
          namaId: "SAWI-001",
          status: true,
          deskripsi: "Tanaman sawi berumur 20 hari",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "objk004-0000-0000-0000-000000000004",
          unitBudidayaId: unitBudidayaId2,
          namaId: "SAWI-002",
          status: true,
          deskripsi: "Tanaman sawi berumur 15 hari",
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
    await queryInterface.bulkDelete("objekBudidaya", null, {});
  },
};

