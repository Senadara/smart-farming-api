"use strict";

/**
 * Drop legacy sensor tables — replaced by normalized iot_sensor_data schema.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable("ayam_sensor_data");
    await queryInterface.dropTable("sensor_data");
  },

  async down(queryInterface, Sequelize) {
    // Recreate sensor_data (melon)
    await queryInterface.createTable("sensor_data", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      nitrogen: { type: Sequelize.DOUBLE, allowNull: true },
      phosphor: { type: Sequelize.DOUBLE, allowNull: true },
      potassium: { type: Sequelize.DOUBLE, allowNull: true },
      temperature: { type: Sequelize.DOUBLE, allowNull: true },
      humidity: { type: Sequelize.DOUBLE, allowNull: true },
      ec: { type: Sequelize.DOUBLE, allowNull: true },
      ph: { type: Sequelize.DOUBLE, allowNull: true },
      isDeleted: { type: Sequelize.BOOLEAN, defaultValue: false },
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

    // Recreate ayam_sensor_data
    await queryInterface.createTable("ayam_sensor_data", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      temperature: { type: Sequelize.DOUBLE, allowNull: true },
      humidity: { type: Sequelize.DOUBLE, allowNull: true },
      isDeleted: { type: Sequelize.BOOLEAN, defaultValue: false },
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
};
