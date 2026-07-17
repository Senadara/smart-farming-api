'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('penarikan_saldo', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      userId: { 
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' 
      },
      rekeningBankId: { 
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'rekening', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      jumlahDiminta: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      biayaAdmin: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      jumlahDiterima: { 
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(
          "pending",
          "processing",
          "completed",
          "rejected",
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      tanggalRequest: {
        type: Sequelize.DATE,
        allowNull: false,
        
      },
      tanggalProses: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      catatanAdmin: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      buktiTransfer: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      referensiBank: {
        type: Sequelize.STRING,
        allowNull: true,
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
    await queryInterface.dropTable('penarikan_saldo');
  }
};