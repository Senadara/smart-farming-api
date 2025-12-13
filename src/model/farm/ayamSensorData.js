module.exports = (sequelize, DataTypes) => {
  const AyamSensorData = sequelize.define(
    "AyamSensorData",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      temperature: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      humidity: {
        type: DataTypes.DOUBLE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "ayam_sensor_data",
      freezeTableName: true,
    }
  );

  return AyamSensorData;
};
