'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sakit', 'status', {
      type: Sequelize.ENUM(
        'Belum Ditangani',
        'Pemantauan',
        'Sembuh',
        'Mati'
      ),
      allowNull: false,
      defaultValue: 'Belum Ditangani'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sakit', 'status', {
      type: Sequelize.ENUM(
        'Belum Ditangani',
        'Pemantauan',
        'Sembuh'
      ),
      allowNull: false,
      defaultValue: 'Belum Ditangani'
    });
  }
};
