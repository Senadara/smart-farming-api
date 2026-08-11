"use strict";

async function addColumnIfMissing(queryInterface, tableName, columnName, definition) {
  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

async function removeColumnIfExists(queryInterface, tableName, columnName) {
  const table = await queryInterface.describeTable(tableName);
  if (table[columnName]) {
    await queryInterface.removeColumn(tableName, columnName);
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await addColumnIfMissing(queryInterface, "objekBudidaya", "tanggalMasuk", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: "deskripsi",
    });
    await addColumnIfMissing(queryInterface, "objekBudidaya", "umurMasukMinggu", {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      after: "tanggalMasuk",
    });
    await addColumnIfMissing(queryInterface, "objekBudidaya", "targetAfkirAt", {
      type: Sequelize.DATEONLY,
      allowNull: true,
      after: "umurMasukMinggu",
    });
    await addColumnIfMissing(queryInterface, "objekBudidaya", "batchKode", {
      type: Sequelize.STRING(80),
      allowNull: true,
      after: "targetAfkirAt",
    });

    try {
      await queryInterface.addIndex("objekBudidaya", ["batchKode"], {
        name: "objek_budidaya_batch_kode_index",
      });
    } catch (error) {
      if (!String(error?.message || "").toLowerCase().includes("duplicate")) {
        throw error;
      }
    }
  },

  async down(queryInterface) {
    try {
      await queryInterface.removeIndex("objekBudidaya", "objek_budidaya_batch_kode_index");
    } catch (error) {
      // Index may not exist in older local databases.
    }

    await removeColumnIfExists(queryInterface, "objekBudidaya", "batchKode");
    await removeColumnIfExists(queryInterface, "objekBudidaya", "targetAfkirAt");
    await removeColumnIfExists(queryInterface, "objekBudidaya", "umurMasukMinggu");
    await removeColumnIfExists(queryInterface, "objekBudidaya", "tanggalMasuk");
  },
};
