"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const harianKebunData = [];
    const now = new Date();

    for (let i = 15; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayIndex = 15 - i + 1; // 1 to 16
      const dayString = String(dayIndex).padStart(2, '0');
      const laporanId = `laphkeb0-0000-0000-0000-0000000000${dayString}`;

      let statusTumbuh = "perkecambahan";
      if (dayIndex >= 4 && dayIndex <= 8) {
          statusTumbuh = "vegetatifAwal";
      } else if (dayIndex > 8) {
          statusTumbuh = "vegetatifLanjut";
      }

      harianKebunData.push({
        id: `hkebhist-0000-0000-0000-0000000000${dayString}`,
        laporanId: laporanId,
        penyiraman: true,
        pruning: dayIndex % 7 === 0, // prune every 7 days
        repotting: false,
        tinggiTanaman: 2.0 + (dayIndex * 1.5), // grows 1.5cm per day
        kondisiDaun: "sehat",
        statusTumbuh: statusTumbuh,
        isDeleted: false,
        createdAt: date,
        updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("harianKebun", harianKebunData, {
      ignoreDuplicates: false,
      returning: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("harianKebun", null, {});
  },
};
