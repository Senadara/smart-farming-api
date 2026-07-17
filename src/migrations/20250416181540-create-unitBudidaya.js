"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable("unitBudidaya", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      nama: {
        type: Sequelize.STRING,
      },
      lokasi: {
        type: Sequelize.STRING,
      },
      tipe: {
        type: Sequelize.ENUM("kolektif", "individu"),
      },
      jumlah: {
        type: Sequelize.INTEGER,
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      gambar: {
        type: Sequelize.STRING,
      },
      deskripsi: {
        type: Sequelize.TEXT,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable("unitBudidaya");
  },
};
