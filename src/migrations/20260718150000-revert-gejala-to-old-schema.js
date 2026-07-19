'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('gejala');

    // Remove columns gejala1, gejala2, gejala3, gejala4 if present
    if (tableDescription.gejala1) {
      await queryInterface.removeColumn('gejala', 'gejala1');
    }
    if (tableDescription.gejala2) {
      await queryInterface.removeColumn('gejala', 'gejala2');
    }
    if (tableDescription.gejala3) {
      await queryInterface.removeColumn('gejala', 'gejala3');
    }
    if (tableDescription.gejala4) {
      await queryInterface.removeColumn('gejala', 'gejala4');
    }

    // Add old schema columns
    if (!tableDescription.nama_gejala) {
      await queryInterface.addColumn('gejala', 'nama_gejala', {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '-',
      });
    }
    if (!tableDescription.gambar) {
      await queryInterface.addColumn('gejala', 'gambar', {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '-',
      });
    }
    if (!tableDescription.createdAt) {
      await queryInterface.addColumn('gejala', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }
    if (!tableDescription.updatedAt) {
      await queryInterface.addColumn('gejala', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      });
    }
    if (!tableDescription.deletedAt) {
      await queryInterface.addColumn('gejala', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('gejala');

    // Remove old schema columns
    if (tableDescription.nama_gejala) {
      await queryInterface.removeColumn('gejala', 'nama_gejala');
    }
    if (tableDescription.gambar) {
      await queryInterface.removeColumn('gejala', 'gambar');
    }
    if (tableDescription.createdAt) {
      await queryInterface.removeColumn('gejala', 'createdAt');
    }
    if (tableDescription.updatedAt) {
      await queryInterface.removeColumn('gejala', 'updatedAt');
    }
    if (tableDescription.deletedAt) {
      await queryInterface.removeColumn('gejala', 'deletedAt');
    }

    // Add columns gejala1, gejala2, gejala3, gejala4 back
    if (!tableDescription.gejala1) {
      await queryInterface.addColumn('gejala', 'gejala1', {
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '-',
      });
    }
    if (!tableDescription.gejala2) {
      await queryInterface.addColumn('gejala', 'gejala2', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!tableDescription.gejala3) {
      await queryInterface.addColumn('gejala', 'gejala3', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!tableDescription.gejala4) {
      await queryInterface.addColumn('gejala', 'gejala4', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
  }
};
