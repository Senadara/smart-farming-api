"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sensor_data", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nitrogen: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      phosphor: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      potassium: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      temperature: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      humidity: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      ec: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      ph: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("sensor_data");
  },
};
