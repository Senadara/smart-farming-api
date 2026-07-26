'use strict';

const { v4: uuidv4 } = require('uuid');
const { encrypt } = require('../config/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // 1. Users
    await queryInterface.bulkInsert('user', [
      {
        id: uuidv4(),
        name: 'Ricky',
        email: 'tes1@gmail.com',
        phone: '123456789',
        password: await encrypt('12345678'),
        role: 'pjawab',
        avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?eyes=variant6W12&mouth=variant2&backgroundColor=5fd15e',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uuidv4(),
        name: 'Chicha',
        email: 'tes2@gmail.com',
        phone: '223456789',
        password: await encrypt('12345678'),
        role: 'petugas',
        avatarUrl: 'https://api.dicebear.com/9.x/thumbs/svg?eyes=variant6W12&mouth=variant2&backgroundColor=5fd15e',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // 2. Gejala
    const g_nafsu = uuidv4();
    const g_ngorok = uuidv4();
    const g_prod = uuidv4();
    const g_batuk = uuidv4();
    const g_jengger_biru = uuidv4();
    const g_leleran = uuidv4();
    const g_depresi = uuidv4();
    const g_sayu = uuidv4();
    const g_diare = uuidv4();
    const g_kepala_pelintir = uuidv4();
    const g_tremor = uuidv4();
    const g_telur_abnormal = uuidv4();
    const g_kepala_bengkak = uuidv4();
    const g_jengger_pucat = uuidv4();

    const gejalaList = [
      { id: g_nafsu, nama_gejala: 'Nafsu makan menurun', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861703/Ilustrasi_Nafsu_makan_menurun-removebg-preview_tloe1a.png' },
      { id: g_ngorok, nama_gejala: 'Ngorok', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861704/Ilustrasi_Ngorok-removebg-preview_kwpozc.png' },
      { id: g_prod, nama_gejala: 'Produksi telur menurun', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861704/Ilustrasi_Produksi_telur_menurun-removebg-preview_pqzj3b.png' },
      { id: g_batuk, nama_gejala: 'Batuk', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Ilustrasi_Batuk-removebg-preview_d58xdz.png' },
      { id: g_jengger_biru, nama_gejala: 'Jengger Membiru', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861703/Ilustrasi_Jengger_membiru-removebg-preview_ci4deg.png' },
      { id: g_leleran, nama_gejala: 'Leleran hidung', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861703/Ilustrasi_Leleran_hidung-removebg-preview_ta5thx.png' },
      { id: g_depresi, nama_gejala: 'Depresi', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Ilustrasi_Depresi-removebg-preview_gia69w.png' },
      { id: g_sayu, nama_gejala: 'Tampak sayu', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861704/Ilustrasi_Tampak_sayu-removebg-preview_r5shbw.png' },
      { id: g_diare, nama_gejala: 'Diare', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Gemini_Generated_Image_nhfjenhfjenhfjen__1_-removebg-preview_ubrnjo.png' },
      { id: g_kepala_pelintir, nama_gejala: 'Kepala Terpelintir', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Gemini_Generated_Image_nhfjenhfjenhfjen__2_-removebg-preview_ngmj9t.png' },
      { id: g_tremor, nama_gejala: 'Tremor', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861704/Ilustrasi_Tremor-removebg-preview_xnl2la.png' },
      { id: g_telur_abnormal, nama_gejala: 'Bentuk Telur Abnormal', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Gemini_Generated_Image_nhfjenhfjenhfjen__3_-removebg-preview_uk6nde.png' },
      { id: g_kepala_bengkak, nama_gejala: 'Kepala Bengkak', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861702/Gemini_Generated_Image_nhfjenhfjenhfjen__4_-removebg-preview_olsfdw.png' },
      { id: g_jengger_pucat, nama_gejala: 'Jengger pucat', gambar: 'https://res.cloudinary.com/mbxp6pey/image/upload/v1784861703/Ilustrasi_Jengger_pucat-removebg-preview_sb8x95.png' }
    ].map(item => ({ ...item, createdAt: now, updatedAt: now }));

    await queryInterface.bulkInsert('gejala', gejalaList);

    // 3. Penyakit Ayam
    const p_ai = uuidv4();
    const p_gumboro = uuidv4();
    const p_lymphoid = uuidv4();
    const p_tetelo = uuidv4();
    const p_ae = uuidv4();
    const p_ib = uuidv4();
    const p_crd = uuidv4();
    const p_eds = uuidv4();
    const p_ilt = uuidv4();

    const penyakitList = [
      { id: p_ai, nama_penyakit: 'Avian Influenza (AI)' },
      { id: p_gumboro, nama_penyakit: 'Gumboro' },
      { id: p_lymphoid, nama_penyakit: 'Lymphoid Leukosis' },
      { id: p_tetelo, nama_penyakit: 'Tetelo (Newcastle Disease/ND)' },
      { id: p_ae, nama_penyakit: 'Avian Encephalomyelitis' },
      { id: p_ib, nama_penyakit: 'Infectious Bronchitis (IB)' },
      { id: p_crd, nama_penyakit: 'Chronic Respiratory Disease (CRD)' },
      { id: p_eds, nama_penyakit: 'Egg Drop Syndrome (EDS)' },
      { id: p_ilt, nama_penyakit: 'Infectious Laryngotracheitis (ILT)' }
    ].map(item => ({ ...item, createdAt: now, updatedAt: now }));

    await queryInterface.bulkInsert('penyakit_ayam', penyakitList);

    // 4. Relasi Penyakit - Gejala
    const pgDataRaw = [
      // AI
      { penyakit_id: p_ai, gejala_id: g_nafsu, cf_weight: 0.2 },
      { penyakit_id: p_ai, gejala_id: g_ngorok, cf_weight: 0.6 },
      { penyakit_id: p_ai, gejala_id: g_prod, cf_weight: 0.4 },
      { penyakit_id: p_ai, gejala_id: g_batuk, cf_weight: 0.6 },
      { penyakit_id: p_ai, gejala_id: g_jengger_biru, cf_weight: 0.9 },
      { penyakit_id: p_ai, gejala_id: g_leleran, cf_weight: 0.5 },
      // Gumboro
      { penyakit_id: p_gumboro, gejala_id: g_nafsu, cf_weight: 0.2 },
      { penyakit_id: p_gumboro, gejala_id: g_depresi, cf_weight: 0.5 },
      { penyakit_id: p_gumboro, gejala_id: g_sayu, cf_weight: 0.3 },
      { penyakit_id: p_gumboro, gejala_id: g_diare, cf_weight: 0.8 },
      // Lymphoid
      { penyakit_id: p_lymphoid, gejala_id: g_nafsu, cf_weight: 0.2 },
      { penyakit_id: p_lymphoid, gejala_id: g_sayu, cf_weight: 0.3 },
      { penyakit_id: p_lymphoid, gejala_id: g_jengger_biru, cf_weight: 0.7 },
      // Tetelo
      { penyakit_id: p_tetelo, gejala_id: g_nafsu, cf_weight: 0.2 },
      { penyakit_id: p_tetelo, gejala_id: g_ngorok, cf_weight: 0.6 },
      { penyakit_id: p_tetelo, gejala_id: g_prod, cf_weight: 0.4 },
      { penyakit_id: p_tetelo, gejala_id: g_batuk, cf_weight: 0.6 },
      { penyakit_id: p_tetelo, gejala_id: g_sayu, cf_weight: 0.3 },
      { penyakit_id: p_tetelo, gejala_id: g_kepala_pelintir, cf_weight: 0.95 },
      // AE
      { penyakit_id: p_ae, gejala_id: g_tremor, cf_weight: 0.9 },
      { penyakit_id: p_ae, gejala_id: g_prod, cf_weight: 0.4 },
      { penyakit_id: p_ae, gejala_id: g_sayu, cf_weight: 0.3 },
      // IB
      { penyakit_id: p_ib, gejala_id: g_ngorok, cf_weight: 0.6 },
      { penyakit_id: p_ib, gejala_id: g_prod, cf_weight: 0.7 },
      { penyakit_id: p_ib, gejala_id: g_batuk, cf_weight: 0.6 },
      { penyakit_id: p_ib, gejala_id: g_leleran, cf_weight: 0.5 },
      { penyakit_id: p_ib, gejala_id: g_telur_abnormal, cf_weight: 0.9 },
      // CRD
      { penyakit_id: p_crd, gejala_id: g_ngorok, cf_weight: 0.8 },
      { penyakit_id: p_crd, gejala_id: g_batuk, cf_weight: 0.6 },
      { penyakit_id: p_crd, gejala_id: g_leleran, cf_weight: 0.6 },
      { penyakit_id: p_crd, gejala_id: g_kepala_bengkak, cf_weight: 0.8 },
      // EDS
      { penyakit_id: p_eds, gejala_id: g_prod, cf_weight: 0.9 },
      { penyakit_id: p_eds, gejala_id: g_sayu, cf_weight: 0.3 },
      { penyakit_id: p_eds, gejala_id: g_jengger_pucat, cf_weight: 0.6 },
      // ILT
      { penyakit_id: p_ilt, gejala_id: g_prod, cf_weight: 0.5 },
      { penyakit_id: p_ilt, gejala_id: g_sayu, cf_weight: 0.3 },
      { penyakit_id: p_ilt, gejala_id: g_leleran, cf_weight: 0.7 }
    ];

    const pgData = pgDataRaw.map(item => ({
      id: uuidv4(),
      penyakit_id: item.penyakit_id,
      gejala_id: item.gejala_id,
      cf_weight: item.cf_weight,
      disease_frequency: 0,
      total_disease: 0,
      metode: 'manual',
      cf_updated_at: now
    }));

    await queryInterface.bulkInsert('penyakit_gejala', pgData);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user', { email: ['tes1@gmail.com', 'tes2@gmail.com'] });
    
    // Hapus penyakit_gejala, penyakit_ayam, dan gejala (bisa di-truncate atau manual delete)
    // Sebaiknya delete berdasarkan nama karena ini hanya rollback sederhana
    const pNames = [
      'Avian Influenza (AI)', 'Gumboro', 'Lymphoid Leukosis', 
      'Tetelo (Newcastle Disease/ND)', 'Avian Encephalomyelitis', 
      'Infectious Bronchitis (IB)', 'Chronic Respiratory Disease (CRD)', 
      'Egg Drop Syndrome (EDS)', 'Infectious Laryngotracheitis (ILT)'
    ];
    
    // Note: We'd normally do a subquery delete here, but truncate is easier if this is a fresh seeder.
    // For safety, we will just delete everything in these tables that we inserted if possible,
    // or just run manual bulkDeletes.
    await queryInterface.sequelize.query('DELETE FROM penyakit_gejala WHERE metode = "manual"');
    await queryInterface.bulkDelete('penyakit_ayam', { nama_penyakit: pNames });
    await queryInterface.bulkDelete('gejala', { 
      nama_gejala: [
        'Nafsu makan menurun', 'Ngorok', 'Produksi telur menurun', 'Batuk',
        'Jengger Membiru', 'Leleran hidung', 'Depresi', 'Tampak sayu', 'Diare',
        'Kepala Terpelintir', 'Tremor', 'Bentuk Telur Abnormal', 'Kepala Bengkak', 'Jengger pucat'
      ] 
    });
  }
};
