'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Jenis Budidaya (Ayam Petelur)
    const jenisId = uuidv4();
    await queryInterface.bulkInsert('jenisBudidaya', [{
      id: jenisId,
      nama: 'Ayam Petelur',
      latin: 'Gallus gallus domesticus',
      status: true,
      detail: 'Ayam petelur untuk produksi telur konsumsi',
      tipe: 'hewan',
      gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784862984/Ayam_Petelur_wd7vpj.jpg',
      periodePanen: null,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }]);

    // 2. Unit Budidaya (Kandang Ayam Petelur)
    const unitId = uuidv4();
    await queryInterface.bulkInsert('unitBudidaya', [{
      id: unitId,
      jenisBudidayaId: jenisId,
      nama: 'Kandang Ayam Petelur',
      lokasi: 'Area Peternakan Utama',
      tipe: 'individu',
      luas: 200,
      kapasitas: 198,
      jumlah: 190,
      umurMinggu: 25,
      status: true,
      gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784862984/Ayam_Petelur_wd7vpj.jpg',
      deskripsi: 'Kandang khusus ayam petelur produksi',
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    }]);

    // 3. Objek Budidaya (Hewan Ternak, 190 ekor)
    const objekList = [];
    for (let i = 1; i <= 190; i++) {
      objekList.push({
        id: uuidv4(),
        unitBudidayaId: unitId,
        namaId: `AP-${String(i).padStart(3, '0')}`,
        status: true,
        deskripsi: 'Ayam Petelur Produktif',
        isDeleted: false,
        createdAt: now,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('objekBudidaya', objekList);
  },

  async down(queryInterface, Sequelize) {
    // Menghapus data jika di-rollback
    await queryInterface.bulkDelete('objekBudidaya', { deskripsi: 'Ayam Petelur Produktif' });
    await queryInterface.bulkDelete('unitBudidaya', { nama: 'Kandang Ayam Petelur' });
    await queryInterface.bulkDelete('jenisBudidaya', { nama: 'Ayam Petelur' });
  }
};
