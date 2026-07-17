"use strict";

const hasColumn = async (queryInterface, tableName, columnName) => {
  const table = await queryInterface.describeTable(tableName);

  return Object.prototype.hasOwnProperty.call(table, columnName);
};

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasColumn(queryInterface, "unitBudidaya", "umurMinggu"))) {
      await queryInterface.addColumn("unitBudidaya", "umurMinggu", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Umur ternak di dalam unit budidaya dalam satuan minggu.",
        after: "jumlah",
      });

      await queryInterface.sequelize.query(`
        UPDATE unitBudidaya
        SET umurMinggu = GREATEST(TIMESTAMPDIFF(WEEK, createdAt, NOW()), 0)
        WHERE (umurMinggu IS NULL OR umurMinggu = 0)
          AND createdAt IS NOT NULL
      `);
    }
  },

  async down(queryInterface) {
    if (await hasColumn(queryInterface, "unitBudidaya", "umurMinggu")) {
      await queryInterface.removeColumn("unitBudidaya", "umurMinggu");
    }
  },
};
