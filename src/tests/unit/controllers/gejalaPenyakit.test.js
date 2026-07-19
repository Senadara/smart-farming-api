const request = require('supertest');
const express = require('express');

jest.mock('../../../utils/cfHelper', () => ({
  computeCF: jest.fn().mockReturnValue(0.5),
  combineCF: jest.fn(),
  diagnosePenyakit: jest.fn(),
}));

jest.mock('../../../model/index', () => {
  const mock = () => ({ findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), destroy: jest.fn() });
  return {
    Gejala: mock(), PenyakitGejala: mock(),
    sequelize: { transaction: jest.fn() },
    Sequelize: { Op: require('sequelize').Op },
  };
});

const db = require('../../../model/index');
const ctrl = require('../../../controller/farm/gejalaPenyakit');

const app = express();
app.use(express.json());
app.get('/gejala', ctrl.getGejalaPenyakit);
app.post('/gejala', ctrl.createGejalaPenyakit);
app.put('/gejala/:id', ctrl.updateGejalaPenyakit);
app.delete('/gejala/:id', ctrl.deleteGejalaPenyakit);

const makeGejala = (overrides = {}) => ({
  id: 'g-1', nama_gejala: 'Lesu', updatedAt: new Date(), ...overrides,
  update: jest.fn(async function (p) { Object.assign(this, p); return this; }),
  destroy: jest.fn(async () => {}),
});

describe('GejalaPenyakit Controller', () => {
  let tx;

  beforeEach(() => {
    jest.clearAllMocks();
    tx = { commit: jest.fn(), rollback: jest.fn() };
    db.sequelize.transaction.mockResolvedValue(tx);
    db.PenyakitGejala.findAll.mockResolvedValue([]);
  });

  describe('GET /gejala', () => {
    it('200 – mengembalikan daftar gejala terurut updatedAt DESC', async () => {
      db.Gejala.findAll.mockResolvedValue([makeGejala()]);
      const res = await request(app).get('/gejala');
      expect(res.statusCode).toBe(200);
      expect(db.Gejala.findAll).toHaveBeenCalledWith({ order: [['updatedAt', 'DESC']] });
    });
    it('500 – DB error', async () => {
      db.Gejala.findAll.mockRejectedValue(new Error('err'));
      expect((await request(app).get('/gejala')).statusCode).toBe(500);
    });
  });

  describe('POST /gejala', () => {
    it('400 – gejala sudah ada', async () => {
      db.Gejala.findOne.mockResolvedValue(makeGejala());
      expect((await request(app).post('/gejala').send({ nama_gejala: 'Lesu' })).statusCode).toBe(400);
    });
    it('200 – gejala baru berhasil dibuat', async () => {
      db.Gejala.findOne.mockResolvedValue(null);
      db.Gejala.create.mockResolvedValue(makeGejala());
      expect((await request(app).post('/gejala').send({ nama_gejala: 'Baru' })).statusCode).toBe(200);
    });
    it('500 – DB error', async () => {
      db.Gejala.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).post('/gejala').send({})).statusCode).toBe(500);
    });
  });

  describe('PUT /gejala/:id', () => {
    it('404 – gejala tidak ditemukan', async () => {
      db.Gejala.findOne.mockResolvedValue(null);
      expect((await request(app).put('/gejala/x').send({})).statusCode).toBe(404);
    });
    it('200 – berhasil update gejala', async () => {
      const g = makeGejala();
      db.Gejala.findOne.mockResolvedValue(g);
      const res = await request(app).put('/gejala/g-1').send({ nama_gejala: 'Update' });
      expect(res.statusCode).toBe(200);
      expect(g.update).toHaveBeenCalledWith(expect.objectContaining({ nama_gejala: 'Update' }));
    });
    it('500 – DB error', async () => {
      db.Gejala.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).put('/gejala/x').send({})).statusCode).toBe(500);
    });
  });

  describe('DELETE /gejala/:id', () => {
    it('404 – gejala tidak ditemukan, rollback', async () => {
      db.Gejala.findOne.mockResolvedValue(null);
      expect((await request(app).delete('/gejala/x')).statusCode).toBe(404);
      expect(tx.rollback).toHaveBeenCalled();
    });
    it('200 – berhasil soft-delete, recalculate CF, commit', async () => {
      const g = makeGejala();
      db.Gejala.findOne.mockResolvedValue(g);
      const res = await request(app).delete('/gejala/g-1');
      expect(res.statusCode).toBe(200);
      expect(g.destroy).toHaveBeenCalledWith({ transaction: tx });
      expect(tx.commit).toHaveBeenCalled();
    });
    it('500 – DB error, rollback', async () => {
      db.Gejala.findOne.mockRejectedValue(new Error('err'));
      expect((await request(app).delete('/gejala/x')).statusCode).toBe(500);
      expect(tx.rollback).toHaveBeenCalled();
    });
  });
});
