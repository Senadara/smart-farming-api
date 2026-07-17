"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // panenRincianGrade for panen (ternak) is now handled inside 20250613113617-panen.js
    // This seeder only handles panenRincianGrade for panenKebun
    const komoditasId2 = "komo002-0000-0000-0000-000000000002";
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const gradeId1 = "grade001-0000-0000-0000-000000000001";
    const gradeId2 = "grade002-0000-0000-0000-000000000002";
    const gradeId3 = "grade003-0000-0000-0000-000000000003";

    const now = new Date();
    const laporanData = [];
    const panenKebunData = [];
    const panenRincianGradeData = [];

    // Panen kebun at day 5 and day 12 ago
    const panenKebunDays = [12, 5];

    for (let index = 0; index < panenKebunDays.length; index++) {
      const i = panenKebunDays[index];
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayString = String(15 - i + 1).padStart(2, '0');
      const laporanId = `lappnkb0-0000-0000-0000-0000000000${dayString}`;
      const panenKebunId = `pnkbhist-0000-0000-0000-0000000000${dayString}`;

      laporanData.push({
        id: laporanId,
        userId: userId,
        unitBudidayaId: "unit003-0000-0000-0000-000000000003",
        objekBudidayaId: "objk003-0000-0000-0000-000000000003",
        judul: `Laporan Panen Sawi Hidroponik - Hari ${15 - i + 1}`,
        tipe: "panen",
        gambar: "https://example.com/images/laporan-panen-sawi.jpg",
        catatan: "Panen sawi, hasil memuaskan",
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      const estimasi = index === 0 ? 200 : 180;
      const realisasi = index === 0 ? 185 : 170;

      panenKebunData.push({
        id: panenKebunId,
        komoditasId: komoditasId2,
        laporanId: laporanId,
        tanggalPanen: date,
        estimasiPanen: estimasi,
        realisasiPanen: realisasi,
        gagalPanen: estimasi - realisasi,
        umurTanamanPanen: index === 0 ? 35 : 45,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      const gA = Math.round(realisasi * 0.60);
      const gB = Math.round(realisasi * 0.28);
      const gC = realisasi - gA - gB;

      panenRincianGradeData.push(
        {
          id: `pnrgkb00-0000-0000-0000-a00000000${dayString}`,
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId1,
          jumlah: gA,
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        },
        {
          id: `pnrgkb00-0000-0000-0000-b00000000${dayString}`,
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId2,
          jumlah: gB,
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        },
        {
          id: `pnrgkb00-0000-0000-0000-c00000000${dayString}`,
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId3,
          jumlah: gC,
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
        }
      );
    }

    await queryInterface.bulkInsert("laporan", laporanData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("panenKebun", panenKebunData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("panenRincianGrade", panenRincianGradeData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("panenRincianGrade", null, {});
    await queryInterface.bulkDelete("panenKebun", null, {});
  },
};
