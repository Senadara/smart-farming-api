"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const kategoriInventarisId1 = "ac3a537e-486f-4f99-ace0-e398765bcd0d"; // Vitamin
    const kategoriInventarisId2 = "082802a5-54ba-470f-925e-f90ff6ad447f"; // Vaksin
    const kategoriInventarisId3 = "08bf7193-7e3b-4a15-ae1a-ff273833fff0"; // Pupuk
    const kategoriInventarisId4 = "1dd42017-1358-4141-859c-5084f347f534"; // Disinfektan
    const satuanId1 = "33333333-3333-3333-3333-333333333333"; // Liter
    const satuanId2 = "44444444-4444-4444-4444-444444444444"; // Mililiter
    const satuanId3 = "11111111-1111-1111-1111-111111111111"; // Kilogram

    await queryInterface.bulkInsert(
      "inventaris",
      [
        {
          id: "inv001-0000-0000-0000-000000000001",
          kategoriInventarisId: kategoriInventarisId1,
          satuanId: satuanId2,
          nama: "Vitamin AD3E",
          jumlah: 5000,
          stokMinim: 1000,
          gambar: "https://example.com/images/vitamin-ad3e.jpg",
          detail: "Vitamin untuk ternak ayam, botol 100ml",
          tanggalKadaluwarsa: new Date("2025-12-31"),
          ketersediaan: "tersedia",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "inv002-0000-0000-0000-000000000002",
          kategoriInventarisId: kategoriInventarisId2,
          satuanId: satuanId2,
          nama: "Vaksin ND (Newcastle Disease)",
          jumlah: 3000,
          stokMinim: 500,
          gambar: "https://example.com/images/vaksin-nd.jpg",
          detail: "Vaksin untuk pencegahan penyakit Newcastle pada ayam",
          tanggalKadaluwarsa: new Date("2025-06-30"),
          ketersediaan: "tersedia",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "inv003-0000-0000-0000-000000000003",
          kategoriInventarisId: kategoriInventarisId3,
          satuanId: satuanId3,
          nama: "Pupuk NPK 16-16-16",
          jumlah: 50,
          stokMinim: 10,
          gambar: "https://example.com/images/pupuk-npk.jpg",
          detail: "Pupuk NPK untuk tanaman sayuran",
          tanggalKadaluwarsa: new Date("2026-12-31"),
          ketersediaan: "tersedia",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "inv004-0000-0000-0000-000000000004",
          kategoriInventarisId: kategoriInventarisId4,
          satuanId: satuanId1,
          nama: "Disinfektan Karbol",
          jumlah: 20,
          stokMinim: 5,
          gambar: "https://example.com/images/disinfektan-karbol.jpg",
          detail: "Disinfektan untuk sanitasi kandang",
          tanggalKadaluwarsa: new Date("2026-06-30"),
          ketersediaan: "tersedia",
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
    await queryInterface.bulkDelete("inventaris", null, {});
  },
};

