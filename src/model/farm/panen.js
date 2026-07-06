module.exports = (sequelize, DataTypes) => {
  const Panen = sequelize.define(
    "Panen",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      jumlah: {
        type: DataTypes.DOUBLE,
      },
      berat: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        comment: "Total berat hasil panen dalam kilogram.",
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "panen",
      freezeTableName: true,
    }
  );

  Panen.associate = (models) => {
    Panen.belongsTo(models.Komoditas, {
      foreignKey: "komoditasId",
      as: "komoditas",
    });
    Panen.belongsTo(models.Laporan);

    Panen.hasMany(models.DetailPanen);
    Panen.hasMany(models.PanenRincianGrade, {
      foreignKey: "panenId",
    });
  };

  return Panen;
};
