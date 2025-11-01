"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const panenId = "pane001-0000-0000-0000-000000000001";
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "detailPanen",
      [
        {
          id: "dtpn001-0000-0000-0000-000000000001",
          panenId: panenId,
          objekBudidayaId: objekBudidayaId1,
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
    await queryInterface.bulkDelete("detailPanen", null, {});
  },
};

