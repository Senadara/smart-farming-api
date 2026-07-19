'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('keranjang', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });

    await queryInterface.addColumn('keranjang', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('keranjang', 'createdAt');

    await queryInterface.removeColumn('keranjang', 'updatedAt');
  }
};