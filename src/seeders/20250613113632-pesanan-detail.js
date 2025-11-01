"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const pesananId1 = "pesa001-0000-0000-0000-000000000001";
    const pesananId2 = "pesa002-0000-0000-0000-000000000002";
    const produkId1 = "prod001-0000-0000-0000-000000000001";
    const produkId2 = "prod002-0000-0000-0000-000000000002";
    const produkId3 = "prod003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "pesananDetail",
      [
        {
          id: "psdt001-0000-0000-0000-000000000001",
          pesananId: pesananId1,
          produkId: produkId1,
          jumlah: 2,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "psdt002-0000-0000-0000-000000000002",
          pesananId: pesananId1,
          produkId: produkId3,
          jumlah: 10,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "psdt003-0000-0000-0000-000000000003",
          pesananId: pesananId2,
          produkId: produkId2,
          jumlah: 5,
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
    await queryInterface.bulkDelete("pesananDetail", null, {});
  },
};

