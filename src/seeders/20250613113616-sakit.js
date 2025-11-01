"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";

    // Membuat laporan sakit
    await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor006-0000-0000-0000-000000000006",
          userId: userId,
          unitBudidayaId: "unit001-0000-0000-0000-000000000001",
          objekBudidayaId: objekBudidayaId1,
          judul: "Laporan Penyakit Ayam",
          tipe: "sakit",
          gambar: "https://example.com/images/laporan-sakit-1.jpg",
          catatan: "Beberapa ayam menunjukkan gejala batuk dan bersin",
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
      "sakit",
      [
        {
          id: "saki001-0000-0000-0000-000000000001",
          laporanId: "lapor006-0000-0000-0000-000000000006",
          penyakit: "Infeksi saluran pernapasan",
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
    await queryInterface.bulkDelete("sakit", null, {});
    await queryInterface.bulkDelete(
      "laporan",
      { tipe: "sakit" },
      {}
    );
  },
};

