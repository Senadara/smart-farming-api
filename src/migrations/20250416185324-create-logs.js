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
    await queryInterface.createTable("logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      tableName: {
        type: Sequelize.STRING,
      },
      action: {
        type: Sequelize.ENUM("create", "update", "delete"),
      },
      recordId: {
        type: Sequelize.UUID,
      },
      before: {
        type: Sequelize.JSON,
      },
      after: {
        type: Sequelize.JSON,
      },
      changedBy: {
        type: Sequelize.UUID,
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
    await queryInterface.dropTable("logs");
  },
};
