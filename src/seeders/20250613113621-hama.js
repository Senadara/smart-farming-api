"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId3 = "objk003-0000-0000-0000-000000000003";
    const jenisHamaId1 = "aaaa1111-1111-1111-1111-111111111111"; // Tungau
    const jenisHamaId2 = "bbbb2222-2222-2222-2222-222222222222"; // Kutu Daun
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";

    // Membuat laporan hama
    await queryInterface.bulkInsert(
      "laporan",
      [
        {
          id: "lapor009-0000-0000-0000-000000000009",
          userId: userId,
          unitBudidayaId: "unit003-0000-0000-0000-000000000003",
          objekBudidayaId: objekBudidayaId3,
          judul: "Laporan Serangan Hama pada Sawi",
          tipe: "hama",
          gambar: "https://example.com/images/laporan-hama-1.jpg",
          catatan: "Ditemukan serangan hama tungau dan kutu daun pada beberapa tanaman",
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
      "hama",
      [
        {
          id: "hama001-0000-0000-0000-000000000001",
          jenisHamaId: jenisHamaId1,
          laporanId: "lapor009-0000-0000-0000-000000000009",
          jumlah: 15,
          status: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "hama002-0000-0000-0000-000000000002",
          jenisHamaId: jenisHamaId2,
          laporanId: "lapor009-0000-0000-0000-000000000009",
          jumlah: 8,
          status: true,
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
    await queryInterface.bulkDelete("hama", null, {});
    await queryInterface.bulkDelete(
      "laporan",
      { tipe: "hama" },
      {}
    );
  },
};

