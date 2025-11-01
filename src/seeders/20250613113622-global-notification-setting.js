"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "globalNotificationSetting",
      [
        {
          id: "gnset001-0000-0000-0000-000000000001",
          title: "Pengingat Laporan Harian",
          messageTemplate: "Jangan lupa untuk mengisi laporan harian unit budidaya Anda hari ini.",
          scheduledTime: "08:00:00",
          scheduledDate: null,
          targetRole: "all",
          notificationType: "repeat",
          isActive: true,
          lastTriggered: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "gnset002-0000-0000-0000-000000000002",
          title: "Pengingat Pemberian Vitamin",
          messageTemplate: "Waktunya memberikan vitamin kepada ternak sesuai jadwal.",
          scheduledTime: "06:00:00",
          scheduledDate: null,
          targetRole: "petugas",
          notificationType: "repeat",
          isActive: true,
          lastTriggered: null,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "gnset003-0000-0000-0000-000000000003",
          title: "Pengingat Panen",
          messageTemplate: "Periksa kondisi tanaman/ternak yang sudah mendekati masa panen.",
          scheduledTime: "07:00:00",
          scheduledDate: null,
          targetRole: "pjawab",
          notificationType: "repeat",
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
    await queryInterface.bulkDelete("globalNotificationSetting", null, {});
  },
};

