'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('laporan_gejala', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      penyakit_ayam_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'penyakit_ayam',
          key: 'id',
        },
      },
      gejala_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'gejala',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('laporan_gejala');
  }
};