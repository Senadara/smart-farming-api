module.exports = (sequelize, DataTypes) => {
  const ObjekBudidaya = sequelize.define(
    "ObjekBudidaya",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      namaId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      deskripsi: {
        type: DataTypes.TEXT,
      },
      tanggalMasuk: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      umurMasukMinggu: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      targetAfkirAt: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      batchKode: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "objekBudidaya",
      freezeTableName: true,
    }
  );

  ObjekBudidaya.associate = (models) => {
    ObjekBudidaya.hasMany(models.Laporan);
    ObjekBudidaya.hasMany(models.DetailPanen, {
      foreignKey: "objekBudidayaId",
      as: "DetailPanen",
    });
    ObjekBudidaya.belongsTo(models.UnitBudidaya);
  };

  return ObjekBudidaya;
};
