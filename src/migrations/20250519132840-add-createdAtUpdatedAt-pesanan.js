'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pesanan', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });

    await queryInterface.addColumn('pesanan', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pesanan', 'createdAt');

    await queryInterface.removeColumn('pesanan', 'updatedAt');
  }
};