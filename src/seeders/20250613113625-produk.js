"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tokoId1 = "toko001-0000-0000-0000-000000000001";
    const tokoId2 = "toko002-0000-0000-0000-000000000002";

    await queryInterface.bulkInsert(
      "produk",
      [
        {
          id: "prod001-0000-0000-0000-000000000001",
          tokoId: tokoId1,
          nama: "Daging Ayam Broiler Segar",
          gambar: "https://example.com/images/daging-ayam.jpg",
          stok: 50,
          satuan: "kg",
          harga: 35000,
          deskripsi: "Daging ayam broiler segar dari peternakan rooftop farming",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "prod002-0000-0000-0000-000000000002",
          tokoId: tokoId2,
          nama: "Sawi Hidroponik Segar",
          gambar: "https://example.com/images/sawi-hidroponik.jpg",
          stok: 100,
          satuan: "batang",
          harga: 5000,
          deskripsi: "Sawi hidroponik segar langsung dari kebun",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "prod003-0000-0000-0000-000000000003",
          tokoId: tokoId1,
          nama: "Telur Ayam Petelur",
          gambar: "https://example.com/images/telur-ayam.jpg",
          stok: 200,
          satuan: "buah",
          harga: 2000,
          deskripsi: "Telur ayam petelur segar organik",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "prod004-0000-0000-0000-000000000004",
          tokoId: tokoId2,
          nama: "Cabai Rawit Merah",
          gambar: "https://example.com/images/cabai-rawit.jpg",
          stok: 25,
          satuan: "kg",
          harga: 45000,
          deskripsi: "Cabai rawit merah pedas dari kebun organik",
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
    await queryInterface.bulkDelete("produk", null, {});
  },
};

