"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const panenKebunId = "pnkb001-0000-0000-0000-000000000001";
    const panenId = "pane001-0000-0000-0000-000000000001";
    const gradeId1 = "grade001-0000-0000-0000-000000000001"; // Grade A
    const gradeId2 = "grade002-0000-0000-0000-000000000002"; // Grade B
    const gradeId3 = "grade003-0000-0000-0000-000000000003"; // Grade C

    await queryInterface.bulkInsert(
      "panenRincianGrade",
      [
        {
          id: "pnrg001-0000-0000-0000-000000000001",
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId1,
          jumlah: 120,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pnrg002-0000-0000-0000-000000000002",
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId2,
          jumlah: 50,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pnrg003-0000-0000-0000-000000000003",
          panenKebunId: panenKebunId,
          panenId: null,
          gradeId: gradeId3,
          jumlah: 15,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "pnrg004-0000-0000-0000-000000000004",
          panenKebunId: null,
          panenId: panenId,
          gradeId: gradeId1,
          jumlah: 45,
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
    await queryInterface.bulkDelete("panenRincianGrade", null, {});
  },
};

