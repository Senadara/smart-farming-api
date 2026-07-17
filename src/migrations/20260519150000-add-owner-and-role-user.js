'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user', 'owner_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.changeColumn('user', 'role', {
      type: Sequelize.ENUM('user', 'inventor', 'penjual', 'pjawab', 'petugas', 'admin', 'owner', 'supplier'),
      allowNull: false,
      defaultValue: 'owner'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user', 'owner_id');

    await queryInterface.changeColumn('user', 'role', {
      type: Sequelize.ENUM('user', 'inventor', 'penjual', 'pjawab', 'petugas', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};
