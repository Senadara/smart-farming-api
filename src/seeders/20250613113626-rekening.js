"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId1 = "f6f87523-3a83-4917-9f71-b773ac9acc3a"; // Rooftop Farming Center
    const userId2 = "37d2ea06-ff8e-4c20-80e3-5c35510d37c4"; // Toko Buah Segar Akay

    await queryInterface.bulkInsert(
      "rekening",
      [
        {
          id: "rekn001-0000-0000-0000-000000000001",
          userId: userId1,
          nomorRekening: "1234567890",
          namaBank: "Bank BCA",
          namaPenerima: "Rooftop Farming Center",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "rekn002-0000-0000-0000-000000000002",
          userId: userId1,
          nomorRekening: "0987654321",
          namaBank: "Bank Mandiri",
          namaPenerima: "Rooftop Farming Center",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "rekn003-0000-0000-0000-000000000003",
          userId: userId2,
          nomorRekening: "5555666677",
          namaBank: "Bank BNI",
          namaPenerima: "Toko Buah Segar Akay",
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
    await queryInterface.bulkDelete("rekening", null, {});
  },
};

