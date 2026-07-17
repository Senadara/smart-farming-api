"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("gejala", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      gejala1: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      gejala2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      gejala3: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      gejala4: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("gejala");
  },
};
