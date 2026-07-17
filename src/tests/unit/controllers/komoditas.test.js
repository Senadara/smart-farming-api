const request = require('supertest');
const express = require('express');
const { Op } = require('sequelize');

jest.mock('../../../model/index', () => {
  const ActualOpFromSequelizeLib = require('sequelize').Op;
  const mockKomoditas = {
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
  };
  const mockJenisBudidaya = {};
  const mockSatuan = {};
  const mockProduk = {
    findOne: jest.fn(),
  };

  return {
    Komoditas: mockKomoditas,
    JenisBudidaya: mockJenisBudidaya,
    Satuan: mockSatuan,
    Produk: mockProduk,
    sequelize: {
      transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
      query: jest.fn(),
    },
    Sequelize: {
      Op: ActualOpFromSequelizeLib,
    },
    __esModule: true,
    default: {
      Komoditas: mockKomoditas,
      JenisBudidaya: mockJenisBudidaya,
      Satuan: mockSatuan,
      Produk: mockProduk,
      sequelize: {
        transaction: jest.fn(() => ({ commit: jest.fn(), rollback: jest.fn() })),
        query: jest.fn(),
      },
      Sequelize: {
        Op: ActualOpFromSequelizeLib,
      },
    }
  };
});

jest.mock('../../../utils/paginationUtils', () => ({
  getPaginationOptions: jest.fn(),
}));

const komoditasController = require('../../../controller/farm/komoditas');
const originalSequelize = require('../../../model/index');
const { getPaginationOptions } = require('../../../utils/paginationUtils');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals = {};
  next();
});

app.get('/komoditas', komoditasController.getAllKomoditas);
app.get('/komoditas/search/:nama/:tipe', komoditasController.getKomoditasSearch);
app.get('/komoditas/tipe/:tipe', komoditasController.getKomoditasByTipe);
app.get('/komoditas/:id', komoditasController.getKomoditasById);
app.post('/komoditas', komoditasController.createKomoditas);
app.put('/komoditas/:id', komoditasController.updateKomoditas);
app.delete('/komoditas/:id', komoditasController.deleteKomoditas);

describe('Komoditas Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockDate = new Date();
  const mockDateString = mockDate.toISOString();

  const mockJenisBudidayaData = { id: 1, nama: 'Sayuran Daun', tipe: 'Hortikultura' };
  const mockSatuanData = { id: 1, nama: 'Kilogram', lambang: 'kg' };

  const createPlainVersion = (instanceData) => {
    if (!instanceData) return null;
    const plain = { ...instanceData };
    delete plain.toJSON;

    if (plain.createdAt && plain.createdAt instanceof Date) {
      plain.createdAt = plain.createdAt.toISOString();
    }
    if (plain.updatedAt && plain.updatedAt instanceof Date) {
      plain.updatedAt = plain.updatedAt.toISOString();
    }

    if (plain.JenisBudidaya) plain.JenisBudidaya = { ...plain.JenisBudidaya };
    if (plain.Satuan) plain.Satuan = { ...plain.Satuan };
    return plain;
  };

  const expectKomoditasWithPanenConfig = (actual, expected) => {
    expect(actual).toEqual(expect.objectContaining(expected));
    expect(actual.panenConfig).toEqual(
      expect.objectContaining({
        tipePanen: 'custom',
        modePanen: 'produksi',
        jumlah: expect.objectContaining({ enabled: true, required: true }),
        berat: expect.objectContaining({ enabled: true, required: false }),
        jumlahHewan: expect.objectContaining({ enabled: false, defaultValue: 0 }),
        grade: expect.objectContaining({
          enabled: true,
          allowedFields: ['jumlah', 'berat'],
        }),
      })
    );
  };

  const expectKomoditasRowsWithPanenConfig = (actualRows, expectedRows) => {
    expect(actualRows).toHaveLength(expectedRows.length);
    actualRows.forEach((row, index) => {
      expectKomoditasWithPanenConfig(row, expectedRows[index]);
    });
  };

  describe('GET /komoditas', () => {
    it('should return 200 and paginated data when found', async () => {
      const rawMockKomoditas = {
        id: 1, nama: 'Kangkung', JenisBudidayaId: 1, SatuanId: 1, isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        JenisBudidaya: mockJenisBudidayaData,
        toJSON: function() { return createPlainVersion(this); }
      };
      const mockDataRows = [rawMockKomoditas];
      const mockCount = 1;

      originalSequelize.Komoditas.findAndCountAll.mockResolvedValue({
        count: mockCount,
        rows: mockDataRows
      });
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });

      const res = await request(app).get('/komoditas?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully retrieved all komoditas data');
      expectKomoditasRowsWithPanenConfig(res.body.data, mockDataRows.map(r => r.toJSON()));
      expect(res.body.totalItems).toBe(mockCount);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.currentPage).toBe(1);
      expect(originalSequelize.Komoditas.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false },
        include: [
          { model: originalSequelize.JenisBudidaya, required: true },
          { model: originalSequelize.Satuan, required: false },
        ],
        order: [['createdAt', 'DESC']],
      }));
    });

    it('should return 200 and "Data not found" if no data on page 1', async () => {
      originalSequelize.Komoditas.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });
      const res = await request(app).get('/komoditas?page=1&limit=10');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Data not found');
      expect(res.body.data).toEqual([]);
    });


    it('should return 500 when findAndCountAll throws an error', async () => {
      const errorMessage = 'DB error';
      originalSequelize.Komoditas.findAndCountAll.mockRejectedValue(new Error(errorMessage));
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });
      const res = await request(app).get('/komoditas');
      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe(errorMessage);
    });
  });

  describe('GET /komoditas/:id', () => {
    it('should return 200 and data when found', async () => {
      const rawMockKomoditas = {
        id: 1, nama: 'Bayam', JenisBudidayaId: 1, SatuanId: 1, isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        JenisBudidaya: mockJenisBudidayaData,
        Satuan: mockSatuanData,
        toJSON: function() { return createPlainVersion(this); }
      };
      originalSequelize.Komoditas.findOne.mockResolvedValue(rawMockKomoditas);

      const res = await request(app).get('/komoditas/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully retrieved komoditas data');
      expectKomoditasWithPanenConfig(res.body.data, rawMockKomoditas.toJSON());
      expect(originalSequelize.Komoditas.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: '1', isDeleted: false },
        include: [
          { model: originalSequelize.Satuan, required: true },
          { model: originalSequelize.JenisBudidaya, required: true },
        ]
      }));
    });

    it('should return 404 if data not found', async () => {
      originalSequelize.Komoditas.findOne.mockResolvedValue(null);
      const res = await request(app).get('/komoditas/99');
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Data not found');
    });
  });

  describe('GET /komoditas/search/:nama/:tipe', () => {
    it('should search by nama and tipe', async () => {
      const rawMockKomoditas = {
        id: 1, nama: 'Kangkung Darat', JenisBudidayaId: 1, isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        JenisBudidaya: { ...mockJenisBudidayaData, tipe: 'Hortikultura' },
        toJSON: function() { return createPlainVersion(this); }
      };
      const mockDataRows = [rawMockKomoditas];
      originalSequelize.Komoditas.findAndCountAll.mockResolvedValue({ count: 1, rows: mockDataRows });
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });

      const res = await request(app).get('/komoditas/search/Kangkung/Hortikultura?page=1');
      expect(res.statusCode).toBe(200);
      expectKomoditasRowsWithPanenConfig(res.body.data, mockDataRows.map(r => r.toJSON()));
      expect(originalSequelize.Komoditas.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false, nama: { [Op.like]: '%Kangkung%' } },
        include: [
          { model: originalSequelize.JenisBudidaya, required: true, where: { tipe: 'Hortikultura' } },
          { model: originalSequelize.Satuan, required: false },
        ],
      }));
    });

    it('should search by nama only if tipe is "all"', async () => {
      originalSequelize.Komoditas.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });
      await request(app).get('/komoditas/search/Kangkung/all?page=1');
      expect(originalSequelize.Komoditas.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false, nama: { [Op.like]: '%Kangkung%' } },
        include: [
          { model: originalSequelize.JenisBudidaya, required: true },
          { model: originalSequelize.Satuan, required: false },
        ],
      }));
    });
    
  });

   describe('GET /komoditas/tipe/:tipe', () => {
    it('should return 200 and paginated data when found by tipe', async () => {
      const rawMockKomoditas = {
        id: 1, nama: 'Selada', JenisBudidayaId: 1, SatuanId: 1, isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        JenisBudidaya: { ...mockJenisBudidayaData, tipe: 'Sayuran' },
        Satuan: mockSatuanData,
        toJSON: function() { return createPlainVersion(this); }
      };
      const mockDataRows = [rawMockKomoditas];
      originalSequelize.Komoditas.findAndCountAll.mockResolvedValue({ count: 1, rows: mockDataRows });
      getPaginationOptions.mockReturnValue({ limit: 10, offset: 0 });

      const res = await request(app).get('/komoditas/tipe/Sayuran?page=1');
      expect(res.statusCode).toBe(200);
      expectKomoditasRowsWithPanenConfig(res.body.data, mockDataRows.map(r => r.toJSON()));
      expect(originalSequelize.Komoditas.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: { isDeleted: false },
        include: [
            { model: originalSequelize.JenisBudidaya, required: true, where: { tipe: 'Sayuran' } },
            { model: originalSequelize.Satuan, required: false },
        ],
      }));
    });
    
  });


  describe('POST /komoditas', () => {
    it('should return 201 when created successfully', async () => {
      const newPayload = { nama: 'Sawi', satuanId: 1, jenisBudidayaId: 1, deskripsi: 'Hijau Segar' };
      const mockCreatedRaw = {
        id: 10, ...newPayload, isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        
      };
      const mockFetchedWithIncludesRaw = {
        ...mockCreatedRaw,
        JenisBudidaya: mockJenisBudidayaData,
        Satuan: mockSatuanData,
        toJSON: function() { return createPlainVersion(this); }
      };

      originalSequelize.Komoditas.create.mockResolvedValue(mockCreatedRaw);
      originalSequelize.Komoditas.findOne.mockResolvedValue(mockFetchedWithIncludesRaw);

      const res = await request(app).post('/komoditas').send(newPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Successfully created new komoditas data');
      expectKomoditasWithPanenConfig(res.body.data, mockFetchedWithIncludesRaw.toJSON());
      expect(originalSequelize.Komoditas.create).toHaveBeenCalledWith({
        ...newPayload,
        satuanId: newPayload.satuanId,
        jenisBudidayaId: newPayload.jenisBudidayaId,
      });
      expect(originalSequelize.Komoditas.findOne).toHaveBeenCalledWith({
        where: { id: mockCreatedRaw.id },
        include: [{ model: originalSequelize.JenisBudidaya }, { model: originalSequelize.Satuan }]
      });
    });
    
  });

  describe('PUT /komoditas/:id', () => {
    const mockId = '1';
    const updatePayload = { nama: 'Sawi Super', deskripsi: 'Lebih Hijau' };

    it('should update and return 200 if data exists', async () => {
      const mockInstance = {
        id: parseInt(mockId), nama: 'Sawi Lama', deskripsi: 'Lama', isDeleted: false,
        createdAt: new Date(mockDateString), updatedAt: new Date(mockDateString),
        JenisBudidayaId: 1, SatuanId: 1,
        update: jest.fn(async function(payload) {
          Object.assign(this, payload);
          this.updatedAt = new Date();
          return this;
        }),
        
      };
      const mockFetchedUpdatedRaw = {
        id: parseInt(mockId), ...updatePayload, isDeleted: false,
        createdAt: mockInstance.createdAt,
        updatedAt: new Date(),
        JenisBudidaya: mockJenisBudidayaData,
        Satuan: mockSatuanData,
        toJSON: function() { return createPlainVersion(this); }
      };

      originalSequelize.Komoditas.findOne.mockResolvedValueOnce(mockInstance);
      
      originalSequelize.Komoditas.findOne.mockResolvedValueOnce(mockFetchedUpdatedRaw);

      const res = await request(app).put(`/komoditas/${mockId}`).send(updatePayload);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully updated komoditas data');
      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining(updatePayload),
        { transaction: expect.any(Object) }
      );
      expect(originalSequelize.Komoditas.findOne).toHaveBeenCalledWith({
         where: { id: mockId },
         include: [{ model: originalSequelize.JenisBudidaya }, { model: originalSequelize.Satuan }]
      });
      expectKomoditasWithPanenConfig(res.body.data, mockFetchedUpdatedRaw.toJSON());
    });
  });

  describe('DELETE /komoditas/:id', () => {
    const mockId = '1';
    it('should soft delete and return 200 if data exists', async () => {
     const mockInstance = {
        id: parseInt(mockId), nama: 'Akan Dihapus', isDeleted: false,
        
        save: jest.fn(async function() {
          this.isDeleted = true;
          return this;
        }),
        toJSON: function() { return createPlainVersion(this); }
      };
      originalSequelize.Komoditas.findOne.mockResolvedValue(mockInstance);

      const res = await request(app).delete(`/komoditas/${mockId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully deleted komoditas data');
      expect(res.body.data).toEqual({ id: mockId });
      expect(mockInstance.isDeleted).toBe(true);
      expect(mockInstance.save).toHaveBeenCalled();
    });
    
  });
});
