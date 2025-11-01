"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const komoditasId2 = "komo002-0000-0000-0000-000000000002";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";

    // Membuat laporan panen kebun
    await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor008-0000-0000-0000-000000000008",
          userId: userId,
          unitBudidayaId: "unit003-0000-0000-0000-000000000003",
          objekBudidayaId: "objk003-0000-0000-0000-000000000003",
          judul: "Laporan Panen Sawi Hidroponik",
          tipe: "panen",
          gambar: "https://example.com/images/laporan-panen-sawi.jpg",
          catatan: "Panen sawi batch pertama, hasil memuaskan",
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
      "panenKebun",
      [
        {
          id: "pnkb001-0000-0000-0000-000000000001",
          komoditasId: komoditasId2,
          laporanId: "lapor008-0000-0000-0000-000000000008",
          tanggalPanen: new Date(),
          estimasiPanen: 200,
          realisasiPanen: 185,
          gagalPanen: 15,
          umurTanamanPanen: 45,
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
    await queryInterface.bulkDelete("panenKebun", null, {});
    await queryInterface.bulkDelete(
      "laporan",
      { id: "lapor008-0000-0000-0000-000000000008" },
      {}
    );
  },
};

