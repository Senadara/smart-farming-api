'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('sakit', 'status', {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: 'Belum ditangani'
    });

    await queryInterface.sequelize.query(`
      UPDATE sakit
      SET status = 'Belum Ditangani'
      WHERE status IS NULL
        OR status = ''
        OR status = 'Belum ditangani'
    `);

    await queryInterface.sequelize.query(`
      UPDATE sakit
      SET status = 'Sembuh'
      WHERE status = 'Sudah ditangani'
    `);

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
    await queryInterface.sequelize.query(`
      UPDATE sakit
      SET status = 'Sembuh'
      WHERE status = 'Mati'
    `);

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
