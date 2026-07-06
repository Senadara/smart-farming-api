"use strict";

async function hasColumn(queryInterface, tableName, columnName) {
  const table = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(table, columnName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await hasColumn(queryInterface, "harianTernak", "pakan")) {
      await queryInterface.changeColumn("harianTernak", "pakan", {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        comment: "Jumlah pakan yang diberikan dalam kilogram.",
      });
    }

    if (!(await hasColumn(queryInterface, "panen", "berat"))) {
      await queryInterface.addColumn("panen", "berat", {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: "Total berat hasil panen dalam kilogram.",
        after: "jumlah",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    if (await hasColumn(queryInterface, "panen", "berat")) {
      await queryInterface.removeColumn("panen", "berat");
    }

    if (await hasColumn(queryInterface, "harianTernak", "pakan")) {
      await queryInterface.changeColumn("harianTernak", "pakan", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },
};
