"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const inventarisId1 = "inv001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";

    const laporanData = [];
    const vitaminData = [];
    const now = new Date();

    // 2 vitamin applications
    const vitaminDays = [10, 3];

    for (let index = 0; index < vitaminDays.length; index++) {
      const i = vitaminDays[index];
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayString = String(15 - i + 1).padStart(2, '0');
      const laporanId = `lapvita0-0000-0000-0000-0000000000${dayString}`;

      laporanData.push({
          id: laporanId,
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: `Laporan Pemberian Vitamin - Hari ${15 - i + 1}`,
          tipe: "vitamin",
          gambar: "https://example.com/images/laporan-vitamin-1.jpg",
          catatan: "Vitamin AD3E diberikan kepada semua ayam",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
      });

      vitaminData.push({
        id: `vitahist-0000-0000-0000-0000000000${dayString}`,
        inventarisId: inventarisId1,
        laporanId: laporanId,
        tipe: "vitamin",
        jumlah: 50,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("laporan", laporanData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("vitamin", vitaminData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("vitamin", null, {});
    await queryInterface.bulkDelete("laporan", { tipe: "vitamin" }, {});
  },
};
