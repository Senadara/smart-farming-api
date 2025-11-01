"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0"; // user

    await queryInterface.bulkInsert(
      "artikel",
      [
        {
          id: "artk001-0000-0000-0000-000000000001",
          userId: userId,
          judul: "Tips Budidaya Ayam Broiler di Rooftop",
          images: "https://example.com/images/artikel-ayam-broiler.jpg",
          deskripsi: "Panduan lengkap untuk memulai budidaya ayam broiler di rooftop farming dengan sistem yang efisien dan ramah lingkungan.",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "artk002-0000-0000-0000-000000000002",
          userId: userId,
          judul: "Sistem Hidroponik NFT untuk Tanaman Sayuran",
          images: "https://example.com/images/artikel-hidroponik.jpg",
          deskripsi: "Pelajari cara membuat sistem hidroponik NFT (Nutrient Film Technique) untuk menanam sayuran di lahan terbatas.",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "artk003-0000-0000-0000-000000000003",
          userId: userId,
          judul: "Manajemen Inventaris untuk Peternakan",
          images: "https://example.com/images/artikel-inventaris.jpg",
          deskripsi: "Tips dan trik dalam mengelola inventaris peralatan dan bahan untuk peternakan agar lebih efisien.",
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
    await queryInterface.bulkDelete("artikel", null, {});
  },
};

