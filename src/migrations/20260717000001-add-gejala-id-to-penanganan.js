'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('penangananPenyakitAyam', 'gejala_id', {
      type: Sequelize.CHAR(36),
      allowNull: true,
      defaultValue: null,
      after: 'penyakit_id',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('penangananPenyakitAyam', 'gejala_id');
  },
};
