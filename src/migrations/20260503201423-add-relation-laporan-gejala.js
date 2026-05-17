'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // SET NULL membutuhkan kolom nullable terlebih dahulu
    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Perbaiki orphaned rows (jika ada data lama di 'sakit' yang tidak ada di 'penyakit_ayam')
    await queryInterface.sequelize.query(`
      UPDATE sakit 
      SET diagnosisPenyakit = NULL 
      WHERE diagnosisPenyakit NOT IN (SELECT id FROM penyakit_ayam)
    `);

    await queryInterface.addConstraint('sakit', {
      fields: ['diagnosisPenyakit'],
      type: 'foreign key',
      name: 'fk_sakit_diagnosisPenyakit_penyakit_ayam',
      references: {
        table: 'penyakit_ayam',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'sakit',
      'fk_sakit_diagnosisPenyakit_penyakit_ayam'
    );

    // Kembalikan kolom ke NOT NULL
    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.UUID,
      allowNull: false,
    });
  }
};
