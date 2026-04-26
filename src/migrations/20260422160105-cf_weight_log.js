'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('cf_weight_log', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      penyakit_gejala_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'penyakit_gejala',
          key: 'id',
        },
      },
      cf_weight_lama: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      cf_weight_baru: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      total_disease_lama: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      triggered_by: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('cf_weight_log');
  }
};
