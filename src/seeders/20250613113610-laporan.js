"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0"; // user
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001"; // Kandang Ayam A
    const unitBudidayaId2 = "unit002-0000-0000-0000-000000000002"; // Kandang Ayam B
    const unitBudidayaId3 = "unit003-0000-0000-0000-000000000003"; // Bedeng Sawi A
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const objekBudidayaId2 = "objk002-0000-0000-0000-000000000002";
    const objekBudidayaId3 = "objk003-0000-0000-0000-000000000003";

    const laporanData = [];
    const now = new Date();

    // Generate 15 days of historical base reports (day 01 = oldest, day 16 = today)
    for (let i = 15; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayString = String(15 - i + 1).padStart(2, '0');

        // Harian Ternak - Kandang A (every day)
        laporanData.push({
          id: `laphter0-0000-0000-0000-0000000000${dayString}`,
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: `Laporan Harian Kandang Ayam A - Hari ${15 - i + 1}`,
          tipe: "harian",
          gambar: "https://example.com/images/laporan-harian-1.jpg",
          catatan: "Kondisi ayam sehat, pakan diberikan sesuai jadwal",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        });

        // Harian Ternak - Kandang B (every day)
        laporanData.push({
          id: `laphtb00-0000-0000-0000-0000000000${dayString}`,
          userId: userId,
          unitBudidayaId: unitBudidayaId2,
          objekBudidayaId: objekBudidayaId2,
          judul: `Laporan Harian Kandang Ayam B - Hari ${15 - i + 1}`,
          tipe: "harian",
          gambar: "https://example.com/images/laporan-harian-1b.jpg",
          catatan: "Kandang B diperiksa, kondisi baik",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        });

        // Harian Kebun - Bedeng Sawi A (every day)
        laporanData.push({
          id: `laphkeb0-0000-0000-0000-0000000000${dayString}`,
          userId: userId,
          unitBudidayaId: unitBudidayaId3,
          objekBudidayaId: objekBudidayaId3,
          judul: `Laporan Harian Bedeng Sawi A - Hari ${15 - i + 1}`,
          tipe: "harian",
          gambar: "https://example.com/images/laporan-harian-2.jpg",
          catatan: "Penyiraman dilakukan pagi dan sore, tanaman tumbuh dengan baik",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        });

        // Panen Ternak - Kandang A (every day, to support HDP daily)
        laporanData.push({
          id: `lappane0-0000-0000-0000-0000000000${dayString}`,
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: `Laporan Panen Telur Kandang A - Hari ${15 - i + 1}`,
          tipe: "panen",
          gambar: "https://example.com/images/laporan-panen-1.jpg",
          catatan: "Panen telur harian sesuai jadwal",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        });

        // Panen Ternak - Kandang B (every day, to support HDP daily)
        laporanData.push({
          id: `lappanb0-0000-0000-0000-0000000000${dayString}`,
          userId: userId,
          unitBudidayaId: unitBudidayaId2,
          objekBudidayaId: objekBudidayaId2,
          judul: `Laporan Panen Telur Kandang B - Hari ${15 - i + 1}`,
          tipe: "panen",
          gambar: "https://example.com/images/laporan-panen-1b.jpg",
          catatan: "Panen telur harian kandang B",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        });
    }

    await queryInterface.bulkInsert("laporan", laporanData, {
      ignoreDuplicates: false,
      returning: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("laporan", null, {});
  },
};
