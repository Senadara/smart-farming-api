"use strict";

const hasColumn = async (queryInterface, tableName, columnName) => {
  const table = await queryInterface.describeTable(tableName);

  return Object.prototype.hasOwnProperty.call(table, columnName);
};

/** @type {import("sequelize-cli").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("panenRincianGrade", "jumlah", {
      type: Sequelize.DOUBLE,
      allowNull: true,
      validate: { isFloat: true, min: 0 },
      comment: "Jumlah telur dari grade ini dalam butir.",
    });

    if (!(await hasColumn(queryInterface, "panenRincianGrade", "berat"))) {
      await queryInterface.addColumn("panenRincianGrade", "berat", {
        type: Sequelize.DOUBLE,
        allowNull: true,
        validate: { isFloat: true, min: 0 },
        comment: "Berat telur dari grade ini dalam kilogram.",
        after: "jumlah",
      });
    }

    if (!(await hasColumn(queryInterface, "panenRincianGrade", "persentaseJumlah"))) {
      await queryInterface.addColumn("panenRincianGrade", "persentaseJumlah", {
        type: Sequelize.DOUBLE,
        allowNull: true,
        validate: { isFloat: true, min: 0, max: 100 },
        comment: "Persentase jumlah telur grade terhadap total jumlah panen.",
        after: "berat",
      });
    }

    if (!(await hasColumn(queryInterface, "panenRincianGrade", "persentaseBerat"))) {
      await queryInterface.addColumn("panenRincianGrade", "persentaseBerat", {
        type: Sequelize.DOUBLE,
        allowNull: true,
        validate: { isFloat: true, min: 0, max: 100 },
        comment: "Persentase berat telur grade terhadap total berat panen.",
        after: "persentaseJumlah",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    if (await hasColumn(queryInterface, "panenRincianGrade", "persentaseBerat")) {
      await queryInterface.removeColumn("panenRincianGrade", "persentaseBerat");
    }

    if (await hasColumn(queryInterface, "panenRincianGrade", "persentaseJumlah")) {
      await queryInterface.removeColumn("panenRincianGrade", "persentaseJumlah");
    }

    if (await hasColumn(queryInterface, "panenRincianGrade", "berat")) {
      await queryInterface.removeColumn("panenRincianGrade", "berat");
    }

    await queryInterface.changeColumn("panenRincianGrade", "jumlah", {
      type: Sequelize.DOUBLE,
      allowNull: false,
      validate: { isFloat: true, min: 0 },
      comment: "Jumlah dari grade ini yang dipanen",
    });
  },
};
