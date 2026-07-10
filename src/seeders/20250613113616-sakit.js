"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";

    const laporanData = [];
    const sakitData = [];
    const now = new Date();

    const sickDays = [11, 4];

    for (let index = 0; index < sickDays.length; index++) {
      const i = sickDays[index];
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayString = String(15 - i + 1).padStart(2, '0');
      const laporanId = `lapsaki0-0000-0000-0000-0000000000${dayString}`;

      laporanData.push({
          id: laporanId,
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: `Laporan Penyakit Ayam - Hari ${15 - i + 1}`,
          tipe: "sakit",
          gambar: "https://example.com/images/laporan-sakit-1.jpg",
          catatan: "Beberapa ayam menunjukkan gejala batuk dan bersin",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
      });

      sakitData.push({
          id: `sakihist-0000-0000-0000-0000000000${dayString}`,
          laporanId: laporanId,
          diagnosisPenyakit: null,
          status: i === 11 ? "Sudah ditangani" : "Belum ditangani",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("laporan", laporanData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("sakit", sakitData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("sakit", null, {});
    await queryInterface.bulkDelete("laporan", { tipe: "sakit" }, {});
  },
};
