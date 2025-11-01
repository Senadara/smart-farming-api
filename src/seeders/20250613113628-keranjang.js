"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0"; // user
    const produkId1 = "prod001-0000-0000-0000-000000000001";
    const produkId2 = "prod002-0000-0000-0000-000000000002";
    const produkId3 = "prod003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "keranjang",
      [
        {
          id: "krjg001-0000-0000-0000-000000000001",
          userId: userId,
          produkId: produkId1,
          jumlah: 2,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "krjg002-0000-0000-0000-000000000002",
          userId: userId,
          produkId: produkId2,
          jumlah: 5,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "krjg003-0000-0000-0000-000000000003",
          userId: userId,
          produkId: produkId3,
          jumlah: 10,
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
    await queryInterface.bulkDelete("keranjang", null, {});
  },
};

