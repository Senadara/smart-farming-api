"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "jenisBudidaya",
      [
        {
          id: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
          nama: "Ayam Broiler",
          latin: "Gallus gallus domesticus",
          tipe: "hewan",
          gambar: "https://example.com/images/ayam-broiler.jpg",
          status: true,
          detail: "Ayam pedaging yang dipelihara untuk produksi daging",
          periodePanen: 40,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
          nama: "Ayam Petelur",
          latin: "Gallus gallus domesticus",
          tipe: "hewan",
          gambar: "https://example.com/images/ayam-petelur.jpg",
          status: true,
          detail: "Ayam yang dipelihara untuk produksi telur",
          periodePanen: 90,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f",
          nama: "Ikan Lele",
          latin: "Clarias batrachus",
          tipe: "hewan",
          gambar: "https://example.com/images/ikan-lele.jpg",
          status: true,
          detail: "Ikan air tawar yang mudah dibudidayakan",
          periodePanen: 90,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a",
          nama: "Sawi",
          latin: "Brassica juncea",
          tipe: "tumbuhan",
          gambar: "https://example.com/images/sawi.jpg",
          status: true,
          detail: "Tanaman sayuran daun yang cepat panen",
          periodePanen: 45,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b",
          nama: "Kangkung",
          latin: "Ipomoea aquatica",
          tipe: "tumbuhan",
          gambar: "https://example.com/images/kangkung.jpg",
          status: true,
          detail: "Tanaman sayuran air yang mudah tumbuh",
          periodePanen: 30,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c",
          nama: "Cabai Rawit",
          latin: "Capsicum frutescens",
          tipe: "tumbuhan",
          gambar: "https://example.com/images/cabai-rawit.jpg",
          status: true,
          detail: "Tanaman cabai yang tahan lama dan produktif",
          periodePanen: 90,
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
    await queryInterface.bulkDelete("jenisBudidaya", null, {});
  },
};

