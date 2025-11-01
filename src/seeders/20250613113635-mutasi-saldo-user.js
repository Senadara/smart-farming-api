"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId1 = "f6f87523-3a83-4917-9f71-b773ac9acc3a"; // Rooftop Farming Center
    const pendapatanId1 = "pend001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "mutasi_saldo_user",
      [
        {
          id: "mut001-0000-0000-0000-000000000001",
          userId: userId1,
          tipeTransaksi: "pendapatan_masuk_penjual",
          jumlah: 170000,
          saldoSebelum: 330000,
          saldoSesudah: 500000,
          referensiId: pendapatanId1,
          referensiTabel: "pendapatan",
          keterangan: "Pendapatan dari pesanan ORDER-001",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        ignoreDuplicates: false,
        returning: true,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("mutasi_saldo_user", null, {});
  },
};

