'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('buktiDiterima', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      fotoBukti: {
        type: Sequelize.STRING,
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

    await queryInterface.addColumn('pesanan', 'buktiDiterimaId', {
      type: Sequelize.UUID,
      references: {
        model: 'buktiDiterima',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('pesanan', 'buktiDiterimaId');

    await queryInterface.dropTable('buktiDiterima');
  }
};