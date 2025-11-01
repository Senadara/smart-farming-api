"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "jenisHama",
      [
        {
          id: "aaaa1111-1111-1111-1111-111111111111",
          nama: "Tungau",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "bbbb2222-2222-2222-2222-222222222222",
          nama: "Kutu Daun",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "cccc3333-3333-3333-3333-333333333333",
          nama: "Ulat",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "dddd4444-4444-4444-4444-444444444444",
          nama: "Thrips",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "eeee5555-5555-5555-5555-555555555555",
          nama: "Jamur",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ffff6666-6666-6666-6666-666666666666",
          nama: "Bakteri",
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
    await queryInterface.bulkDelete("jenisHama", null, {});
  },
};

