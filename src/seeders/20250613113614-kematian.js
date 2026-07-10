"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";

    const laporanData = [];
    const kematianData = [];
    const now = new Date();

    // Spread deaths across multiple days for both kandang
    // Kandang A: deaths at days 14, 10, 7, 3 ago
    // Kandang B: deaths at days 12, 5 ago
    const deaths = [
      { daysAgo: 14, unitId: "unit001-0000-0000-0000-000000000001", objekId: "objk001-0000-0000-0000-000000000001", penyebab: "Stress panas", prefix: "ka" },
      { daysAgo: 10, unitId: "unit001-0000-0000-0000-000000000001", objekId: "objk001-0000-0000-0000-000000000001", penyebab: "Penyakit CRD", prefix: "kb" },
      { daysAgo: 7,  unitId: "unit001-0000-0000-0000-000000000001", objekId: "objk001-0000-0000-0000-000000000001", penyebab: "Tidak diketahui", prefix: "kc" },
      { daysAgo: 3,  unitId: "unit001-0000-0000-0000-000000000001", objekId: "objk001-0000-0000-0000-000000000001", penyebab: "Penyakit", prefix: "kd" },
      { daysAgo: 12, unitId: "unit002-0000-0000-0000-000000000002", objekId: "objk002-0000-0000-0000-000000000002", penyebab: "Stress", prefix: "ke" },
      { daysAgo: 5,  unitId: "unit002-0000-0000-0000-000000000002", objekId: "objk002-0000-0000-0000-000000000002", penyebab: "Dehidrasi", prefix: "kf" },
    ];

    for (let idx = 0; idx < deaths.length; idx++) {
      const d = deaths[idx];
      const date = new Date(now);
      date.setDate(date.getDate() - d.daysAgo);
      const dayString = String(15 - d.daysAgo + 1).padStart(2, '0');
      const laporanId = `lapkema${d.prefix}-0000-0000-0000-000000${dayString}`;

      laporanData.push({
        id: laporanId,
        userId: userId,
        unitBudidayaId: d.unitId,
        objekBudidayaId: d.objekId,
        judul: `Laporan Kematian Ayam - ${d.penyebab}`,
        tipe: "kematian",
        gambar: "https://example.com/images/laporan-kematian-1.jpg",
        catatan: `Satu ekor ayam mati karena ${d.penyebab}`,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      kematianData.push({
        id: `kemahis${d.prefix}-0000-0000-0000-000000${dayString}`,
        laporanId: laporanId,
        tanggal: date,
        penyebab: d.penyebab,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("laporan", laporanData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("kematian", kematianData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("kematian", null, {});
    await queryInterface.bulkDelete("laporan", { tipe: "kematian" }, {});
  },
};
