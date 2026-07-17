"use strict";

const hasColumn = async (queryInterface, tableName, columnName) => {
  const table = await queryInterface.describeTable(tableName);

  return Object.prototype.hasOwnProperty.call(table, columnName);
};

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasColumn(queryInterface, "komoditas", "panenConfig"))) {
      await queryInterface.addColumn("komoditas", "panenConfig", {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Konfigurasi field dan validasi panen dinamis untuk mobile.",
        after: "tipeKomoditas",
      });
    }

    if (!(await hasColumn(queryInterface, "panen", "jumlahHewan"))) {
      await queryInterface.addColumn("panen", "jumlahHewan", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: "Jumlah hewan yang dipanen untuk komoditas ternak atau ikan.",
        after: "berat",
      });
    }
  },

  async down(queryInterface) {
    if (await hasColumn(queryInterface, "panen", "jumlahHewan")) {
      await queryInterface.removeColumn("panen", "jumlahHewan");
    }

    if (await hasColumn(queryInterface, "komoditas", "panenConfig")) {
      await queryInterface.removeColumn("komoditas", "panenConfig");
    }
  },
};
