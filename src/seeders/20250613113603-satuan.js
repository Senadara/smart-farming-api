"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "satuan",
      [
        {
          id: "11111111-1111-1111-1111-111111111111",
          nama: "Kilogram",
          lambang: "kg",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          nama: "Gram",
          lambang: "g",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "33333333-3333-3333-3333-333333333333",
          nama: "Liter",
          lambang: "L",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "44444444-4444-4444-4444-444444444444",
          nama: "Mililiter",
          lambang: "ml",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "55555555-5555-5555-5555-555555555555",
          nama: "Ekor",
          lambang: "ekor",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "66666666-6666-6666-6666-666666666666",
          nama: "Buah",
          lambang: "buah",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "77777777-7777-7777-7777-777777777777",
          nama: "Batang",
          lambang: "batang",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "88888888-8888-8888-8888-888888888888",
          nama: "Paket",
          lambang: "paket",
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
    await queryInterface.bulkDelete("satuan", null, {});
  },
};

