'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('panen', 'waktuPanen', {
      type: Sequelize.ENUM('pagi', 'sore'),
      allowNull: true,
      comment: "Waktu panen dilakukan: 'pagi' atau 'sore'"
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('panen', 'waktuPanen');
  }
};
