'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.removeConstraint(
        'sakit',
        'fk_sakit_diagnosisPenyakit_laporan_gejala'
      );
    } catch (e) {
      console.log('Constraint fk_sakit_diagnosisPenyakit_laporan_gejala tidak ditemukan, dilewati.');
    }

    try {
      await queryInterface.removeConstraint(
        'sakit',
        'fk_sakit_diagnosisPenyakit_penyakit_ayam'
      );
    } catch (e) {
    }

    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.UUID,
      allowNull: true,
    });

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
  },
};
