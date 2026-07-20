const request = require('supertest');
const express = require('express');
const { Op } = require('sequelize');

jest.mock('../../../model/index', () => {
  const ActualOpFromSequelizeLib = require('sequelize').Op;
  const defaultMockTransaction = { commit: jest.fn(), rollback: jest.fn() };

  const createMockModel = (name) => ({
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
    save: jest.fn(async function() { return this; }),
    decrement: jest.fn(),
  });

  const moduleExports = {
    Laporan: createMockModel('Laporan'),
    UnitBudidaya: createMockModel('UnitBudidaya'),
    ObjekBudidaya: createMockModel('ObjekBudidaya'),
    HarianKebun: createMockModel('HarianKebun'),
    HarianTernak: createMockModel('HarianTernak'),
    Sakit: createMockModel('Sakit'),
    Gejala: createMockModel('Gejala'),
    DaftarGejala: createMockModel('DaftarGejala'),
    Kematian: createMockModel('Kematian'),
    Vitamin: createMockModel('Vitamin'),
    PanenKebun: createMockModel('PanenKebun'),
    PanenRincianGrade: createMockModel('PanenRincianGrade'),
    Panen: createMockModel('Panen'),
    DetailPanen: createMockModel('DetailPanen'),
    Hama: createMockModel('Hama'),
    PenggunaanInventaris: createMockModel('PenggunaanInventaris'),
    Inventaris: createMockModel('Inventaris'),
    Komoditas: createMockModel('Komoditas'),

    sequelize: {
      transaction: jest.fn(() => defaultMockTransaction),
      query: jest.fn(),
    },
    Sequelize: {
      Op: ActualOpFromSequelizeLib,
      QueryTypes: { SELECT: 'SELECT' },
    },

    __esModule: true,
    default: {
      Laporan: createMockModel('Laporan'),
      UnitBudidaya: createMockModel('UnitBudidaya'),
      ObjekBudidaya: createMockModel('ObjekBudidaya'),
      HarianKebun: createMockModel('HarianKebun'),
      HarianTernak: createMockModel('HarianTernak'),
      Sakit: createMockModel('Sakit'),
      Gejala: createMockModel('Gejala'),
      DaftarGejala: createMockModel('DaftarGejala'),
      Kematian: createMockModel('Kematian'),
      Vitamin: createMockModel('Vitamin'),
      PanenKebun: createMockModel('PanenKebun'),
      PanenRincianGrade: createMockModel('PanenRincianGrade'),
      Panen: createMockModel('Panen'),
      DetailPanen: createMockModel('DetailPanen'),
      Hama: createMockModel('Hama'),
      PenggunaanInventaris: createMockModel('PenggunaanInventaris'),
      Inventaris: createMockModel('Inventaris'),
      Komoditas: createMockModel('Komoditas'),
      sequelize: {
        transaction: jest.fn(() => defaultMockTransaction),
        query: jest.fn(),
      },
      Sequelize: {
        Op: ActualOpFromSequelizeLib,
        QueryTypes: { SELECT: 'SELECT' },
      },
    }
  };
  return moduleExports;
});

const laporanController = require('../../../controller/farm/laporan');
const originalSequelize = require('../../../model/index');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.user = { id: 'mockUserId123' };
  res.locals = {};
  next();
});

app.post('/laporan/harian-kebun', laporanController.createLaporanHarianKebun);
app.post('/laporan/harian-ternak', laporanController.createLaporanHarianTernak);
app.post('/laporan/kematian', laporanController.createLaporanKematian);
app.post('/laporan/vitamin', laporanController.createLaporanVitamin);
app.post('/laporan/panen', laporanController.createLaporanPanen);
app.post('/laporan/panen-simple', laporanController.createLaporanPanenSimple);
app.post('/laporan/panen-kebun', laporanController.createLaporanPanenKebun);
app.post('/laporan/hama', laporanController.createLaporanHama);
app.post('/laporan/penggunaan-inventaris', laporanController.createLaporanPenggunaanInventaris);
app.get('/laporan/ayam-tidak-bertelur', laporanController.getAyamTidakBertelur);
app.post('/laporan/sakit-tanpa-diagnosa', laporanController.createLaporanSakitTanpaDiagnosa);


describe('Laporan Controller', () => {
  let mockTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

    originalSequelize.sequelize.transaction.mockReturnValue(mockTransaction);
    
    if (originalSequelize.default && originalSequelize.default.sequelize && originalSequelize.default.sequelize.transaction) {
        originalSequelize.default.sequelize.transaction.mockReturnValue(mockTransaction);
    }
  });

  const mockDate = new Date();
  const mockDateString = mockDate.toISOString();

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

  describe('POST /laporan/harian-kebun', () => {
    const endpoint = '/laporan/harian-kebun';
    const requestBody = {
      judul: 'Laporan Harian Kebun Kangkung',
      catatan: 'Semua baik',
      objekBudidayaId: 'objBud1',
      unitBudidayaId: 'unitBud1',
      tipe: 'harian kebun',
      harianKebun: {
        penyiraman: true, pruning: false, repotting: false,
        tinggiTanaman: 15, kondisiDaun: 'Baik', statusTumbuh: 'Optimal',
      },
    };

    it('should create laporan harian kebun successfully and return 201', async () => {
      const mockLaporanInstance = {
        id: 'laporan123', ...requestBody, UserId: 'mockUserId123',
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        toJSON: function() { return createPlainVersion(this); }
      };
      const mockHarianKebunInstance = {
        id: 'harianKebun123', LaporanId: 'laporan123', ...requestBody.harianKebun,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        toJSON: function() { return createPlainVersion(this); }
      };

      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.HarianKebun.create.mockResolvedValue(mockHarianKebunInstance);

      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Successfully created new laporan data');
      expect(res.body.data.data).toEqual(mockLaporanInstance.toJSON());
      expect(res.body.data.harian).toEqual(mockHarianKebunInstance.toJSON());

      expect(originalSequelize.sequelize.transaction).toHaveBeenCalledTimes(1);
      expect(originalSequelize.Laporan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          judul: requestBody.judul, UserId: 'mockUserId123', ObjekBudidayaId: requestBody.objekBudidayaId,
        }),
        { transaction: mockTransaction }
      );
      expect(originalSequelize.HarianKebun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          LaporanId: mockLaporanInstance.id, tinggiTanaman: requestBody.harianKebun.tinggiTanaman,
        }),
        { transaction: mockTransaction }
      );
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should return 500 and rollback if Laporan.create fails', async () => {
      originalSequelize.Laporan.create.mockRejectedValue(new Error('Laporan creation failed'));
      const res = await request(app).post(endpoint).send(requestBody);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Laporan creation failed');
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should return 500 and rollback if HarianKebun.create fails', async () => {
      const mockLaporanInstance = { id: 'laporan123', toJSON: () => ({ id: 'laporan123' }) };
      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.HarianKebun.create.mockRejectedValue(new Error('HarianKebun creation failed'));

      const res = await request(app).post(endpoint).send(requestBody);
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('HarianKebun creation failed');
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });


  describe('POST /laporan/panen', () => {
    const endpoint = '/laporan/panen';

    const requestBody = {
      judul: 'Laporan Panen Kandang Layer A',
      catatan: 'Panen pagi',
      unitBudidayaId: 'unitLayerA',
      objekBudidayaId: null,
      tipe: 'panen',
      gambar: 'https://example.com/panen.jpg',
      panen: {
        komoditasId: 'komoditasTelur',
        jumlah: 1000,
        berat: 60,
        rincianGrade: [
          { gradeId: 'gradeA', jumlah: 700, berat: 42 },
          { gradeId: 'gradeB', berat: 18 },
        ],
      },
      detailPanen: [],
    };
    const eggPanenConfig = {
      tipePanen: 'telur',
      modePanen: 'produksi',
      jumlah: {
        enabled: true,
        required: true,
        label: 'Jumlah panen',
        satuan: 'butir',
        integerOnly: true,
      },
      berat: {
        enabled: true,
        required: true,
        label: 'Berat panen',
        satuan: 'kilogram',
        integerOnly: false,
      },
      jumlahHewan: {
        enabled: false,
        required: false,
        label: 'Jumlah hewan',
        satuan: 'ekor',
        integerOnly: true,
        defaultValue: 0,
      },
      grade: {
        enabled: true,
        required: false,
        allowedFields: ['jumlah', 'berat'],
        validateTotalJumlah: true,
        validateTotalBerat: true,
      },
    };

    it('should create laporan panen with mandatory egg count and weight', async () => {
      const mockLaporanInstance = {
        id: 'laporanPanen123',
        ...requestBody,
        UserId: 'mockUserId123',
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockPanenInstance = {
        id: 'panen123',
        LaporanId: 'laporanPanen123',
        komoditasId: requestBody.panen.komoditasId,
        jumlah: requestBody.panen.jumlah,
        berat: requestBody.panen.berat,
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockKomoditasInstance = {
        id: 'komoditasTelur',
        jumlah: 0,
        tipeKomoditas: 'kolektif',
        hapusObjek: false,
        panenConfig: eggPanenConfig,
        save: jest.fn(async function() { return this; }),
      };
      const mockUnitBudidayaInstance = {
        id: 'unitLayerA',
        jumlah: 1000,
        tipe: 'kolektif',
        save: jest.fn(async function() { return this; }),
      };

      originalSequelize.Komoditas.findOne.mockResolvedValue(mockKomoditasInstance);
      originalSequelize.UnitBudidaya.findOne.mockResolvedValue(mockUnitBudidayaInstance);
      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.Panen.create.mockResolvedValue(mockPanenInstance);
      originalSequelize.PanenRincianGrade.bulkCreate.mockResolvedValue([]);

      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(201);
      expect(originalSequelize.Panen.create).toHaveBeenCalledWith(
        expect.objectContaining({
          LaporanId: mockLaporanInstance.id,
          komoditasId: requestBody.panen.komoditasId,
          jumlah: 1000,
          berat: 60,
        }),
        { transaction: mockTransaction }
      );
      expect(originalSequelize.PanenRincianGrade.bulkCreate).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            panenId: mockPanenInstance.id,
            gradeId: 'gradeA',
            jumlah: 700,
            berat: 42,
            persentaseJumlah: 70,
            persentaseBerat: 70,
          }),
          expect.objectContaining({
            panenId: mockPanenInstance.id,
            gradeId: 'gradeB',
            jumlah: null,
            berat: 18,
            persentaseJumlah: null,
            persentaseBerat: 30,
          }),
        ],
        { transaction: mockTransaction }
      );
      expect(mockKomoditasInstance.save).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should reject laporan panen without total weight', async () => {
      const invalidBody = {
        ...requestBody,
        panen: {
          komoditasId: 'komoditasTelur',
          jumlah: 1000,
        },
      };
      const mockKomoditasInstance = {
        id: 'komoditasTelur',
        jumlah: 0,
        tipeKomoditas: 'kolektif',
        hapusObjek: false,
        panenConfig: eggPanenConfig,
        save: jest.fn(async function() { return this; }),
      };

      originalSequelize.Komoditas.findOne.mockResolvedValue(mockKomoditasInstance);

      const res = await request(app).post(endpoint).send(invalidBody);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Berat panen wajib diisi sebagai angka kilogram lebih dari 0.');
      expect(originalSequelize.Panen.create).not.toHaveBeenCalled();
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    it('should create DetailPanen records when unitBudidaya.tipe is "individu" and detailPanen array is provided', async () => {
      const mockLaporanInstance = {
        id: 'laporanPanen123',
        ...requestBody,
        UserId: 'mockUserId123',
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockPanenInstance = {
        id: 'panen123',
        LaporanId: 'laporanPanen123',
        komoditasId: requestBody.panen.komoditasId,
        jumlah: requestBody.panen.jumlah,
        berat: requestBody.panen.berat,
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockKomoditasInstance = {
        id: 'komoditasTelur',
        jumlah: 0,
        tipeKomoditas: 'kolektif',
        hapusObjek: true,
        panenConfig: eggPanenConfig,
        save: jest.fn(async function() { return this; }),
      };
      const mockUnitBudidayaInstance = {
        id: 'unitLayerA',
        jumlah: 1000,
        tipe: 'individu',
        save: jest.fn(async function() { return this; }),
      };

      originalSequelize.Komoditas.findOne.mockResolvedValue(mockKomoditasInstance);
      originalSequelize.UnitBudidaya.findOne.mockResolvedValue(mockUnitBudidayaInstance);
      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.Panen.create.mockResolvedValue(mockPanenInstance);
      originalSequelize.PanenRincianGrade.bulkCreate.mockResolvedValue([]);
      originalSequelize.ObjekBudidaya.findAll.mockResolvedValue([
        { id: 'ayam-uuid-1' },
        { id: 'ayam-uuid-2' },
      ]);
      originalSequelize.DetailPanen.create.mockResolvedValue({});
      originalSequelize.ObjekBudidaya.update.mockResolvedValue([1]);

      const testRequestBody = {
        ...requestBody,
        detailPanen: ['ayam-uuid-1', 'ayam-uuid-2'],
      };

      const res = await request(app).post(endpoint).send(testRequestBody);

      expect(res.statusCode).toBe(201);
      expect(originalSequelize.DetailPanen.create).toHaveBeenCalledTimes(2);
      expect(originalSequelize.ObjekBudidaya.update).toHaveBeenCalledTimes(2);
      expect(originalSequelize.UnitBudidaya.decrement).toHaveBeenCalledTimes(2);
    });
  });

  describe('POST /laporan/panen-simple', () => {
    const endpoint = '/laporan/panen-simple';
    const requestBody = {
      judul: 'Laporan Panen Simple',
      unitBudidayaId: 'unitLayerA',
      objekBudidayaId: null,
      tipe: 'panen',
      panen: {
        komoditasId: 'komoditasTelur',
        jumlah: 1000,
        berat: 60,
      },
      detailPanen: ['ayam-uuid-1', 'ayam-uuid-2'],
    };
    const eggPanenConfig = {
      tipePanen: 'telur',
      modePanen: 'produksi',
      jumlah: { enabled: true, required: true, label: 'Jumlah panen', satuan: 'butir', integerOnly: true },
      berat: { enabled: true, required: true, label: 'Berat panen', satuan: 'kilogram', integerOnly: false },
      jumlahHewan: { enabled: false, required: false, label: 'Jumlah hewan', satuan: 'ekor', integerOnly: true, defaultValue: 0 },
      grade: { enabled: false },
    };

    it('should create simple laporan panen and detailPanen records successfully', async () => {
      const mockLaporanInstance = {
        id: 'laporanPanen123',
        ...requestBody,
        UserId: 'mockUserId123',
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockPanenInstance = {
        id: 'panen123',
        LaporanId: 'laporanPanen123',
        komoditasId: requestBody.panen.komoditasId,
        jumlah: requestBody.panen.jumlah,
        berat: requestBody.panen.berat,
        toJSON: function() { return createPlainVersion(this); },
      };
      const mockKomoditasInstance = {
        id: 'komoditasTelur',
        jumlah: 0,
        tipeKomoditas: 'kolektif',
        hapusObjek: true,
        panenConfig: eggPanenConfig,
        save: jest.fn(async function() { return this; }),
      };
      const mockUnitBudidayaInstance = {
        id: 'unitLayerA',
        jumlah: 1000,
        tipe: 'individu',
        save: jest.fn(async function() { return this; }),
      };

      originalSequelize.Komoditas.findOne.mockResolvedValue(mockKomoditasInstance);
      originalSequelize.UnitBudidaya.findOne.mockResolvedValue(mockUnitBudidayaInstance);
      originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
      originalSequelize.Panen.create.mockResolvedValue(mockPanenInstance);
      originalSequelize.ObjekBudidaya.findAll.mockResolvedValue([
        { id: 'ayam-uuid-1' },
        { id: 'ayam-uuid-2' },
      ]);
      originalSequelize.DetailPanen.create.mockResolvedValue({});
      originalSequelize.ObjekBudidaya.update.mockResolvedValue([1]);

      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(201);
      expect(originalSequelize.DetailPanen.create).toHaveBeenCalledTimes(2);
      expect(originalSequelize.ObjekBudidaya.update).toHaveBeenCalledTimes(2);
      expect(originalSequelize.UnitBudidaya.decrement).toHaveBeenCalledTimes(2);
      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });


  describe('POST /laporan/kematian', () => {
    const endpoint = '/laporan/kematian';
    const baseRequestBody = {
        judul: 'Laporan Kematian Ayam', catatan: 'Mati mendadak',
        objekBudidayaId: 'objBudTernak1', unitBudidayaId: 'unitBudTernak1',
        tipe: 'kematian', kematian: { tanggal: mockDateString, penyebab: 'Sakit' },
    };
    let mockUnitBudidayaInstance;

    beforeEach(() => {
        mockUnitBudidayaInstance = {
            id: 'unitBudTernak1', jumlah: 10, tipe: 'koloni',
            update: jest.fn(async function(payload) {
                this.jumlah = payload.jumlah !== undefined ? payload.jumlah : this.jumlah;
                return this;
            }),
            toJSON: function() { return createPlainVersion(this); }
        };
        originalSequelize.UnitBudidaya.findOne.mockResolvedValue(mockUnitBudidayaInstance);
        originalSequelize.ObjekBudidaya.update.mockResolvedValue([1]);
        originalSequelize.ObjekBudidaya.findOne.mockResolvedValue({ id: 'objBudTernak1', isDeleted: false, toJSON: function() { return createPlainVersion(this); }});
    });

    it('should create laporan kematian (jumlah provided) and return 201', async () => {
        const requestBody = { ...baseRequestBody, jumlah: 2 };
        const mockLaporanInstance = { id: 'laporanKematian1', ...requestBody, UserId: 'mockUserId123', toJSON: function() { return createPlainVersion(this); } };
        const mockKematianInstance = { id: 'kematianRec1', LaporanId: 'laporanKematian1', ...requestBody.kematian, toJSON: function() { return createPlainVersion(this); } };

        originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
        originalSequelize.Kematian.create.mockResolvedValue(mockKematianInstance);

        const res = await request(app).post(endpoint).send(requestBody);

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toBe('Successfully created new laporan data');
        expect(mockUnitBudidayaInstance.update).toHaveBeenCalledWith(
            { jumlah: 8 }, { transaction: mockTransaction }
        );
        expect(originalSequelize.Laporan.create).toHaveBeenCalledTimes(requestBody.jumlah);
        expect(originalSequelize.Kematian.create).toHaveBeenCalledTimes(requestBody.jumlah);
        expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle kematian for tipe "individu" unit, soft deleting ObjekBudidaya', async () => {
        mockUnitBudidayaInstance.tipe = 'individu';
        mockUnitBudidayaInstance.jumlah = 1;
        const requestBody = { ...baseRequestBody, objekBudidayaId: 'objIndividu1' };

        const mockLaporanInstance = { id: 'laporanIndKematian', ...requestBody, UserId: 'mockUserId123', toJSON: function() { return createPlainVersion(this); } };
        const mockKematianInstance = { id: 'kematianIndRec', LaporanId: 'laporanIndKematian', ...requestBody.kematian, toJSON: function() { return createPlainVersion(this); } };

        originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
        originalSequelize.Kematian.create.mockResolvedValue(mockKematianInstance);

        await request(app).post(endpoint).send(requestBody);

        expect(originalSequelize.ObjekBudidaya.update).toHaveBeenCalledWith(
            { isDeleted: true }, { transaction: mockTransaction, where: { id: 'objIndividu1' } }
        );
        expect(mockUnitBudidayaInstance.update).toHaveBeenCalledWith(
            { jumlah: 0 }, { transaction: mockTransaction }
        );
        expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });
  });


  describe('POST /laporan/vitamin', () => {
    const endpoint = '/laporan/vitamin';
    const requestBody = {
        judul: 'Laporan Vitamin Ayam', catatan: 'Dosis rutin',
        objekBudidayaId: 'objBudTernakVit1', unitBudidayaId: 'unitBudTernakVit1',
        tipe: 'vitamin',
        vitamin: { inventarisId: 'invVit123', tipe: 'Suplemen', jumlah: 5, },
    };
    let mockInventarisInstance;

    beforeEach(() => {
        mockInventarisInstance = {
            id: 'invVit123', nama: 'Vitamin Super', jumlah: 20,
            save: jest.fn(async function() { return this; }),
            toJSON: function() { return createPlainVersion(this); }
        };
        originalSequelize.Inventaris.findOne.mockResolvedValue(mockInventarisInstance);
    });

    it('should create laporan vitamin, update inventaris stock, and return 201', async () => {
        const mockLaporanInstance = { id: 'laporanVit1', ...requestBody, UserId: 'mockUserId123', toJSON: function() { return createPlainVersion(this); } };
        const mockVitaminRecInstance = { id: 'vitRec1', LaporanId: 'laporanVit1', ...requestBody.vitamin, toJSON: function() { return createPlainVersion(this); } };

        originalSequelize.Laporan.create.mockResolvedValue(mockLaporanInstance);
        originalSequelize.Vitamin.create.mockResolvedValue(mockVitaminRecInstance);

        const res = await request(app).post(endpoint).send(requestBody);

        expect(res.statusCode).toBe(201);
        expect(res.body.data.laporanVitamin.jumlah).toBe(5);
        expect(mockInventarisInstance.jumlah).toBe(15);
        expect(mockInventarisInstance.save).toHaveBeenCalledWith({ transaction: mockTransaction });
        expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if vitamin jumlah is invalid', async () => {
        const invalidBody = { ...requestBody, vitamin: { ...requestBody.vitamin, jumlah: 0 } };
        const res = await request(app).post(endpoint).send(invalidBody);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Jumlah penggunaan vitamin tidak valid atau harus lebih besar dari 0.");
        expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if inventaris stock is insufficient', async () => {
        mockInventarisInstance.jumlah = 3;
        originalSequelize.Inventaris.findOne.mockResolvedValue(mockInventarisInstance);
        const res = await request(app).post(endpoint).send(requestBody);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toContain("Stok inventaris (vitamin) \"Vitamin Super\" tidak mencukupi.");
        expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });

     it('should return 404 if inventaris not found', async () => {
        originalSequelize.Inventaris.findOne.mockResolvedValue(null);
        const res = await request(app).post(endpoint).send(requestBody);
        expect(res.statusCode).toBe(404);
        expect(res.body.message).toContain("Inventaris (vitamin) dengan ID invVit123 tidak ditemukan.");
        expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /laporan/ayam-tidak-bertelur', () => {
    const endpoint = '/laporan/ayam-tidak-bertelur';

    it('should return 400 if unitBudidayaId is missing', async () => {
      const res = await request(app).get(endpoint);
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toBe("unitBudidayaId wajib diisi");
    });

    it('should successfully filter chickens that did not lay eggs', async () => {
      const mockAllAyam = [
        { id: 'ayam1', namaId: 'A1', isDeleted: false },
        { id: 'ayam2', namaId: 'A2', isDeleted: false },
        { id: 'ayam3', namaId: 'A3', isDeleted: false },
      ];

      const mockDetailPanen = [
        {
          objekBudidayaId: 'ayam1',
        }
      ];

      originalSequelize.UnitBudidaya.findOne.mockResolvedValue({
        id: 'unit1',
        nama: 'Kandang A',
        tipe: 'individu',
        jumlah: 3,
      });
      originalSequelize.ObjekBudidaya.findAll.mockResolvedValue(mockAllAyam);
      originalSequelize.sequelize.query
        .mockResolvedValueOnce(mockDetailPanen)
        .mockResolvedValueOnce([
          {
            tanggal: '2026-07-20',
            layingChickenCount: 1,
            totalEggCount: 1,
          },
        ]);

      const res = await request(app)
        .get(endpoint)
        .query({ unitBudidayaId: 'unit1' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe(true);
      expect(res.body.data).toHaveLength(2); // ayam2 and ayam3 did not lay eggs
      expect(res.body.data.map(d => d.id)).toEqual(['ayam2', 'ayam3']);
      expect(originalSequelize.ObjekBudidaya.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            UnitBudidayaId: 'unit1',
            isDeleted: false,
          }
        })
      );
    });

    it('should return 500 on database error', async () => {
      originalSequelize.UnitBudidaya.findOne.mockRejectedValue(new Error('DB error'));
      const res = await request(app)
        .get(endpoint)
        .query({ unitBudidayaId: 'unit1' });

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toBe('DB error');
    });
  });

  describe('POST /laporan/sakit-tanpa-diagnosa', () => {
    const endpoint = '/laporan/sakit-tanpa-diagnosa';
    const requestBody = {
      unitBudidayaId: 'unit123',
      objekBudidayaId: 'obj123',
      tipe: 'sakit',
      judul: 'Laporan Sakit A',
      gambar: 'http://example.com/image.jpg',
      catatan: 'Ayam lemas sekali',
      sakit: {
        penyakit: 'Flu Burung Gejala Ringan'
      }
    };

    it('should create new laporan sakit tanpa diagnosa successfully', async () => {
      const mockLaporan = { id: 'lap123', ...requestBody };
      const mockSakit = { id: 'sakit123', LaporanId: 'lap123', diagnosisPenyakit: null, status: 'Belum Ditangani' };
      const mockGejala = {
        id: 'gej123',
        nama_gejala: 'Flu Burung Gejala Ringan',
        gambar: requestBody.gambar,
        destroy: jest.fn(),
      };
      const mockDaftarGejala = { id: 'dg123', sakitId: 'sakit123', gejalaId: 'gej123', catatan: requestBody.catatan };

      originalSequelize.Laporan.create.mockResolvedValue(mockLaporan);
      originalSequelize.Sakit.create.mockResolvedValue(mockSakit);
      originalSequelize.Gejala.create.mockResolvedValue(mockGejala);
      originalSequelize.DaftarGejala.create.mockResolvedValue(mockDaftarGejala);

      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe(true);
      expect(res.body.data.laporanSakit.diagnosisPenyakit).toBeNull();
      expect(originalSequelize.Sakit.create).toHaveBeenCalledWith(
        expect.objectContaining({
          diagnosisPenyakit: null,
          status: 'Belum Ditangani',
        }),
        expect.objectContaining({
          validate: false,
        })
      );
      expect(originalSequelize.Gejala.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nama_gejala: 'Flu Burung Gejala Ringan',
          gambar: 'http://example.com/image.jpg',
        }),
        expect.any(Object)
      );
    });

    it('should return 400 if sakit.penyakit is missing', async () => {
      const invalidBody = { ...requestBody, sakit: {} };
      const res = await request(app).post(endpoint).send(invalidBody);

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toBe('sakit.penyakit wajib diisi');
    });

    it('should rollback transaction and return 500 on database error', async () => {
      originalSequelize.Laporan.create.mockRejectedValue(new Error('DB creation error'));
      const res = await request(app).post(endpoint).send(requestBody);

      expect(res.statusCode).toBe(500);
      expect(res.body.status).toBe(false);
      expect(res.body.message).toBe('DB creation error');
      expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    });
  });
});
