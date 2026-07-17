'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('gejala', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      nama_gejala: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      gambar: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('gejala');
  }
};
