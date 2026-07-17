const { Sequelize, DataTypes } = require('sequelize');
const defineRincianPanen = require('../../../model/farm/panenRincianGrade');
const { isUUID } = require('validator');

describe('Rincian Panen Model', () => {
  let sequelize;
  let RincianPanen;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });

    const Grade = sequelize.define('Grade', {});
    const PanenKebun = sequelize.define('PanenKebun', {});
    const Panen = sequelize.define('Panen', {});

    RincianPanen = defineRincianPanen(sequelize, DataTypes);
    RincianPanen.associate({ Grade, PanenKebun, Panen });
    await sequelize.sync();
  });

  beforeEach(async () => {
    await RincianPanen.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });
  
 it('should create model instance with valid data', async () => {
    const rincian = await RincianPanen.create({
      jumlah: 50,      
      berat: 3.1,
      persentaseJumlah: 50,
      persentaseBerat: 51.67,
      isDeleted: false,
    });
    expect(rincian.jumlah).toBe(50);
    expect(rincian.berat).toBe(3.1);
    expect(rincian.persentaseJumlah).toBe(50);
    expect(rincian.persentaseBerat).toBe(51.67);
    expect(rincian.isDeleted).toBe(false);
 });

  it('should support soft deletion by setting isDeleted = true', async () => {
    const rincian = await RincianPanen.create({
      jumlah: 50,
      isDeleted: false,
    });
    rincian.isDeleted = true;
    await rincian.save();
    const found = await RincianPanen.findOne({ where: { id: rincian.id } });
    expect(found.isDeleted).toBe(true);
  });

  it('should have createdAt and updatedAt fields', async () => {
    const rincian = await RincianPanen.create({
      jumlah: 50,
      isDeleted: false,
    });
    expect(rincian.createdAt).toBeInstanceOf(Date);
    expect(rincian.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow bulk creation of records', async () => {
    const rincianData = [
      { jumlah: 30, isDeleted: false },
      { jumlah: 20, isDeleted: false },
    ];
    const rincian = await RincianPanen.bulkCreate(rincianData);
    expect(rincian.length).toBe(2);
    expect(rincian[0].jumlah).toBe(30);
    expect(rincian[1].jumlah).toBe(20);
  });

  it('should allow creating RincianPanen with berat but without jumlah', async () => {
    const rincian = await RincianPanen.create({
      berat: 3.2,
      persentaseBerat: 53.33,
      isDeleted: false,
    });

    expect(rincian.jumlah).toBeUndefined();
    expect(rincian.berat).toBe(3.2);
  });

  it('should not allow creating RincianPanen with negative jumlah', async () => {
    expect.assertions(1);
    try {
    await RincianPanen.create({ jumlah: -10, isDeleted: false });
    } catch (error) {
    expect(error).toBeTruthy();
    }
  });

  it('should generate a UUID for id if not provided', async () => {
    const rincian = await RincianPanen.create({
      jumlah: 50,
      isDeleted: false,
    });
    expect(rincian.id).toBeDefined();
    expect(isUUID(rincian.id)).toBe(true);
  });

  it('should reject if id is null', async () => {
    expect.assertions(1);
    try {
    await RincianPanen.create({ id: null, jumlah: 50, isDeleted: false });
    } catch (error) {
    expect(error).toBeTruthy();
    }
  });

});
