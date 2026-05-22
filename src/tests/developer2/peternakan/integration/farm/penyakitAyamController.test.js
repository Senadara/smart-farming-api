jest.mock('../../../../../model/index', () => {
  const actualOp = require('sequelize').Op;

  const mockModel = () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    update: jest.fn(),
  });

  return {
    PenyakitAyam: mockModel(),
    PenyakitGejala: mockModel(),
    PenangananPenyakitAyam: mockModel(),
    Laporan: mockModel(),
    LaporanGejala: mockModel(),
    Sakit: mockModel(),
    Gejala: mockModel(),
    CfWeightLog: mockModel(),
    sequelize: {
      transaction: jest.fn(),
    },
    Sequelize: {
      Op: actualOp,
    },
  };
});

const controller = require('../../../../../controller/farm/penyakitAyamController');
const sequelize = require('../../../../../model/index');

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Developer 2 - penyakit ayam controller coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllPenyakit mengembalikan daftar penyakit', async () => {
    const req = {};
    const res = createRes();

    sequelize.PenyakitAyam.findAll.mockResolvedValue([
      { id: 'p1', nama_penyakit: 'Newcastle Disease' },
      { id: 'p2', nama_penyakit: 'Avian Influenza' },
    ]);

    await controller.getAllPenyakit(req, res);

    expect(sequelize.PenyakitAyam.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully retrieved penyakit data',
      data: [
        { id: 'p1', nama_penyakit: 'Newcastle Disease' },
        { id: 'p2', nama_penyakit: 'Avian Influenza' },
      ],
    });
  });

  it('getRiwayatPenyakitAyam mengembalikan daftar riwayat sakit', async () => {
    const req = {};
    const res = createRes();

    sequelize.Laporan.findAll.mockResolvedValue([
      {
        id: 'lap-1',
        tipe: 'sakit',
        Sakit: { diagnosisPenyakit: 'p1' },
      },
    ]);

    await controller.getRiwayatPenyakitAyam(req, res);

    expect(sequelize.Laporan.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully retrieved penyakit data',
      data: [
        {
          id: 'lap-1',
          tipe: 'sakit',
          Sakit: { diagnosisPenyakit: 'p1' },
        },
      ],
    });
  });

  it('getPenangananPenyakitAyamById mengembalikan data penanganan', async () => {
    const req = { params: { id: 't1' } };
    const res = createRes();

    sequelize.PenangananPenyakitAyam.findOne.mockResolvedValue({
      id: 't1',
      penyakit_id: 'p1',
      penanganan: 'Isolasi kandang',
    });

    await controller.getPenangananPenyakitAyamById(req, res);

    expect(sequelize.PenangananPenyakitAyam.findOne).toHaveBeenCalledWith({
      where: { id: 't1' },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Successfully retrieved penyakit data',
      data: {
        id: 't1',
        penyakit_id: 'p1',
        penanganan: 'Isolasi kandang',
      },
    });
  });

  it('getPenangananPenyakitAyamById seharusnya mengembalikan 404 saat data penanganan tidak ditemukan', async () => {
    const req = { params: { id: 'missing-penanganan' } };
    const res = createRes();

    sequelize.PenangananPenyakitAyam.findOne.mockResolvedValue(null);

    await controller.getPenangananPenyakitAyamById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Penanganan penyakit tidak ditemukan',
    });
  });

  it('createPenangananPenyakitAyam seharusnya menolak bila penyakit_id belum punya relasi gejala', async () => {
    const req = {
      body: {
        id_penyakit: 'p-missing',
        catatan: 'Isolasi kandang',
        gambar: 'https://example.com/penanganan.jpg',
      },
    };
    const res = createRes();

    sequelize.PenangananPenyakitAyam.create.mockResolvedValue({
      id: 't-missing',
      penyakit_id: 'p-missing',
      penanganan: 'Isolasi kandang',
      gambar: 'https://example.com/penanganan.jpg',
    });
    sequelize.PenyakitGejala.findAll.mockResolvedValue([]);

    await controller.createPenangananPenyakitAyam(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Penyakit tidak ditemukan atau belum memiliki relasi gejala',
    });
  });

  it('createPenangananPenyakitAyam melakukan rollback saat insert penanganan gagal', async () => {
    const req = {
      body: {
        id_penyakit: 'p1',
        catatan: 'Isolasi kandang',
        gambar: 'https://example.com/penanganan.jpg',
      },
    };
    const res = createRes();
    const transaction = { commit: jest.fn(), rollback: jest.fn() };

    sequelize.sequelize.transaction.mockResolvedValue(transaction);
    sequelize.PenangananPenyakitAyam.create.mockRejectedValue(new Error('gagal simpan penanganan'));

    await controller.createPenangananPenyakitAyam(req, res);

    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'gagal simpan penanganan',
      detail: expect.any(Error),
    });
  });

  it('createLaporanPenyakit melakukan rollback saat bulkCreate gejala gagal', async () => {
    const req = {
      body: {
        unitBudidayaId: 'unit-1',
        objekBudidayaId: 'objek-1',
        judul: 'Laporan penyakit ayam',
        tipe: 'sakit',
        status: 'aktif',
        sakit: {
          penyakitAyamId: 'p1',
          gejala: [{ id: 'g1' }],
        },
      },
      user: { id: 'user-1' },
    };
    const res = createRes();
    const transaction = { commit: jest.fn(), rollback: jest.fn() };

    sequelize.sequelize.transaction.mockResolvedValue(transaction);
    sequelize.Laporan.create.mockResolvedValue({ id: 'lap-1' });
    sequelize.LaporanGejala.bulkCreate.mockRejectedValue(new Error('gagal simpan gejala laporan'));

    await controller.createLaporanPenyakit(req, res);

    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'gagal simpan gejala laporan',
      detail: expect.any(Error),
    });
  });

  it('createPenyakit menolak nama_penyakit kosong sebelum transaksi dibuat', async () => {
    const req = {
      body: {
        nama_penyakit: '   ',
        gejala_ids: ['g1'],
      },
    };
    const res = createRes();

    await controller.createPenyakit(req, res);

    expect(sequelize.sequelize.transaction).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'nama_penyakit wajib diisi',
    });
  });

  it('createPenyakit menolak gejala_ids kosong sebelum transaksi dibuat', async () => {
    const req = {
      body: {
        nama_penyakit: 'Newcastle Disease',
        gejala_ids: [],
      },
    };
    const res = createRes();

    await controller.createPenyakit(req, res);

    expect(sequelize.sequelize.transaction).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'gejala_ids wajib diisi minimal 1 gejala',
    });
  });

  it('createPenyakit melakukan rollback saat gejala_ids tidak valid', async () => {
    const req = {
      body: {
        nama_penyakit: 'Newcastle Disease',
        gejala_ids: ['g1', 'g99'],
      },
    };
    const res = createRes();
    const transaction = { commit: jest.fn(), rollback: jest.fn() };

    sequelize.sequelize.transaction.mockResolvedValue(transaction);
    sequelize.Gejala.findAll.mockResolvedValue([{ id: 'g1', nama_gejala: 'Batuk' }]);

    await controller.createPenyakit(req, res);

    expect(transaction.rollback).toHaveBeenCalledTimes(1);
    expect(transaction.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Satu atau lebih gejala_id tidak valid',
    });
  });

  it('getRiwayatPenyakitAyamById seharusnya mengembalikan 404 saat laporan tidak ditemukan', async () => {
    const req = { params: { id: 'missing-id' } };
    const res = createRes();

    sequelize.Laporan.findOne.mockResolvedValue(null);

    await controller.getRiwayatPenyakitAyamById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Laporan sakit tidak ditemukan',
    });
  });

  it('getRiwayatPenyakitAyamById seharusnya menolak saat laporan tidak punya relasi Sakit', async () => {
    const req = { params: { id: 'laporan-tanpa-sakit' } };
    const res = createRes();

    sequelize.Laporan.findOne.mockResolvedValue({
      id: 'laporan-tanpa-sakit',
      isDeleted: false,
      tipe: 'sakit',
      Sakit: null,
    });

    await controller.getRiwayatPenyakitAyamById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Data sakit tidak ditemukan',
    });
  });
});
