module.exports = (sequelize, DataTypes) => {
  const IotDeviceLog = sequelize.define(
    "IotDeviceLog",
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
      logType: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "iot_device_log",
      freezeTableName: true,
    }
  );

  IotDeviceLog.associate = (models) => {
    IotDeviceLog.belongsTo(models.IotDevice, {
      foreignKey: "deviceId",
      as: "device",
    });
  };

  return IotDeviceLog;
};
