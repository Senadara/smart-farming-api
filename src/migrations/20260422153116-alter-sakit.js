'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename penyakit → diagnosisPenyakit
    await queryInterface.renameColumn('sakit', 'penyakit', 'diagnosisPenyakit');
    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.addColumn('sakit', 'status', {
      type: Sequelize.ENUM('Sudah ditangani', 'Belum ditangani'),
      allowNull: false,
      defaultValue: 'Belum ditangani',
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.renameColumn('sakit', 'diagnosisPenyakit', 'penyakit');
  }
};
