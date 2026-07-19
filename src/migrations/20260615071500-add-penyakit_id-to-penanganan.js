'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('penangananPenyakitAyam', 'penyakit_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'penyakit_ayam',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('penangananPenyakitAyam', 'penyakit_id');
  }
};
