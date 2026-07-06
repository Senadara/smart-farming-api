"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE harianTernak ht
      JOIN laporan l ON l.id = ht.laporanId
      JOIN unitBudidaya ub ON ub.id = l.unitBudidayaId
      SET ht.pakan = ROUND(GREATEST(COALESCE(ub.jumlah, 0), 0) * 0.11, 2)
      WHERE ht.pakan > 0
        AND ht.pakan <= 1
        AND COALESCE(ht.isDeleted, 0) = 0
        AND COALESCE(l.isDeleted, 0) = 0
    `);
  },

  async down() {
    // No-op: this migration normalizes legacy boolean feed values into kg.
  },
};
