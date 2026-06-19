const request = require('supertest');
const express = require('express');

jest.mock('../../../model/index', () => {
  const ActualOpFromSequelizeLib = require('sequelize').Op;
  const defaultMockTransaction = { commit: jest.fn(), rollback: jest.fn() };

  const createMockModel = (name) => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
    save: jest.fn(async function() { return this; }),
  });

  const moduleExports = {
    Laporan: createMockModel('Laporan'),
    UnitBudidaya: createMockModel('UnitBudidaya'),
    ObjekBudidaya: createMockModel('ObjekBudidaya'),
    Sakit: createMockModel('Sakit'),
    Gejala: createMockModel('Gejala'),
    DaftarGejala: createMockModel('DaftarGejala'),

    sequelize: {
      transaction: jest.fn(() => defaultMockTransaction),
    },
    Sequelize: {
      Op: ActualOpFromSequelizeLib,
    },

    __esModule: true,
    default: {
      Laporan: createMockModel('Laporan'),
      UnitBudidaya: createMockModel('UnitBudidaya'),
      ObjekBudidaya: createMockModel('ObjekBudidaya'),
      Sakit: createMockModel('Sakit'),
      Gejala: createMockModel('Gejala'),
      DaftarGejala: createMockModel('DaftarGejala'),
      sequelize: {
        transaction: jest.fn(() => defaultMockTransaction),
      },
      Sequelize: {
        Op: ActualOpFromSequelizeLib,
      },
    }
  };
  return moduleExports;
});

const laporanController = require('../../../controller/farm/laporan');
const reportController = require('../../../controller/farm/report');
const originalSequelize = require('../../../model/index');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 'mockUserId123' };
  res.locals = {};
  next();
});

app.post('/laporan/sakit', laporanController.createLaporanSakit);
app.get('/laporan/sakit/:id', laporanController.getLaporanSakitById);
app.get('/report/sakit/jenis-budidaya/:jenisBudidayaId', reportController.getRiwayatPelaporanSakitPerJenisBudidaya);

describe('Laporan Sakit Controller', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

    originalSequelize.sequelize.transaction.mockReturnValue(mockTransaction);
    
    if (originalSequelize.default && originalSequelize.default.sequelize && originalSequelize.default.sequelize.transaction) {
        originalSequelize.default.sequelize.transaction.mockReturnValue(mockTransaction);
    }
  });

  const createPlainVersion = (instanceData) => {
    if (!instanceData) return null;
    const plain = { ...instanceData };
    delete plain.toJSON;
    if (plain.createdAt && plain.createdAt instanceof Date) plain.createdAt = plain.createdAt.toISOString();
    if (plain.updatedAt && plain.updatedAt instanceof Date) plain.updatedAt = plain.updatedAt.toISOString();
    for (const key in plain) {
        if (typeof plain[key] === 'object' && plain[key] !== null && typeof plain[key].toJSON === 'function') {
            plain[key] = plain[key].toJSON();
        }
    }
    return plain;
  };

  describe('POST /laporan/sakit', () => {
    const endpoint = '/laporan/sakit';
    const requestBody = {
      judul: 'Ayam Sakit',
      catatan: 'Ayam lemas',
      objekBudidayaId: 'objBudTernak1',
      unitBudidayaId: 'unitBudTernak1',
      tipe: 'sakit',
      sakit: {
        diagnosisPenyakit: 'Flu Burung',
        status: 'Belum Diobati',
        gejala1: 'Mata sayu',
        gejala2: 'Napas berbunyi',
        gejala3: 'Nafsu makan turun',
        gejala4: '-',
        catatan: 'Catatan tambahan gejala'
      }
    };

    it('should create laporan sakit successfully and return 201', async () => {
      const mockLaporanInstance = { id: 'laporanSakit1', ...requestBody, UserId: 'mockUserId123', toJSON: function() { return createPlainVersion(this); } };
      const mockSakitInstance = { id: 'sakitRec1', LaporanId: 'laporanSakit1', diagnosisPenyakit: requestBody.sakit.diagnosisPenyakit, status: requestBody.sakit.status, toJSON: function() { return createPlainVersion(this); } };
      const mockGejalaInstance = { id: 'gejalaRec1', gejala1: requestBody.sakit.gejala1, gejala2: requestBody.sakit.gejala2, gejala3: requestBody.sakit.gejala3, gejala4: requestBody.sakit.gejala4, toJSON: function() { return createPlainVersion(this); } };
      const mockDaftarGejalaInstance = { id: 'daftarGejala1', sakitId: 'sakitRec1', gejalaId: 'gejalaRec1', catatan: requestBody.sakit.catatan, toJSON: function() { return createPlainVersion(this); } };

      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.Sakit.create.mockResolvedValue(mockSakitInstance);
      originalSequelize.Gejala.create.mockResolvedValue(mockGejalaInstance);
      originalSequelize.DaftarGejala.create.mockResolvedValue(mockDaftarGejalaInstance);

      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Successfully created new laporan data');
      expect(originalSequelize.Laporan.create).toHaveBeenCalledTimes(1);
      expect(originalSequelize.Sakit.create).toHaveBeenCalledTimes(1);
      expect(originalSequelize.Gejala.create).toHaveBeenCalledTimes(1);
      expect(originalSequelize.DaftarGejala.create).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should return 500 and rollback if Laporan.create fails', async () => {
      originalSequelize.Laporan.create.mockRejectedValue(new Error('Laporan creation failed'));
      const res = await request(app).post(endpoint).send(requestBody);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Laporan creation failed');
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /laporan/sakit/:id', () => {
    const endpoint = '/laporan/sakit/sakit123';

    it('should return laporan sakit by id', async () => {
      const mockData = {
        id: 'sakit123',
        nama: 'Flu Burung',
        status: 'Belum Diobati',
        Laporan: { gambar: 'gambar.jpg' },
        DaftarGejalas: [],
        toJSON: function() { return { id: this.id, nama: this.nama, status: this.status, Laporan: this.Laporan, DaftarGejalas: this.DaftarGejalas }; }
      };
      
      originalSequelize.Sakit.findOne.mockResolvedValue(mockData);

      const res = await request(app).get(endpoint);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully retrieved sakit data');
      expect(res.body.data.gambar).toBe('gambar.jpg');
      expect(originalSequelize.Sakit.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sakit123', isDeleted: false }
      }));
    });

    it('should return 404 if not found', async () => {
      originalSequelize.Sakit.findOne.mockResolvedValue(null);
      const res = await request(app).get(endpoint);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Data Sakit not found');
    });

    it('should return 500 if an error occurs', async () => {
      originalSequelize.Sakit.findOne.mockRejectedValue(new Error('Database error'));
      const res = await request(app).get(endpoint);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Database error');
    });
  });

  describe('GET /report/sakit/jenis-budidaya/:jenisBudidayaId', () => {
    const endpoint = '/report/sakit/jenis-budidaya/jenisBudidaya123';

    it('should return riwayat pelaporan sakit successfully', async () => {
      const mockData = {
        count: 1,
        rows: [
          {
            id: 'sakit123',
            diagnosisPenyakit: 'Flu Burung',
            status: 'Dioabati',
            createdAt: new Date().toISOString(),
            laporanId: 'laporan123',
            Laporan: {
              id: 'laporan123',
              judul: 'Ayam lemas',
              gambar: 'gambar.jpg',
              catatan: 'Segera obati',
              createdAt: new Date().toISOString(),
              objekBudidayaId: 'obj1'
            },
            DaftarGejalas: [
              {
                id: 'dg1',
                Gejala: {
                  gejala1: 'Mata sayu',
                  gejala2: 'Napas berbunyi',
                  gejala3: '',
                  gejala4: '-'
                }
              }
            ]
          }
        ]
      };

      originalSequelize.Sakit.findAndCountAll.mockResolvedValue(mockData);

      const res = await request(app).get(endpoint).query({ page: 1, limit: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.message).toBe('Riwayat pelaporan sakit berhasil diambil.');
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].gejala).toEqual(['Mata sayu', 'Napas berbunyi']);
      expect(res.body.pagination.totalItems).toBe(1);
      expect(originalSequelize.Sakit.findAndCountAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty riwayat successfully', async () => {
      originalSequelize.Sakit.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const res = await request(app).get(endpoint);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data.length).toBe(0);
      expect(res.body.pagination.totalItems).toBe(0);
    });

    it('should return 500 if an error occurs', async () => {
      originalSequelize.Sakit.findAndCountAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get(endpoint);

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toBe('Gagal mengambil riwayat.');
    });
  });
});
