'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mutasi_saldo_user', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user', // Pastikan nama tabel user Anda adalah 'user'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Jika user dihapus, mutasi terkait juga dihapus
      },
      tipeTransaksi: {
        type: Sequelize.ENUM(
          "pendapatan_masuk_penjual",
          "penarikan_dana",
          "refund_masuk",
        ),
        allowNull: false,
      },
      jumlah: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      saldoSebelum: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
      saldoSesudah: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
       referensiId: { // ID dari tabel sumber (misal: pendapatan.id, penarikan_saldo.id, pesanan.id)
        type: Sequelize.UUID,
        allowNull: true, // Sebaiknya diisi untuk tipe transaksi utama,
                         // allowNull: true untuk fleksibilitas jika ada mutasi tanpa referensi langsung (misal, koreksi admin)
      },
      referensiTabel: { // Nama tabel sumber dari referensiId (misal: 'pendapatan', 'penarikan_saldo', 'pesanan')
        type: Sequelize.STRING,
        allowNull: true, // Sama seperti referensiId
      },
      keterangan: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        
      },
      updatedAt: { 
        allowNull: false,
        type: Sequelize.DATE,
        
      }
    });

    await queryInterface.addIndex('mutasi_saldo_user', ['userId', 'createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('mutasi_saldo_user', ['userId', 'createdAt']);
    await queryInterface.dropTable('mutasi_saldo_user');
  }
};