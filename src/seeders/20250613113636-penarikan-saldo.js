"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId1 = "f6f87523-3a83-4917-9f71-b773ac9acc3a"; // Rooftop Farming Center
    const rekeningId1 = "rekn001-0000-0000-0000-000000000001";

    await queryInterface.bulkInsert(
      "penarikan_saldo",
      [
        {
          id: "pnrk001-0000-0000-0000-000000000001",
          userId: userId1,
          rekeningBankId: rekeningId1,
          jumlahDiminta: 200000,
          biayaAdmin: 2500,
          jumlahDiterima: 197500,
          status: "pending",
          tanggalRequest: new Date(),
          tanggalProses: null,
          catatanAdmin: null,
          buktiTransfer: null,
          referensiBank: null,
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
    await queryInterface.bulkDelete("penarikan_saldo", null, {});
  },
};

