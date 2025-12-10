module.exports = (sequelize, DataTypes) => {
  const SensorData = sequelize.define(
    "SensorData",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      nitrogen: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      phosphor: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      potassium: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      temperature: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      humidity: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      ec: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      ph: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "sensor_data",
      freezeTableName: true,
    }
  );

  return SensorData;
};
