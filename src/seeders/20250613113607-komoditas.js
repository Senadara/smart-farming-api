"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const jenisBudidayaId1 = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"; // Ayam Broiler
    const jenisBudidayaId2 = "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a"; // Sawi
    const satuanId1 = "55555555-5555-5555-5555-555555555555"; // Ekor
    const satuanId2 = "77777777-7777-7777-7777-777777777777"; // Batang

    await queryInterface.bulkInsert(
      "komoditas",
      [
        {
          id: "komo001-0000-0000-0000-000000000001",
          jenisBudidayaId: jenisBudidayaId1,
          satuanId: satuanId1,
          nama: "Ayam Broiler Batch 1",
          gambar: "https://example.com/images/komoditas-ayam-1.jpg",
          jumlah: 50,
          tipeKomoditas: "kolektif",
          hapusObjek: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "komo002-0000-0000-0000-000000000002",
          jenisBudidayaId: jenisBudidayaId2,
          satuanId: satuanId2,
          nama: "Sawi Hidroponik Batch 1",
          gambar: "https://example.com/images/komoditas-sawi-1.jpg",
          jumlah: 200,
          tipeKomoditas: "kolektif",
          hapusObjek: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "komo003-0000-0000-0000-000000000003",
          jenisBudidayaId: jenisBudidayaId2,
          satuanId: satuanId2,
          nama: "Sawi Hidroponik Batch 2",
          gambar: "https://example.com/images/komoditas-sawi-2.jpg",
          jumlah: 150,
          tipeKomoditas: "kolektif",
          hapusObjek: false,
          isDeleted: false,
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
    await queryInterface.bulkDelete("komoditas", null, {});
  },
};

