jest.mock('../../../../../model/index', () => {
  const actualOp = require('sequelize').Op;
  const defaultTransaction = { commit: jest.fn(), rollback: jest.fn() };

  const mockModel = () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  });

  return {
    Laporan: mockModel(),
    Sakit: mockModel(),
    UnitBudidaya: mockModel(),
    ObjekBudidaya: mockModel(),
    HarianKebun: mockModel(),
    HarianTernak: mockModel(),
    Kematian: mockModel(),
    Vitamin: mockModel(),
    PanenKebun: mockModel(),
    PanenRincianGrade: mockModel(),
    Panen: mockModel(),
    Hama: mockModel(),
    PenggunaanInventaris: mockModel(),
    Inventaris: mockModel(),
    Komoditas: mockModel(),
    Grade: mockModel(),
    Produk: mockModel(),
    sequelize: {
      transaction: jest.fn(() => defaultTransaction),
    },
    Sequelize: {
      Op: actualOp,
    },
  };
});

jest.mock('../../../../../middleware/auditTrail', () => () => (req, res, next) => next());

const express = require('express');
const request = require('supertest');
const laporanRouter = require('../../../../../routes/farm/laporan');
const sequelize = require('../../../../../model/index');

describe('Integration: laporan sakit route', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: 'user-1' };
      next();
    });
    app.use('/api/farm/laporan', laporanRouter);
  });

  it('harus create laporan sakit dan laporan sakit child record dengan payload lokal', async () => {
    // Given: payload yang sesuai implementasi controller saat ini
    const requestBody = {
      unitBudidayaId: 'unit-1',
      objekBudidayaId: 'objek-1',
      judul: 'Laporan Sakit Ayam Broiler',
      tipe: 'sakit',
      gambar: 'https://example.com/gambar.jpg',
      catatan: 'Ayam lesu',
      sakit: {
        penyakit: 'Newcastle Disease',
      },
    };

    sequelize.Laporan.create.mockResolvedValue({
      id: 'laporan-1',
      ...requestBody,
    });
    sequelize.Sakit.create.mockResolvedValue({
      id: 'sakit-1',
      LaporanId: 'laporan-1',
      penyakit: 'Newcastle Disease',
    });

    // When: endpoint dipanggil
    const res = await request(app)
      .post('/api/farm/laporan/sakit')
      .send(requestBody);

    // Then: response harus sukses dan menyimpan dua record
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Successfully created new laporan data');
    expect(res.body.data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({ id: 'laporan-1' }),
        laporanSakit: expect.objectContaining({
          id: 'sakit-1',
          penyakit: 'Newcastle Disease',
        }),
      })
    );
    expect(sequelize.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(sequelize.Laporan.create).toHaveBeenCalledTimes(1);
    expect(sequelize.Sakit.create).toHaveBeenCalledTimes(1);
  });

  it('harus rollback kalau Laporan.create gagal', async () => {
    // Given: Laporan.create error
    const requestBody = {
      unitBudidayaId: 'unit-1',
      objekBudidayaId: 'objek-1',
      judul: 'Laporan Sakit Ayam Broiler',
      tipe: 'sakit',
      sakit: {
        penyakit: 'Newcastle Disease',
      },
    };

    const transaction = { commit: jest.fn(), rollback: jest.fn() };
    sequelize.sequelize.transaction.mockResolvedValue(transaction);
    sequelize.Laporan.create.mockRejectedValue(new Error('db insert gagal'));

    // When: endpoint dipanggil
    const res = await request(app)
      .post('/api/farm/laporan/sakit')
      .send(requestBody);

    // Then: server harus balikin 500 dan rollback dipanggil
    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe('db insert gagal');
    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
  });
});