'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hapus FK constraint lama ke penyakit_ayam (jika ada)
    try {
      await queryInterface.removeConstraint(
        'sakit',
        'fk_sakit_diagnosisPenyakit_penyakit_ayam'
      );
      console.log('Constraint fk_sakit_diagnosisPenyakit_penyakit_ayam dihapus.');
    } catch (e) {
      console.log('Constraint fk_sakit_diagnosisPenyakit_penyakit_ayam tidak ditemukan, dilewati.');
    }

    // 2. Pastikan kolom nullable agar data lama tidak error FK
    await queryInterface.changeColumn('sakit', 'diagnosisPenyakit', {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // 3. NULL-kan semua row sakit yang diagnosisPenyakit-nya TIDAK ada di laporan_gejala
    //    (yaitu data lama yang masih menyimpan penyakit_ayam.id)
    await queryInterface.sequelize.query(`
      UPDATE sakit
      SET diagnosisPenyakit = NULL
      WHERE diagnosisPenyakit IS NOT NULL
        AND diagnosisPenyakit NOT IN (SELECT id FROM laporan_gejala)
    `);

    // 4. Buat FK constraint baru ke laporan_gejala
    await queryInterface.addConstraint('sakit', {
      fields: ['diagnosisPenyakit'],
      type: 'foreign key',
      name: 'fk_sakit_diagnosisPenyakit_laporan_gejala',
      references: {
        table: 'laporan_gejala',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Hapus FK baru ke laporan_gejala
    try {
      await queryInterface.removeConstraint(
        'sakit',
        'fk_sakit_diagnosisPenyakit_laporan_gejala'
      );
    } catch (e) {
      console.log('Constraint fk_sakit_diagnosisPenyakit_laporan_gejala tidak ditemukan.');
    }

    // NULL-kan data yang tidak kompatibel dengan penyakit_ayam
    await queryInterface.sequelize.query(`
      UPDATE sakit
      SET diagnosisPenyakit = NULL
      WHERE diagnosisPenyakit IS NOT NULL
        AND diagnosisPenyakit NOT IN (SELECT id FROM penyakit_ayam)
    `);

    // Kembalikan FK ke penyakit_ayam
    await queryInterface.addConstraint('sakit', {
      fields: ['diagnosisPenyakit'],
      type: 'foreign key',
      name: 'fk_sakit_diagnosisPenyakit_penyakit_ayam',
      references: {
        table: 'penyakit_ayam',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
};
