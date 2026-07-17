const { Sequelize, DataTypes } = require('sequelize');
const defineKomoditas = require('../../../model/farm/komoditas');
const { isUUID } = require('validator');

describe('Komoditas Model', () => {
  let sequelize;
  let Komoditas;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });

    const Panen = sequelize.define('Panen', {});
    const Satuan = sequelize.define('Satuan', {});
    const JenisBudidaya = sequelize.define('JenisBudidaya', {});
    const Produk = sequelize.define('Produk', {}, { tableName: 'produk' });

    Komoditas = defineKomoditas(sequelize, DataTypes);
    Komoditas.associate({ Panen, Satuan, JenisBudidaya, Produk });

    await sequelize.sync();
  });

  beforeEach(async () => {
    await Komoditas.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a komoditas with valid data', async () => {
    const komoditas = await Komoditas.create({
      nama: 'Bayam',
      jumlah: 100.5,
      tipeKomoditas: 'kolektif',
    });
    expect(komoditas.nama).toBe('Bayam');
    expect(komoditas.jumlah).toBeCloseTo(100.5);
    expect(komoditas.isDeleted).toBe(false);
  });

  it('should set isDeleted to false by default', async () => {
    const komoditas = await Komoditas.create({
      nama: 'Cabai',
      jumlah: 200,
      tipeKomoditas: 'kolektif',
    });
    expect(komoditas.isDeleted).toBe(false);
  });

  it('should allow soft delete (setting isDeleted = true)', async () => {
    const komoditas = await Komoditas.create({
      nama: 'Tomat',
      jumlah: 50,
      tipeKomoditas: 'kolektif',
    });
    komoditas.isDeleted = true;
    await komoditas.save();
    const found = await Komoditas.findByPk(komoditas.id);
    expect(found.isDeleted).toBe(true);
  });

  it('should include createdAt and updatedAt timestamps', async () => {
    const komoditas = await Komoditas.create({
      nama: 'Sawi',
      jumlah: 30,
      tipeKomoditas: 'kolektif',
    });
    expect(komoditas.createdAt).toBeInstanceOf(Date);
    expect(komoditas.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw error when nama is null', async () => {
    expect.assertions(1);
    try {
      await Komoditas.create({ jumlah: 10, tipeKomoditas: 'kolektif' });
    } catch (err) {
      expect(err.message).toMatch(/notNull/);
    }
  });

  it('should throw error when jumlah is null', async () => {
    expect.assertions(1);
    try {
      await Komoditas.create({ nama: 'Wortel', tipeKomoditas: 'kolektif' });
    } catch (err) {
      expect(err.message).toMatch(/notNull/);
    }
  });

  it('should allow bulkCreate for valid komoditas entries', async () => {
    const data = [
      { nama: 'Jagung', jumlah: 100, tipeKomoditas: 'kolektif' },
      { nama: 'Kacang', jumlah: 50, tipeKomoditas: 'kolektif' },
    ];
    const komoditas = await Komoditas.bulkCreate(data);
    expect(komoditas.length).toBe(2);
  });

  it('should throw error on invalid bulkCreate (null in required fields)', async () => {
    expect.assertions(1);
    try {
      await Komoditas.bulkCreate([
        { nama: 'Bayam', jumlah: 10, tipeKomoditas: 'kolektif' },
        { nama: null, jumlah: 20, tipeKomoditas: 'kolektif' }, // invalid
      ]);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  it('should have associations defined', () => {
    expect(Komoditas.associations.Panens).toBeDefined();
    expect(Komoditas.associations.Satuan).toBeDefined();
    expect(Komoditas.associations.JenisBudidaya).toBeDefined();
    expect(Komoditas.associations.Produk).toBeDefined();
  });

  it('should generate UUID for primary key', async () => {
    const komoditas = await Komoditas.create({
      nama: 'Bawang Merah',
      jumlah: 75,
      tipeKomoditas: 'kolektif',
    });
    expect(komoditas.id).toBeDefined();
    expect(isUUID(komoditas.id)).toBe(true);
  });

  it('should reject if id is null', async () => {
    expect.assertions(1);
    try {
      await Komoditas.create({ id: null, nama: 'Bawang Putih', jumlah: 20, tipeKomoditas: 'kolektif' });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });

  it('should allow storing panenConfig as JSON', async () => {
    const panenConfig = {
      tipePanen: 'telur',
      modePanen: 'produksi',
      jumlah: { enabled: true, required: true, label: 'Jumlah telur' },
    };

    const komoditas = await Komoditas.create({
      nama: 'Telur Ayam',
      jumlah: 0,
      tipeKomoditas: 'kolektif',
      panenConfig,
    });

    expect(komoditas.panenConfig).toEqual(panenConfig);
  });



});
