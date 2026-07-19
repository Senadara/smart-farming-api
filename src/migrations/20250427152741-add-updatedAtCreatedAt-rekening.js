'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rekening', 'createdAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });

    await queryInterface.addColumn('rekening', 'updatedAt', {
      type: Sequelize.DATE,
      allowNull: false,
      
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('rekening', 'createdAt');

    await queryInterface.removeColumn('rekening', 'updatedAt');
  }
};