"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0"; // user
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";
    const unitBudidayaId2 = "unit003-0000-0000-0000-000000000003";
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const objekBudidayaId2 = "objk003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor001-0000-0000-0000-000000000001",
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: "Laporan Harian Kandang Ayam A",
          tipe: "harian",
          gambar: "https://example.com/images/laporan-harian-1.jpg",
          catatan: "Kondisi ayam sehat, pakan diberikan sesuai jadwal",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "lapor002-0000-0000-0000-000000000002",
          userId: userId,
          unitBudidayaId: unitBudidayaId2,
          objekBudidayaId: objekBudidayaId2,
          judul: "Laporan Harian Bedeng Sawi A",
          tipe: "harian",
          gambar: "https://example.com/images/laporan-harian-2.jpg",
          catatan: "Penyiraman dilakukan pagi dan sore, tanaman tumbuh dengan baik",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "lapor003-0000-0000-0000-000000000003",
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: "Laporan Pemberian Vitamin",
          tipe: "vitamin",
          gambar: "https://example.com/images/laporan-vitamin-1.jpg",
          catatan: "Vitamin AD3E diberikan kepada semua ayam",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "lapor004-0000-0000-0000-000000000004",
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: "Penggunaan Inventaris Disinfektan",
          tipe: "inventaris",
          gambar: "https://example.com/images/laporan-inventaris-1.jpg",
          catatan: "Disinfektan digunakan untuk sanitasi kandang",
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
    await queryInterface.bulkDelete("laporan", null, {});
  },
};

