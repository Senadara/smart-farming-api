'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('pesananDetail', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });

    await queryInterface.addColumn('pesananDetail', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pesananDetail', 'createdAt');

    await queryInterface.removeColumn('pesananDetail', 'updatedAt');
  }
};