const request = require('supertest');
const express = require('express');

jest.mock('../../../utils/cfHelper', () => ({
  computeCF: jest.fn().mockReturnValue(0.5),
  combineCF: jest.fn(),
  diagnosePenyakit: jest.fn(),
}));

jest.mock('../../../model/index', () => {
  const mock = () => ({
    findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(),
    create: jest.fn(), bulkCreate: jest.fn(), update: jest.fn(), destroy: jest.fn(),
  });
  return {
    PenyakitAyam: mock(), PenyakitGejala: mock(), Gejala: mock(),
    CfWeightLog: mock(), Sakit: mock(), Laporan: mock(),
    LaporanGejala: mock(), PenangananPenyakitAyam: mock(),
    sequelize: { transaction: jest.fn() },
    Sequelize: { Op: require('sequelize').Op },
  };
});

const db = require('../../../model/index');
const cfHelper = require('../../../utils/cfHelper');
const ctrl = require('../../../controller/farm/penyakitAyamController');

const app = express();
app.use(express.json());
app.use((req, res, next) => { req.user = { id: 'user-1' }; res.locals = {}; next(); });

app.get('/penyakit', ctrl.getAllPenyakit);
app.get('/penyakit/with-gejala', ctrl.getPenyakitWithGejala);
app.post('/penyakit/diagnosa', ctrl.diagnosaPenyakitAyam);
app.post('/penyakit', ctrl.createPenyakit);
app.put('/penyakit/:id', ctrl.updatePenyakit);
app.delete('/penyakit/:id', ctrl.deletePenyakit);
app.post('/laporan-penyakit', ctrl.createLaporanPenyakit);
app.put('/laporan-penyakit/:id/status', ctrl.updateStatusLaporanPenyakit);
app.post('/penanganan', ctrl.createPenangananPenyakitAyam);
app.put('/penanganan/:id', ctrl.updatePenangananPenyakitAyam);
app.delete('/penanganan/:id', ctrl.deletePenangananPenyakitAyam);

// ── Helpers ──────────────────────────────────────────────────────────────────
const makePenyakit = (overrides = {}) => ({
  id: 'p-1', nama_penyakit: 'Newcastle', updatedAt: new Date(), ...overrides,
  changed: jest.fn(),
  save: jest.fn(async function () { return this; }),
  update: jest.fn(async function (p) { Object.assign(this, p); return this; }),
  destroy: jest.fn(async () => {}),
  toJSON: function () { return { id: this.id, nama_penyakit: this.nama_penyakit }; },
});

// ═════════════════════════════════════════════════════════════════════════════
describe('PenyakitAyam Controller', () => {
  let tx;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = { commit: jest.fn(), rollback: jest.fn() };
    db.sequelize.transaction.mockResolvedValue(tx);
    db.PenyakitGejala.findAll.mockResolvedValue([]);
  });

  // ── 1. getAllPenyakit ───────────────────────────────────────────────────────
  describe('GET /penyakit – getAllPenyakit', () => {
    it('200 – mengembalikan daftar penyakit terurut updatedAt DESC', async () => {
      db.PenyakitAyam.findAll.mockResolvedValue([makePenyakit()]);
      const res = await request(app).get('/penyakit');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully retrieved penyakit data');
      expect(db.PenyakitAyam.findAll).toHaveBeenCalledWith({ order: [['updatedAt', 'DESC']] });
    });
    it('500 – DB error', async () => {
      db.PenyakitAyam.findAll.mockRejectedValue(new Error('DB err'));
      expect((await request(app).get('/penyakit')).statusCode).toBe(500);
    });
  });

  // ── 2. getPenyakitWithGejala ───────────────────────────────────────────────
  describe('GET /penyakit/with-gejala – getPenyakitWithGejala', () => {
    it('200 – mengembalikan penyakit beserta relasi gejala', async () => {
      db.PenyakitAyam.findAll.mockResolvedValue([makePenyakit()]);
      const res = await request(app).get('/penyakit/with-gejala');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Successfully retrieved penyakit with gejala data');
    });
    it('500 – DB error', async () => {
      db.PenyakitAyam.findAll.mockRejectedValue(new Error('err'));
      expect((await request(app).get('/penyakit/with-gejala')).statusCode).toBe(500);
    });
  });

  // ── 3. diagnosaPenyakitAyam ────────────────────────────────────────────────
  describe('POST /penyakit/diagnosa – diagnosaPenyakitAyam', () => {
    it('400 – gejala kosong / bukan array', async () => {
      expect((await request(app).post('/penyakit/diagnosa').send({ gejala: [] })).statusCode).toBe(400);
      expect((await request(app).post('/penyakit/diagnosa').send({ gejala: 'x' })).statusCode).toBe(400);
    });
    it('200 – hasil diagnosis dikembalikan beserta penanganan', async () => {
      db.Gejala.findAll.mockResolvedValue([{ id: 'g-1', nama_gejala: 'Lesu' }]);
      cfHelper.diagnosePenyakit.mockResolvedValue({ id: 'p-1', penyakit: 'Newcastle', cf_score: 0.72 });
      db.PenangananPenyakitAyam.findAll.mockResolvedValue([{ id: 'pen-1' }]);

      const res = await request(app).post('/penyakit/diagnosa').send({ gejala: [{ id: 'g-1', cf: 0.8 }] });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Diagnosis berhasil');
      expect(res.body.data.penanganan).toHaveLength(1);
    });
    it('500 – DB error', async () => {
      db.Gejala.findAll.mockRejectedValue(new Error('err'));
      expect((await request(app).post('/penyakit/diagnosa').send({ gejala: [{ id: 'g-1' }] })).statusCode).toBe(500);
    });
  });

  // ── 4. createPenyakit ──────────────────────────────────────────────────────
  describe('POST /penyakit – createPenyakit', () => {
    it('400 – nama_penyakit kosong', async () => {
      const res = await request(app).post('/penyakit').send({ gejala_ids: ['g-1'] });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('nama_penyakit wajib diisi');
    });
    it('400 – gejala_ids kosong', async () => {
      const res = await request(app).post('/penyakit').send({ nama_penyakit: 'X', gejala_ids: [] });
      expect(res.statusCode).toBe(400);
    });
    it('400 – salah satu gejala_id tidak valid; rollback dipanggil', async () => {
      db.Gejala.findAll.mockResolvedValue([{ id: 'g-1' }]); // hanya 1 dari 2
      const res = await request(app).post('/penyakit').send({ nama_penyakit: 'X', gejala_ids: ['g-1', 'g-bad'] });
      expect(res.statusCode).toBe(400);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('201 – penyakit & relasi dibuat, CF di-recalculate, commit dipanggil', async () => {
      db.Gejala.findAll.mockResolvedValue([{ id: 'g-1' }, { id: 'g-2' }]);
      db.PenyakitAyam.create.mockResolvedValue(makePenyakit());
      db.PenyakitGejala.bulkCreate.mockResolvedValue([]);
      db.PenyakitAyam.findByPk.mockResolvedValue(makePenyakit());

      const res = await request(app).post('/penyakit').send({ nama_penyakit: 'Tetelo', gejala_ids: ['g-1', 'g-2'] });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toContain('berhasil ditambahkan');
      expect(tx.commit).toHaveBeenCalled();
    });
    it('500 – rollback saat terjadi error DB', async () => {
      db.Gejala.findAll.mockRejectedValue(new Error('err'));
      const res = await request(app).post('/penyakit').send({ nama_penyakit: 'X', gejala_ids: ['g-1'] });
      expect(res.statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  // ── 5. updatePenyakit ──────────────────────────────────────────────────────
  describe('PUT /penyakit/:id – updatePenyakit', () => {
    it('404 – penyakit tidak ditemukan; rollback dipanggil', async () => {
      db.PenyakitAyam.findOne.mockResolvedValue(null);
      const res = await request(app).put('/penyakit/p-99').send({ nama_penyakit: 'X' });
      expect(res.statusCode).toBe(404);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('200 – hanya nama_penyakit diupdate; updatedAt dipaksa berubah via changed()', async () => {
      const existing = makePenyakit();
      db.PenyakitAyam.findOne.mockResolvedValue(existing);
      db.PenyakitAyam.findByPk.mockResolvedValue(makePenyakit({ nama_penyakit: 'Updated' }));

      const res = await request(app).put('/penyakit/p-1').send({ nama_penyakit: 'Updated' });
      expect(res.statusCode).toBe(200);
      expect(existing.update).toHaveBeenCalledWith({ nama_penyakit: 'Updated' }, { transaction: tx });
      expect(existing.changed).toHaveBeenCalledWith('nama_penyakit', true);
      expect(tx.commit).toHaveBeenCalled();
    });
    it('400 – gejala_ids tidak valid; rollback dipanggil', async () => {
      db.PenyakitAyam.findOne.mockResolvedValue(makePenyakit());
      db.Gejala.findAll.mockResolvedValue([{ id: 'g-1' }]); // 1 dari 2
      const res = await request(app).put('/penyakit/p-1').send({ gejala_ids: ['g-1', 'g-bad'] });
      expect(res.statusCode).toBe(400);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('500 – rollback saat terjadi error DB', async () => {
      db.PenyakitAyam.findOne.mockRejectedValue(new Error('err'));
      const res = await request(app).put('/penyakit/p-1').send({ nama_penyakit: 'X' });
      expect(res.statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  // ── 6. deletePenyakit ─────────────────────────────────────────────────────
  describe('DELETE /penyakit/:id – deletePenyakit', () => {
    it('404 – penyakit tidak ditemukan; rollback dipanggil', async () => {
      db.PenyakitAyam.findOne.mockResolvedValue(null);
      const res = await request(app).delete('/penyakit/p-99');
      expect(res.statusCode).toBe(404);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('200 – soft-delete berhasil, CF di-recalculate, commit dipanggil', async () => {
      const existing = makePenyakit();
      db.PenyakitAyam.findOne.mockResolvedValue(existing);

      const res = await request(app).delete('/penyakit/p-1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('berhasil dihapus');
      expect(existing.destroy).toHaveBeenCalledWith({ transaction: tx });
      expect(tx.commit).toHaveBeenCalled();
    });
    it('500 – rollback saat terjadi error DB', async () => {
      db.PenyakitAyam.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).delete('/penyakit/p-1')).statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  // ── 7. createLaporanPenyakit ──────────────────────────────────────────────
  describe('POST /laporan-penyakit – createLaporanPenyakit', () => {
    const body = {
      unitBudidayaId: 'u-1', objekBudidayaId: 'o-1', status: 'sakit',
      sakit: { penyakitAyamId: 'p-1', gejala: [{ id: 'g-1' }] },
    };
    it('201 – laporan, laporanGejala & sakit dibuat, commit dipanggil', async () => {
      db.Laporan.create.mockResolvedValue({ id: 'l-1' });
      db.LaporanGejala.bulkCreate.mockResolvedValue([{ id: 'lg-1' }]);
      db.Sakit.create.mockResolvedValue({ id: 's-1' });

      const res = await request(app).post('/laporan-penyakit').send(body);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Laporan penyakit berhasil dibuat');
      expect(tx.commit).toHaveBeenCalled();
    });
    it('500 – rollback saat Laporan.create gagal', async () => {
      db.Laporan.create.mockRejectedValue(new Error('err'));
      const res = await request(app).post('/laporan-penyakit').send(body);
      expect(res.statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  // ── 8. updateStatusLaporanPenyakit ────────────────────────────────────────
  describe('PUT /laporan-penyakit/:id/status – updateStatusLaporanPenyakit', () => {
    it('404 – tidak ditemukan lewat id Sakit maupun Laporan', async () => {
      db.Sakit.findOne.mockResolvedValue(null);
      db.Laporan.findOne.mockResolvedValue(null);
      expect((await request(app).put('/laporan-penyakit/x/status').send({ status: 'sehat' })).statusCode).toBe(404);
    });
    it('200 – status Sakit diupdate saat ditemukan via Sakit.id', async () => {
      const sakit = { id: 's-1', LaporanId: 'l-1', update: jest.fn(async function (p) { Object.assign(this, p); return this; }) };
      db.Sakit.findOne.mockResolvedValue(sakit);
      db.Laporan.findOne.mockResolvedValue({ id: 'l-1' });

      const res = await request(app).put('/laporan-penyakit/s-1/status').send({ status: 'sehat' });
      expect(res.statusCode).toBe(200);
      expect(sakit.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'sehat' }));
    });
    it('500 – DB error', async () => {
      db.Sakit.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).put('/laporan-penyakit/s-1/status').send({ status: 'sehat' })).statusCode).toBe(500);
    });
  });

  // ── 9. createPenangananPenyakitAyam ──────────────────────────────────────
  describe('POST /penanganan – createPenangananPenyakitAyam', () => {
    const body = { id_penyakit: 'p-1', catatan: 'Beri obat', gambar: null };
    it('404 – penyakit tidak ditemukan; rollback dipanggil', async () => {
      db.PenyakitAyam.findOne.mockResolvedValue(null);
      const res = await request(app).post('/penanganan').send(body);
      expect(res.statusCode).toBe(404);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('201 – penanganan dibuat, commit dipanggil', async () => {
      db.PenyakitAyam.findOne.mockResolvedValue(makePenyakit());
      db.PenangananPenyakitAyam.create.mockResolvedValue({ id: 'pen-1' });

      const res = await request(app).post('/penanganan').send(body);
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Penanganan penyakit berhasil dibuat');
      expect(tx.commit).toHaveBeenCalled();
    });
    it('500 – rollback saat terjadi error DB', async () => {
      db.PenyakitAyam.findOne.mockRejectedValue(new Error('err'));
      const res = await request(app).post('/penanganan').send(body);
      expect(res.statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });

  // ── 10. updatePenangananPenyakitAyam ─────────────────────────────────────
  describe('PUT /penanganan/:id – updatePenangananPenyakitAyam', () => {
    it('404 – penanganan tidak ditemukan', async () => {
      db.PenangananPenyakitAyam.findOne.mockResolvedValue(null);
      expect((await request(app).put('/penanganan/x').send({ catatan: 'x' })).statusCode).toBe(404);
    });
    it('200 – catatan & gambar diupdate; updatedAt PenyakitAyam ikut diperbarui', async () => {
      const pen = { id: 'pen-1', penyakit_id: 'p-1', update: jest.fn(async function (p) { Object.assign(this, p); return this; }) };
      db.PenangananPenyakitAyam.findOne.mockResolvedValue(pen);
      db.PenyakitAyam.findByPk.mockResolvedValue(makePenyakit());

      const res = await request(app).put('/penanganan/pen-1').send({ catatan: 'Baru', gambar: 'img.png' });
      expect(res.statusCode).toBe(200);
      expect(pen.update).toHaveBeenCalledWith(expect.objectContaining({ penanganan: 'Baru', gambar: 'img.png' }));
    });
    it('500 – DB error', async () => {
      db.PenangananPenyakitAyam.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).put('/penanganan/x').send({})).statusCode).toBe(500);
    });
  });

  // ── 11. deletePenangananPenyakitAyam ─────────────────────────────────────
  describe('DELETE /penanganan/:id – deletePenangananPenyakitAyam', () => {
    it('404 – penanganan tidak ditemukan', async () => {
      db.PenangananPenyakitAyam.findOne.mockResolvedValue(null);
      expect((await request(app).delete('/penanganan/x')).statusCode).toBe(404);
    });
    it('200 – soft-delete berhasil', async () => {
      const pen = { id: 'pen-1', destroy: jest.fn(async () => {}) };
      db.PenangananPenyakitAyam.findOne.mockResolvedValue(pen);

      const res = await request(app).delete('/penanganan/pen-1');
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Penanganan penyakit berhasil dihapus');
      expect(pen.destroy).toHaveBeenCalled();
    });
    it('500 – DB error', async () => {
      db.PenangananPenyakitAyam.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).delete('/penanganan/x')).statusCode).toBe(500);
    });
  });
});
