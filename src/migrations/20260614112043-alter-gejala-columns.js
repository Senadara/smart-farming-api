"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hapus kolom lama yang tidak sesuai model
    const tableDescription = await queryInterface.describeTable("gejala");

    if (tableDescription.nama_gejala) {
      await queryInterface.removeColumn("gejala", "nama_gejala");
    }
    if (tableDescription.gambar) {
      await queryInterface.removeColumn("gejala", "gambar");
    }
    if (tableDescription.createdAt) {
      await queryInterface.removeColumn("gejala", "createdAt");
    }
    if (tableDescription.updatedAt) {
      await queryInterface.removeColumn("gejala", "updatedAt");
    }
    if (tableDescription.deletedAt) {
      await queryInterface.removeColumn("gejala", "deletedAt");
    }

    // Tambah kolom baru sesuai model
    if (!tableDescription.gejala1) {
      await queryInterface.addColumn("gejala", "gejala1", {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: "-",
        after: "id",
      });
    }
    if (!tableDescription.gejala2) {
      await queryInterface.addColumn("gejala", "gejala2", {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: "gejala1",
      });
    }
    if (!tableDescription.gejala3) {
      await queryInterface.addColumn("gejala", "gejala3", {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: "gejala2",
      });
    }
    if (!tableDescription.gejala4) {
      await queryInterface.addColumn("gejala", "gejala4", {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: "gejala3",
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Kembalikan ke struktur lama
    const tableDescription = await queryInterface.describeTable("gejala");

    if (tableDescription.gejala1) {
      await queryInterface.removeColumn("gejala", "gejala1");
    }
    if (tableDescription.gejala2) {
      await queryInterface.removeColumn("gejala", "gejala2");
    }
    if (tableDescription.gejala3) {
      await queryInterface.removeColumn("gejala", "gejala3");
    }
    if (tableDescription.gejala4) {
      await queryInterface.removeColumn("gejala", "gejala4");
    }

    await queryInterface.addColumn("gejala", "nama_gejala", {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: "-",
    });
    await queryInterface.addColumn("gejala", "gambar", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn("gejala", "createdAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("gejala", "updatedAt", {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("gejala", "deletedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
};
