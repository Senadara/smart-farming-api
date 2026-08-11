const { Sequelize, DataTypes } = require('sequelize');
const defineObjekBudidaya = require('../../../model/farm/objekBudidaya');
const { isUUID } = require('validator');

describe('ObjekBudidaya Model', () => {
  let sequelize;
  let ObjekBudidaya;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });

    const Laporan = sequelize.define('Laporan', {});
    const UnitBudidaya = sequelize.define('UnitBudidaya', {});
    const DetailPanen = sequelize.define('DetailPanen', {});

    ObjekBudidaya = defineObjekBudidaya(sequelize, DataTypes);
    ObjekBudidaya.associate({ Laporan, UnitBudidaya, DetailPanen });

    await sequelize.sync();
  });

  beforeEach(async () => {
    await ObjekBudidaya.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create ObjekBudidaya with valid data', async () => {
    const obj = await ObjekBudidaya.create({ namaId: 'OBJ001', deskripsi: 'Deskripsi contoh' });
    expect(obj.namaId).toBe('OBJ001');
    expect(obj.deskripsi).toBe('Deskripsi contoh');
    expect(obj.status).toBe(true);
    expect(obj.isDeleted).toBe(false);
  });

  it('should throw error if namaId is missing', async () => {
    expect.assertions(1);
    try {
      await ObjekBudidaya.create({});
    } catch (error) {
      expect(error.message).toMatch(/notNull/);
    }
  });

  it('should have associations defined', () => {
    expect(ObjekBudidaya.associations).toBeDefined();
    expect(ObjekBudidaya.associations.Laporans).toBeDefined();
    expect(ObjekBudidaya.associations.DetailPanen).toBeDefined();
    expect(ObjekBudidaya.associations.UnitBudidaya).toBeDefined();
  });

  it('should reject if id is null', async () => {
    expect.assertions(1);
    try {
      await ObjekBudidaya.create({ id: null, namaId: 'OBJ002', deskripsi: 'Deskripsi tanpa id' });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should generate UUID for primary key', async () => {
    const obj = await ObjekBudidaya.create({ namaId: 'OBJ003', deskripsi: 'Deskripsi dengan UUID' });
    expect(obj.id).toBeDefined();
    expect(isUUID(obj.id)).toBe(true);
  });

  it('should allow bulk creation of records', async () => {
    const data = [
      { namaId: 'OBJ004', deskripsi: 'Deskripsi 1' },
      { namaId: 'OBJ005', deskripsi: 'Deskripsi 2' },
    ];
    const objs = await ObjekBudidaya.bulkCreate(data);
    expect(objs.length).toBe(2);
    expect(objs[0].namaId).toBe('OBJ004');
    expect(objs[1].namaId).toBe('OBJ005');
  });

  it('should have createdAt and updatedAt fields', async () => { 
    const obj = await ObjekBudidaya.create({ namaId: 'OBJ006', deskripsi: 'Deskripsi dengan timestamp' });
    expect(obj.createdAt).toBeInstanceOf(Date);
    expect(obj.updatedAt).toBeInstanceOf(Date);
  });

  it('should not allow creating records with duplicate primary key', async () => {
    expect.assertions(1);
    try {
      const obj1 = await ObjekBudidaya.create({ namaId: 'OBJ007', deskripsi: 'Deskripsi 1' });
      await ObjekBudidaya.create({ id: obj1.id, namaId: 'OBJ008', deskripsi: 'Deskripsi 2' });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should allow soft deletion', async () => {
    const obj = await ObjekBudidaya.create({ namaId: 'OBJ009', deskripsi: 'Deskripsi untuk soft delete' });
    obj.isDeleted = true;
    await obj.save();
    const found = await ObjekBudidaya.findOne({ where: { id: obj.id } });
    expect(found.isDeleted).toBe(true);
  });

  it('should set isDeleted to false by default', async () => {
    const obj = await ObjekBudidaya.create({ namaId: 'OBJ010', deskripsi: 'Deskripsi dengan default isDeleted' });
    expect(obj.isDeleted).toBe(false);
  });

  it('should store lifecycle metadata for mixed-age livestock batches', async () => {
    const obj = await ObjekBudidaya.create({
      namaId: 'OBJ011',
      tanggalMasuk: '2026-01-10',
      umurMasukMinggu: 22,
      targetAfkirAt: '2027-02-01',
      batchKode: 'LAYER-BATCH-02',
    });

    expect(obj.tanggalMasuk).toBe('2026-01-10');
    expect(obj.umurMasukMinggu).toBe(22);
    expect(obj.targetAfkirAt).toBe('2027-02-01');
    expect(obj.batchKode).toBe('LAYER-BATCH-02');
  });

});
