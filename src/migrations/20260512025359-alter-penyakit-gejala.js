'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('penyakit_gejala', 'penanganan_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'penangananPenyakitAyam',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('penyakit_gejala', 'penanganan_id');
  }
};
