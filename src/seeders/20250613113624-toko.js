"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Menggunakan user ID penjual dari seeder user-store
    const userId1 = "f6f87523-3a83-4917-9f71-b773ac9acc3a"; // Rooftop Farming Center
    const userId2 = "37d2ea06-ff8e-4c20-80e3-5c35510d37c4"; // Toko Buah Segar Akay

    await queryInterface.bulkInsert(
      "toko",
      [
        {
          id: "toko001-0000-0000-0000-000000000001",
          userId: userId1,
          nama: "Rooftop Farming Center",
          phone: "082266095743",
          alamat: "Jl. Contoh No. 123, Jakarta",
          logoToko: "https://example.com/images/logo-rfc.jpg",
          deskripsi: "Toko produk pertanian dan peternakan rooftop farming",
          tokoStatus: "active",
          TypeToko: "rfc",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "toko002-0000-0000-0000-000000000002",
          userId: userId2,
          nama: "Toko Buah Segar Akay",
          phone: "082266095743",
          alamat: "Jl. Buah Segar No. 456, Bandung",
          logoToko: "https://example.com/images/logo-buah-segar.jpg",
          deskripsi: "Toko buah dan sayuran segar dari petani lokal",
          tokoStatus: "active",
          TypeToko: "rfc",
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
    await queryInterface.bulkDelete("toko", null, {});
  },
};

