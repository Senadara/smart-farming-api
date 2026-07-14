const { Sequelize, DataTypes } = require('sequelize');
const definePanen = require('../../../model/farm/panen');
const { isUUID } = require('validator');

describe('Panen Model', () => {
  let sequelize;
  let Panen;

  beforeAll(async () => {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });

    const Komoditas = sequelize.define('Komoditas', {});
    const Laporan = sequelize.define('Laporan', {});
    const DetailPanen = sequelize.define('DetailPanen', {});
    const PanenRincianGrade = sequelize.define('PanenRincianGrade', {});

    Panen = definePanen(sequelize, DataTypes);
    Panen.associate({ Komoditas, Laporan, DetailPanen, PanenRincianGrade });

    await sequelize.sync();
  });

  beforeEach(async () => {
    await Panen.destroy({ where: {} });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create model instance with valid data', async () => {
    const panen = await Panen.create({ jumlah: 50, jumlahHewan: 5, isDeleted: false });
    expect(panen.jumlah).toBe(50);
    expect(panen.jumlahHewan).toBe(5);
    expect(panen.isDeleted).toBe(false);
  });

  it('should have associations defined', () => {
    expect(Panen.associations).toBeDefined();
    expect(Panen.associations.komoditas).toBeDefined();
    expect(Panen.associations.Laporan).toBeDefined();
    expect(Panen.associations.DetailPanens).toBeDefined();
    expect(Panen.associations.PanenRincianGrades).toBeDefined();
  });

  it('should allow soft deletion', async () => {
    const panen = await Panen.create({ jumlah: 30, isDeleted: false });
    panen.isDeleted = true;
    await panen.save();
    const found = await Panen.findOne({ where: { id: panen.id } });
    expect(found.isDeleted).toBe(true);
  });

  it('should set isDeleted to false by default', async () => {
    const panen = await Panen.create({ jumlah: 20 });
    expect(panen.isDeleted).toBe(false);
  });

  it('should have createdAt and updatedAt fields', async () => {
    const panen = await Panen.create({ jumlah: 10 });
    expect(panen.createdAt).toBeInstanceOf(Date);
    expect(panen.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow bulk creation of records', async () => {
    const data = [
      { jumlah: 100, isDeleted: false },
      { jumlah: 200, isDeleted: false },
    ];
    const panens = await Panen.bulkCreate(data);
    expect(panens.length).toBe(2);
    expect(panens[0].jumlah).toBe(100);
    expect(panens[1].jumlah).toBe(200);
  });

  it('should generate UUID for primary key', async () => {
    const panen = await Panen.create({ jumlah: 15 });
    expect(panen.id).toBeDefined();
    expect(isUUID(panen.id)).toBe(true);
  });

  it('should reject if id is null', async () => {
    expect.assertions(1);
    try {
      await Panen.create({ id: null, jumlah: 10 });
    } catch (error) {
      expect(error).toBeTruthy();
    }
  });
  
  

});
