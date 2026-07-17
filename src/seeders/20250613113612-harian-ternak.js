"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const harianTernakData = [];
    const now = new Date();

    // Generate 16 entries (day 0 to day 15) for Kandang A AND Kandang B
    for (let i = 15; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayString = String(15 - i + 1).padStart(2, '0');

      // Kandang A: 50 ekor x sekitar 110g/ekor/hari = 5.5kg.
      harianTernakData.push({
        id: `hterhist-0000-0000-0000-0000000000${dayString}`,
        laporanId: `laphter0-0000-0000-0000-0000000000${dayString}`,
        pakan: 5.5,
        cekKandang: true,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });

      // Kandang B: 75 ekor x sekitar 110g/ekor/hari = 8.25kg.
      harianTernakData.push({
        id: `hterhi0b-0000-0000-0000-0000000000${dayString}`,
        laporanId: `laphtb00-0000-0000-0000-0000000000${dayString}`,
        pakan: 8.25,
        cekKandang: true,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("harianTernak", harianTernakData, {
      ignoreDuplicates: false,
      returning: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("harianTernak", null, {});
  },
};
