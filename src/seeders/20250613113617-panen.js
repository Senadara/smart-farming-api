"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const komoditasId1 = "komo001-0000-0000-0000-000000000001";
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";
    const objekBudidayaId2 = "objk002-0000-0000-0000-000000000002";

    const panenData = [];
    const detailPanenData = [];
    const panenRincianGradeData = [];
    const now = new Date();

    const gradeId1 = "grade001-0000-0000-0000-000000000001"; // Grade A
    const gradeId2 = "grade002-0000-0000-0000-000000000002"; // Grade B
    const gradeId3 = "grade003-0000-0000-0000-000000000003"; // Grade C

    // Generate 15 days of daily egg production for Kandang A + Kandang B
    for (let i = 15; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayIndex = 15 - i + 1;
      const dayString = String(dayIndex).padStart(2, '0');

      // --- Kandang A ---
      const panenIdA = `panehist-0000-0000-0000-0000000000${dayString}`;
      const laporanIdA = `lappane0-0000-0000-0000-0000000000${dayString}`;

      // Simulate realistic HDP: 50 ayam, ~85-95% production = 42-48 telur/hari
      // Gradually ramp up then stabilize
      const baseEggsA = dayIndex <= 5 ? 38 + dayIndex : (dayIndex <= 10 ? 44 + Math.floor(dayIndex * 0.3) : 46 + (dayIndex % 3));
      const eggWeightA = baseEggsA * 0.063; // avg 63g per egg = 0.063 kg

      panenData.push({
        id: panenIdA,
        komoditasId: komoditasId1,
        laporanId: laporanIdA,
        jumlah: baseEggsA,
        berat: parseFloat(eggWeightA.toFixed(2)),
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      detailPanenData.push({
        id: `dtpnhist-0000-0000-0000-0000000000${dayString}`,
        panenId: panenIdA,
        objekBudidayaId: objekBudidayaId1,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      // Grade distribution for Kandang A  
      const gradeA = Math.round(baseEggsA * 0.65);
      const gradeB = Math.round(baseEggsA * 0.25);
      const gradeC = baseEggsA - gradeA - gradeB;

      panenRincianGradeData.push({
        id: `pnrgha00-0000-0000-0000-a00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdA,
        gradeId: gradeId1,
        jumlah: gradeA,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
      panenRincianGradeData.push({
        id: `pnrgha00-0000-0000-0000-b00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdA,
        gradeId: gradeId2,
        jumlah: gradeB,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
      panenRincianGradeData.push({
        id: `pnrgha00-0000-0000-0000-c00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdA,
        gradeId: gradeId3,
        jumlah: gradeC,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      // --- Kandang B ---
      const panenIdB = `panehi0b-0000-0000-0000-0000000000${dayString}`;
      const laporanIdB = `lappanb0-0000-0000-0000-0000000000${dayString}`;

      const baseEggsB = dayIndex <= 5 ? 55 + dayIndex : (dayIndex <= 10 ? 62 + Math.floor(dayIndex * 0.4) : 66 + (dayIndex % 4));
      const eggWeightB = baseEggsB * 0.063;

      panenData.push({
        id: panenIdB,
        komoditasId: komoditasId1,
        laporanId: laporanIdB,
        jumlah: baseEggsB,
        berat: parseFloat(eggWeightB.toFixed(2)),
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      detailPanenData.push({
        id: `dtpnhi0b-0000-0000-0000-0000000000${dayString}`,
        panenId: panenIdB,
        objekBudidayaId: objekBudidayaId2,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      // Grade distribution for Kandang B
      const gradeBa = Math.round(baseEggsB * 0.60);
      const gradeBb = Math.round(baseEggsB * 0.28);
      const gradeBc = baseEggsB - gradeBa - gradeBb;

      panenRincianGradeData.push({
        id: `pnrghb00-0000-0000-0000-a00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdB,
        gradeId: gradeId1,
        jumlah: gradeBa,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
      panenRincianGradeData.push({
        id: `pnrghb00-0000-0000-0000-b00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdB,
        gradeId: gradeId2,
        jumlah: gradeBb,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
      panenRincianGradeData.push({
        id: `pnrghb00-0000-0000-0000-c00000000${dayString}`,
        panenKebunId: null,
        panenId: panenIdB,
        gradeId: gradeId3,
        jumlah: gradeBc,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("panen", panenData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("detailPanen", detailPanenData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("panenRincianGrade", panenRincianGradeData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("panenRincianGrade", { panenKebunId: null }, {});
    await queryInterface.bulkDelete("detailPanen", null, {});
    await queryInterface.bulkDelete("panen", null, {});
  },
};
