"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    await queryInterface.bulkInsert(
      "kategoriInventaris",
      [
        {
          id: "8d1dd308-4c50-4f42-99f7-e540a5f59b01",
          nama: "Pakan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ac3a537e-486f-4f99-ace0-e398765bcd0d",
          nama: "Vitamin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "082802a5-54ba-470f-925e-f90ff6ad447f",
          nama: "Vaksin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "08bf7193-7e3b-4a15-ae1a-ff273833fff0",
          nama: "Pupuk",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "1dd42017-1358-4141-859c-5084f347f534",
          nama: "Disinfektan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "7956999e-3f8d-4529-9e6a-f927f25b3c92",
          nama: "Obat",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "783b7d7d-9ef9-463e-a309-0472e92d0d08",
          nama: "Peralatan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "84d704f3-f4f9-49a1-8ef0-d24ac86e837d",
          nama: "Perlengkapan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "6e3b97b1-e96b-48f0-8f26-785423ff19a1",
          nama: "Kemasan",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "0a541556-c17e-4c35-af9b-95520cd2982b",
          nama: "Bibit & Media Tanam",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "da12ce9d-d094-4b95-8180-f49a91639f18",
          nama: "Pestisida",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "e4d3edce-64fa-47ea-8fe7-3dbe99e33444",
          nama: "Lainnya",
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
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete("kategoriInventaris", null, {});
  },
};
