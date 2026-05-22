jest.mock('../../../../../model/index', () => {
  const actualOp = require('sequelize').Op;

  const mockModel = () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  });

  return {
    Gejala: mockModel(),
    PenyakitAyam: mockModel(),
    PenyakitGejala: mockModel(),
    PenangananPenyakitAyam: mockModel(),
    Sakit: mockModel(),
    Laporan: mockModel(),
    CfWeightLog: mockModel(),
    sequelize: {
      transaction: jest.fn(),
    },
    Sequelize: {
      Op: actualOp,
    },
  };
});

jest.mock('../../../../../utils/cfHelper', () => ({
  diagnosePenyakit: jest.fn(),
}));

const express = require('express');
const request = require('supertest');
const penyakitAyamRouter = require('../../../../../routes/farm/penyakitAyam');
const sequelize = require('../../../../../model/index');
const { diagnosePenyakit } = require('../../../../../utils/cfHelper');

describe('Integration: penyakit ayam diagnosa route', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use('/api/farm/penyakit-ayam', penyakitAyamRouter);
  });

  it('harus nolak diagnosa kalau gejala kosong', async () => {
    // Given: payload diagnosa kosong
    // When: endpoint dipanggil tanpa gejala
    // Then: server harus balikin 400
    const res = await request(app)
      .post('/api/farm/penyakit-ayam/diagnosa')
      .send({ gejala: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Gejala tidak boleh kosong');
  });

  it('harus balikin diagnosis dan penanganan saat gejala valid', async () => {
    // Given: gejala valid dan hasil diagnosis helper sudah disiapkan
    diagnosePenyakit.mockResolvedValue({
      id: 'penyakit-1',
      nama: 'Penyakit A',
      cf_score: 0.89,
      persentase: 89,
      jumlah_gejala_cocok: 2,
    });

    sequelize.Gejala.findAll.mockResolvedValue([
      { id: 'g1', nama_gejala: 'Batuk' },
      { id: 'g2', nama_gejala: 'Lemas' },
    ]);

    sequelize.PenyakitGejala.findAll.mockResolvedValue([
      { penanganan_id: 't1' },
      { penanganan_id: 't2' },
    ]);

    sequelize.PenangananPenyakitAyam.findAll.mockResolvedValue([
      { id: 't1', penanganan: 'Isolasi kandang' },
      { id: 't2', penanganan: 'Bersihkan kandang' },
    ]);

    // When: endpoint diagnosa dipanggil
    const res = await request(app)
      .post('/api/farm/penyakit-ayam/diagnosa')
      .send({ gejala: [{ id: 'g1' }, { id: 'g2' }] });

    // Then: response harus bawa hasil diagnosis dan penanganan
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Diagnosis berhasil');
    expect(res.body.gejala_dipilih).toBe(2);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        id: 'penyakit-1',
        nama: 'Penyakit A',
        gejala_terdeteksi: ['Batuk', 'Lemas'],
        penanganan: [
          { id: 't1', penanganan: 'Isolasi kandang' },
          { id: 't2', penanganan: 'Bersihkan kandang' },
        ],
      })
    );
    expect(diagnosePenyakit).toHaveBeenCalledTimes(1);
    expect(sequelize.Gejala.findAll).toHaveBeenCalledTimes(1);
    expect(sequelize.PenyakitGejala.findAll).toHaveBeenCalledTimes(1);
    expect(sequelize.PenangananPenyakitAyam.findAll).toHaveBeenCalledTimes(1);
  });
});