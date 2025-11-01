"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "grade",
      [
        {
          id: "grade001-0000-0000-0000-000000000001",
          nama: "Grade A",
          deskripsi: "Kualitas terbaik, tanpa cacat",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "grade002-0000-0000-0000-000000000002",
          nama: "Grade B",
          deskripsi: "Kualitas baik dengan sedikit cacat",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "grade003-0000-0000-0000-000000000003",
          nama: "Grade C",
          deskripsi: "Kualitas sedang dengan beberapa cacat",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "grade004-0000-0000-0000-000000000004",
          nama: "Rusak",
          deskripsi: "Produk rusak atau tidak layak jual",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "grade005-0000-0000-0000-000000000005",
          nama: "Super",
          deskripsi: "Kualitas premium, ukuran besar",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "grade006-0000-0000-0000-000000000006",
          nama: "Premium",
          deskripsi: "Kualitas tinggi, ukuran sedang-besar",
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
    await queryInterface.bulkDelete("grade", null, {});
  },
};

