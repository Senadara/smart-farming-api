module.exports = (sequelize, DataTypes) => {
  const IotSensorData = sequelize.define(
    "IotSensorData",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deviceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parameterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      sensorTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "iot_sensor_data",
      freezeTableName: true,
    }
  );

  IotSensorData.associate = (models) => {
    IotSensorData.belongsTo(models.IotDevice, {
      foreignKey: "deviceId",
      as: "device",
    });
    IotSensorData.belongsTo(models.IotParameter, {
      foreignKey: "parameterId",
      as: "parameter",
    });
  };

  return IotSensorData;
};
