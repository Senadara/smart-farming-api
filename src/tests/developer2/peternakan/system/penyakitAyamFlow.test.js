jest.mock('../../../../model/index', () => {
  const actualOp = require('sequelize').Op;

  const mockState = {
    gejala: [],
    penyakitAyam: [],
    penyakitGejala: [],
    penanganan: [],
    laporan: [],
    laporanGejala: [],
    sakit: [],
    cfLogs: [],
  };

  const createRelasiRecord = (payload) => ({
    ...payload,
    update: jest.fn(async function update(nextValues) {
      Object.assign(this, nextValues);
      return this;
    }),
  });

  const createModel = () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    bulkCreate: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  });

  const Gejala = createModel();
  const PenyakitAyam = createModel();
  const PenyakitGejala = createModel();
  const PenangananPenyakitAyam = createModel();
  const Laporan = createModel();
  const LaporanGejala = createModel();
  const Sakit = createModel();
  const CfWeightLog = createModel();

  Gejala.findAll.mockImplementation(async ({ where } = {}) => {
    if (!where || !where.id) {
      return mockState.gejala;
    }

    const ids = Array.isArray(where.id) ? where.id : [where.id];
    return mockState.gejala.filter((item) => ids.includes(item.id));
  });

  PenyakitAyam.create.mockImplementation(async (payload) => {
    const record = { ...payload };
    mockState.penyakitAyam.push(record);
    return record;
  });

  PenyakitAyam.findByPk.mockImplementation(async (id) => {
    const penyakit = mockState.penyakitAyam.find((item) => item.id === id);

    if (!penyakit) {
      return null;
    }

    const relasi = mockState.penyakitGejala
      .filter((item) => item.penyakit_id === id)
      .map((item) => ({
        ...item,
        gejala: mockState.gejala.find((gejala) => gejala.id === item.gejala_id) || null,
      }));

    return {
      ...penyakit,
      penyakitGejala: relasi,
    };
  });

  PenyakitGejala.bulkCreate.mockImplementation(async (rows) => {
    const created = rows.map((row) => createRelasiRecord({ ...row }));
    mockState.penyakitGejala.push(...created);
    return created;
  });

  PenyakitGejala.findAll.mockImplementation(async ({ where } = {}) => {
    if (!where || !where.penyakit_id) {
      return mockState.penyakitGejala;
    }

    return mockState.penyakitGejala.filter((item) => item.penyakit_id === where.penyakit_id);
  });

  PenangananPenyakitAyam.create.mockImplementation(async (payload) => {
    const record = { ...payload };
    mockState.penanganan.push(record);
    return record;
  });

  PenangananPenyakitAyam.findAll.mockImplementation(async ({ where } = {}) => {
    if (!where || !where.id) {
      return mockState.penanganan;
    }

    if (where.id && where.id[actualOp.in]) {
      const ids = where.id[actualOp.in];
      return mockState.penanganan.filter((item) => ids.includes(item.id));
    }

    const ids = Array.isArray(where.id) ? where.id : [where.id];
    return mockState.penanganan.filter((item) => ids.includes(item.id));
  });

  Laporan.create.mockImplementation(async (payload) => {
    const record = {
      id: payload.id || `laporan-${mockState.laporan.length + 1}`,
      ...payload,
    };
    mockState.laporan.push(record);
    return record;
  });

  LaporanGejala.bulkCreate.mockImplementation(async (rows) => {
    const created = rows.map((row) => ({ ...row }));
    mockState.laporanGejala.push(...created);
    return created;
  });

  Sakit.create.mockImplementation(async (payload) => {
    const record = { ...payload };
    mockState.sakit.push(record);
    return record;
  });

  CfWeightLog.create.mockImplementation(async (payload) => {
    const record = { ...payload };
    mockState.cfLogs.push(record);
    return record;
  });

  const mockDatabase = {
    Gejala,
    PenyakitAyam,
    PenyakitGejala,
    PenangananPenyakitAyam,
    Laporan,
    LaporanGejala,
    Sakit,
    CfWeightLog,
    sequelize: {
      transaction: jest.fn(),
    },
    Sequelize: {
      Op: actualOp,
    },
    __mockState: mockState,
  };

  return mockDatabase;
});

const express = require('express');
const request = require('supertest');
const penyakitAyamRouter = require('../../../../routes/farm/penyakitAyam');
const sequelize = require('../../../../model/index');

describe('System flow: penyakit ayam', () => {
  let app;
  let mockTransaction;
  const mockState = sequelize.__mockState;

  const resetState = () => {
    mockState.gejala = [
      { id: 'g1', nama_gejala: 'Batuk' },
      { id: 'g2', nama_gejala: 'Lemas' },
      { id: 'g3', nama_gejala: 'Nafsu makan turun' },
    ];
    mockState.penyakitAyam = [];
    mockState.penyakitGejala = [];
    mockState.penanganan = [];
    mockState.laporan = [];
    mockState.laporanGejala = [];
    mockState.sakit = [];
    mockState.cfLogs = [];
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resetState();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.sequelize.transaction.mockResolvedValue(mockTransaction);

    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.user = { id: 'user-1' };
      next();
    });
    app.use('/api/farm/penyakit-ayam', penyakitAyamRouter);
  });

  it('harus menjalankan alur lengkap create penyakit, penanganan, dan laporan penyakit', async () => {
    const createPenyakitBody = {
      nama_penyakit: 'Newcastle Disease',
      gejala_ids: ['g1', 'g2'],
      metode: 'idf',
    };

    const createPenyakitRes = await request(app)
      .post('/api/farm/penyakit-ayam')
      .send(createPenyakitBody);

    expect(createPenyakitRes.statusCode).toBe(201);
    expect(createPenyakitRes.body.message).toBe('Penyakit berhasil ditambahkan dan bobot CF otomatis dihitung ulang');
    expect(createPenyakitRes.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        nama_penyakit: 'Newcastle Disease',
        penyakitGejala: expect.any(Array),
      })
    );
    expect(createPenyakitRes.body.data.penyakitGejala).toHaveLength(2);
    expect(sequelize.PenyakitAyam.create).toHaveBeenCalledTimes(1);
    expect(sequelize.PenyakitGejala.bulkCreate).toHaveBeenCalledTimes(1);
    expect(sequelize.CfWeightLog.create).toHaveBeenCalledTimes(2);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);

    const penyakitId = createPenyakitRes.body.data.id;

    const createPenangananRes = await request(app)
      .post('/api/farm/penyakit-ayam/penanganan')
      .send({
        id_penyakit: penyakitId,
        catatan: 'Isolasi kandang dan sanitasi menyeluruh',
        gambar: 'https://example.com/penanganan.jpg',
      });

    expect(createPenangananRes.statusCode).toBe(201);
    expect(createPenangananRes.body.message).toBe('Penanganan penyakit berhasil dibuat');
    expect(createPenangananRes.body.data.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        penyakit_id: penyakitId,
        penanganan: 'Isolasi kandang dan sanitasi menyeluruh',
      })
    );
    expect(sequelize.PenangananPenyakitAyam.create).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(2);

    const relasiSetelahPenanganan = await sequelize.PenyakitGejala.findAll({
      where: { penyakit_id: penyakitId },
    });
    expect(relasiSetelahPenanganan).toHaveLength(2);
    expect(relasiSetelahPenanganan.every((item) => item.penanganan_id === createPenangananRes.body.data.data.id)).toBe(true);

    const createLaporanRes = await request(app)
      .post('/api/farm/penyakit-ayam/laporan')
      .send({
        unitBudidayaId: 'unit-1',
        objekBudidayaId: 'objek-1',
        judul: 'Laporan penyakit ayam broiler',
        tipe: 'sakit',
        status: 'aktif',
        sakit: {
          penyakitAyamId: penyakitId,
          gejala: [
            { id: 'g1' },
            { id: 'g2' },
          ],
        },
      });

    expect(createLaporanRes.statusCode).toBe(201);
    expect(createLaporanRes.body.message).toBe('Laporan penyakit berhasil dibuat');
    expect(createLaporanRes.body.data).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          id: expect.any(String),
          judul: 'Laporan penyakit ayam broiler',
          UnitBudidayaId: 'unit-1',
          ObjekBudidayaId: 'objek-1',
          UserId: 'user-1',
        }),
        laporanGejala: expect.arrayContaining([
          expect.objectContaining({ penyakit_ayam_id: penyakitId, gejala_id: 'g1' }),
          expect.objectContaining({ penyakit_ayam_id: penyakitId, gejala_id: 'g2' }),
        ]),
        dataPenyakit: expect.objectContaining({
          LaporanId: expect.any(String),
          diagnosisPenyakit: penyakitId,
          status: 'aktif',
        }),
      })
    );
    expect(sequelize.Laporan.create).toHaveBeenCalledTimes(1);
    expect(sequelize.LaporanGejala.bulkCreate).toHaveBeenCalledTimes(1);
    expect(sequelize.Sakit.create).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).toHaveBeenCalledTimes(3);
    expect(mockTransaction.rollback).not.toHaveBeenCalled();
  });

  it('harus rollback jika createPenyakit menerima gejala yang tidak valid', async () => {
    const response = await request(app)
      .post('/api/farm/penyakit-ayam')
      .send({
        nama_penyakit: 'Avian Influenza',
        gejala_ids: ['g1', 'g99'],
        metode: 'idf',
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Satu atau lebih gejala_id tidak valid');
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });

  it('harus rollback jika createLaporanPenyakit gagal menyimpan laporan', async () => {
    sequelize.Laporan.create.mockRejectedValueOnce(new Error('gagal simpan laporan'));

    const response = await request(app)
      .post('/api/farm/penyakit-ayam/laporan')
      .send({
        unitBudidayaId: 'unit-1',
        objekBudidayaId: 'objek-1',
        judul: 'Laporan penyakit ayam broiler',
        tipe: 'sakit',
        sakit: {
          penyakitAyamId: 'penyakit-1',
          gejala: [{ id: 'g1' }],
        },
      });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toBe('gagal simpan laporan');
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockTransaction.commit).not.toHaveBeenCalled();
  });
});
