'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pendapatan', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      pesananId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'pesanan',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      harga: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pendapatan');
  }
};