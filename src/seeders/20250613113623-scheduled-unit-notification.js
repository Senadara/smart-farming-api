"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";
    const unitBudidayaId2 = "unit003-0000-0000-0000-000000000003";

    await queryInterface.bulkInsert(
      "scheduledUnitNotification",
      [
        {
          id: "snun001-0000-0000-0000-000000000001",
          unitBudidayaId: unitBudidayaId1,
          title: "Pengingat Pakan Ternak",
          messageTemplate: "Waktunya memberikan pakan untuk kandang Ayam Broiler A",
          notificationType: "daily",
          dayOfWeek: null,
          dayOfMonth: null,
          scheduledTime: "06:00:00",
          tipeLaporan: "panen",
          isActive: true,
          lastTriggered: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "snun002-0000-0000-0000-000000000002",
          unitBudidayaId: unitBudidayaId2,
          title: "Pengingat Penyiraman Tanaman",
          messageTemplate: "Waktunya menyiram tanaman di Bedeng Sawi A",
          notificationType: "daily",
          dayOfWeek: null,
          dayOfMonth: null,
          scheduledTime: "07:00:00",
          tipeLaporan: "panen",
          isActive: true,
          lastTriggered: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "snun003-0000-0000-0000-000000000003",
          unitBudidayaId: unitBudidayaId1,
          title: "Pengingat Pemberian Vitamin",
          messageTemplate: "Waktunya memberikan vitamin untuk kandang Ayam Broiler A",
          notificationType: "weekly",
          dayOfWeek: 1, // Senin
          dayOfMonth: null,
          scheduledTime: "08:00:00",
          tipeLaporan: "vitamin",
          isActive: true,
          lastTriggered: null,
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
    await queryInterface.bulkDelete("scheduledUnitNotification", null, {});
  },
};

