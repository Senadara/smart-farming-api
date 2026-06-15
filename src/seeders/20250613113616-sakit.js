"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const penyakitAyamId = "pnyk001-0000-0000-0000-000000000001"; // UUID untuk penyakit_ayam

    // 1. Buat master data penyakit_ayam terlebih dahulu
    await queryInterface.bulkInsert(
      "penyakit_ayam",
      [
        {
          id: penyakitAyamId,
          nama_penyakit: "Infeksi saluran pernapasan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        ignoreDuplicates: true,
      }
    );

    // 2. Membuat laporan sakit
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
      }
    );

    // 3. Masukkan data ke tabel sakit dengan field 'diagnosisPenyakit'
    await queryInterface.bulkInsert(
      "sakit",
      [
        {
          id: "saki001-0000-0000-0000-000000000001",
          laporanId: "lapor006-0000-0000-0000-000000000006",
<<<<<<< HEAD
          diagnosisPenyakit: penyakitAyamId,
=======
          diagnosisPenyakit: null,
          status: "Belum ditangani",
>>>>>>> e120d8830553228e491295326ba963e927eb933b
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        ignoreDuplicates: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("sakit", null, {});
    await queryInterface.bulkDelete("penyakit_ayam", { id: "pnyk001-0000-0000-0000-000000000001" }, {});
    await queryInterface.bulkDelete(
      "laporan",
      { tipe: "sakit" },
      {}
    );
  },
};