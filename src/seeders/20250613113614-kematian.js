"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";

    // Membuat laporan kematian
    const laporanKematian = await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor005-0000-0000-0000-000000000005",
          userId: userId,
          unitBudidayaId: "unit001-0000-0000-0000-000000000001",
          objekBudidayaId: objekBudidayaId1,
          judul: "Laporan Kematian Ayam",
          tipe: "kematian",
          gambar: "https://example.com/images/laporan-kematian-1.jpg",
          catatan: "Satu ekor ayam mati karena stress panas",
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

    await queryInterface.bulkInsert(
      "kematian",
      [
        {
          id: "kema001-0000-0000-0000-000000000001",
          laporanId: "lapor005-0000-0000-0000-000000000005",
          tanggal: new Date(),
          penyebab: "Stress panas",
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
    await queryInterface.bulkDelete("kematian", null, {});
    await queryInterface.bulkDelete(
      "laporan",
      { tipe: "kematian" },
      {}
    );
  },
};

