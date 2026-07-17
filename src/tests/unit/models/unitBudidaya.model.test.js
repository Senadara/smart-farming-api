const { Sequelize, DataTypes } = require('sequelize');
const defineUnitBudidaya = require('../../../model/farm/unitBudidaya');
const { isUUID } = require('validator');

describe('UnitBudidaya Model', () => {
  let sequelize;
  let UnitBudidaya;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
    UnitBudidaya = defineUnitBudidaya(sequelize, DataTypes);
    const JenisBudidaya = sequelize.define('JenisBudidaya', {});
    const ObjekBudidaya = sequelize.define('ObjekBudidaya', {});
    const ScheduledUnitNotification = sequelize.define('ScheduledUnitNotification', {});
    const Laporan = sequelize.define('Laporan', {});

    UnitBudidaya.associate({ JenisBudidaya, ObjekBudidaya, Laporan, ScheduledUnitNotification });

    await sequelize.sync();
  });

  beforeEach(async () => {
    await UnitBudidaya.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create UnitBudidaya with valid fields', async () => {
    const ub = await UnitBudidaya.create({
      nama: 'Unit A',
      lokasi: 'Surabaya',
      tipe: 'kolektif',
      luas: 10.5,
      jumlah: 5,
      status: true,
      gambar: 'gambar.jpg',
      deskripsi: 'Deskripsi unit',
    });

    expect(ub.nama).toBe('Unit A');
    expect(ub.tipe).toBe('kolektif');
    expect(ub.isDeleted).toBe(false);
  });

  it('should default isDeleted to false', async () => {
    const ub = await UnitBudidaya.create({});
    expect(ub.isDeleted).toBe(false);
  });

  it('should store umurMinggu and default it to 0', async () => {
    const defaultUnit = await UnitBudidaya.create({ nama: 'Unit Default Age' });
    const agedUnit = await UnitBudidaya.create({ nama: 'Unit Age', umurMinggu: 18 });

    expect(defaultUnit.umurMinggu).toBe(0);
    expect(agedUnit.umurMinggu).toBe(18);
  });

  it('should support bulkCreate', async () => {
    const units = await UnitBudidaya.bulkCreate([
      { nama: 'Unit 1', tipe: 'kolektif' },
      { nama: 'Unit 2', tipe: 'individu' },
    ]);
    expect(units.length).toBe(2);
    expect(units[0].tipe).toBe('kolektif');
  });
  
  it('should have associations defined', () => {
    expect(UnitBudidaya.associations.JenisBudidaya).toBeDefined();
    expect(UnitBudidaya.associations.ObjekBudidayas).toBeDefined();
    expect(UnitBudidaya.associations.Laporans).toBeDefined();
    expect(UnitBudidaya.associations.ScheduledUnitNotifications).toBeDefined();
  });

  it('should generate UUID for primary key', async () => {
    const ub = await UnitBudidaya.create({ nama: 'Unit UUID' });
    expect(ub.id).toBeDefined();
    expect(isUUID(ub.id)).toBe(true);
  });

  it('should reject creation with null id', async () => {
    expect.assertions(1);
    try {
      await UnitBudidaya.create({ id: null, nama: 'Unit Null ID' });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should have createdAt and updatedAt fields', async () => {
    const ub = await UnitBudidaya.create({ nama: 'Unit Timestamp' });
    expect(ub.createdAt).toBeInstanceOf(Date);
    expect(ub.updatedAt).toBeInstanceOf(Date);
  });

  it('should not allow creating UnitBudidaya with duplicate primary key', async () => {
    expect.assertions(1);
    try {
      const ub1 = await UnitBudidaya.create({ nama: 'Unit A', tipe: 'kolektif' });
      await UnitBudidaya.create({ id: ub1.id, nama: 'Unit B', tipe: 'individu' });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should allow soft deletion by setting isDeleted = true', async () => {
    const ub = await UnitBudidaya.create({ nama: 'Unit Soft Delete' });
    ub.isDeleted = true;
    await ub.save();
    const found = await UnitBudidaya.findByPk(ub.id);
    expect(found.isDeleted).toBe(true);
  });
});
