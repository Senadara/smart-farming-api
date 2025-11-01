"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "buktiDiterima",
      [
        {
          id: "bkti001-0000-0000-0000-000000000001",
          fotoBukti: "https://example.com/images/bukti-diterima-1.jpg",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "bkti002-0000-0000-0000-000000000002",
          fotoBukti: "https://example.com/images/bukti-diterima-2.jpg",
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
    await queryInterface.bulkDelete("buktiDiterima", null, {});
  },
};

