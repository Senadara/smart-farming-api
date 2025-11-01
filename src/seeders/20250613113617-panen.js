"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const komoditasId1 = "komo001-0000-0000-0000-000000000001";

    // Membuat laporan panen
    await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor007-0000-0000-0000-000000000007",
          userId: userId,
          unitBudidayaId: "unit001-0000-0000-0000-000000000001",
          objekBudidayaId: objekBudidayaId1,
          judul: "Laporan Panen Ayam Broiler",
          tipe: "panen",
          gambar: "https://example.com/images/laporan-panen-1.jpg",
          catatan: "Panen ayam broiler batch pertama, hasil sesuai target",
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
      "panen",
      [
        {
          id: "pane001-0000-0000-0000-000000000001",
          komoditasId: komoditasId1,
          laporanId: "lapor007-0000-0000-0000-000000000007",
          jumlah: 48,
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
    await queryInterface.bulkDelete("panen", null, {});
    await queryInterface.bulkDelete(
      "laporan",
      { tipe: "panen" },
      {}
    );
  },
};

