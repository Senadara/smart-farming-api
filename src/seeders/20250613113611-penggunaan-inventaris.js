"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const inventarisId1 = "inv001-0000-0000-0000-000000000001"; // Vitamin AD3E
    const inventarisId2 = "inv004-0000-0000-0000-000000000004"; // Disinfektan
    const userId = "b1fadf5c-e36e-40d1-9770-4415b3af55f0";
    const unitBudidayaId1 = "unit001-0000-0000-0000-000000000001";
    const objekBudidayaId1 = "objk001-0000-0000-0000-000000000001";

    const laporanData = [];
    const penggunaanInventarisData = [];
    const now = new Date();

    const invDays = [13, 6];

    for (let index = 0; index < invDays.length; index++) {
      const i = invDays[index];
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayString = String(15 - i + 1).padStart(2, '0');
      const laporanId = `lappginv-0000-0000-0000-000000000${dayString}`;

      laporanData.push({
          id: laporanId,
          userId: userId,
          unitBudidayaId: unitBudidayaId1,
          objekBudidayaId: objekBudidayaId1,
          judul: `Penggunaan Inventaris Disinfektan - Hari ${15 - i + 1}`,
          tipe: "inventaris",
          gambar: "https://example.com/images/laporan-inventaris-1.jpg",
          catatan: "Disinfektan digunakan untuk sanitasi kandang",
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
      });

      penggunaanInventarisData.push({
          id: `pginvhis-0000-0000-0000-000000000${dayString}`,
          inventarisId: inventarisId2,
          laporanId: laporanId,
          jumlah: 2.5,
          isDeleted: false,
          createdAt: date,
          updatedAt: date,
      });
    }

    await queryInterface.bulkInsert("laporan", laporanData, { ignoreDuplicates: false, returning: true });
    await queryInterface.bulkInsert("penggunaanInventaris", penggunaanInventarisData, { ignoreDuplicates: false, returning: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("penggunaanInventaris", null, {});
    await queryInterface.bulkDelete("laporan", { tipe: "inventaris" }, {});
  },
};
