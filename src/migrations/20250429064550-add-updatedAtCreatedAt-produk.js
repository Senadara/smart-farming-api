'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('produk', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });

    await queryInterface.addColumn('produk', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('produk', 'createdAt');

    await queryInterface.removeColumn('produk', 'updatedAt');
  }
};