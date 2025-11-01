"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const jenisBudidayaId1 = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d"; // Ayam Broiler
    const jenisBudidayaId2 = "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a"; // Sawi

    await queryInterface.bulkInsert(
      "unitBudidaya",
      [
        {
          id: "unit001-0000-0000-0000-000000000001",
          jenisBudidayaId: jenisBudidayaId1,
          nama: "Kandang Ayam Broiler A",
          lokasi: "Blok A, Lantai 1",
          tipe: "kolektif",
          jumlah: 50,
          luas: 25.5,
          kapasitas: 100,
          status: true,
          gambar: "https://example.com/images/kandang-ayam-a.jpg",
          deskripsi: "Kandang ayam broiler dengan sistem terbuka",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "unit002-0000-0000-0000-000000000002",
          jenisBudidayaId: jenisBudidayaId1,
          nama: "Kandang Ayam Broiler B",
          lokasi: "Blok B, Lantai 1",
          tipe: "kolektif",
          jumlah: 75,
          luas: 30,
          kapasitas: 150,
          status: true,
          gambar: "https://example.com/images/kandang-ayam-b.jpg",
          deskripsi: "Kandang ayam broiler dengan sistem semi tertutup",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "unit003-0000-0000-0000-000000000003",
          jenisBudidayaId: jenisBudidayaId2,
          nama: "Bedeng Sawi A",
          lokasi: "Rooftop, Area 1",
          tipe: "kolektif",
          jumlah: 200,
          luas: 10,
          kapasitas: 250,
          status: true,
          gambar: "https://example.com/images/bedeng-sawi-a.jpg",
          deskripsi: "Bedeng tanam sawi dengan sistem hidroponik NFT",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "unit004-0000-0000-0000-000000000004",
          jenisBudidayaId: jenisBudidayaId2,
          nama: "Bedeng Sawi B",
          lokasi: "Rooftop, Area 2",
          tipe: "kolektif",
          jumlah: 150,
          luas: 8.0,
          kapasitas: 200,
          status: true,
          gambar: "https://example.com/images/bedeng-sawi-b.jpg",
          deskripsi: "Bedeng tanam sawi dengan sistem hidroponik DFT",
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
    await queryInterface.bulkDelete("unitBudidaya", null, {});
  },
};

