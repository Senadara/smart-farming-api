module.exports = (sequelize, DataTypes) => {
  const IotDevice = sequelize.define(
    "IotDevice",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      unitBudidayaId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      connectionConfigId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      deviceCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      deviceName: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      pollingInterval: {
        type: DataTypes.INTEGER,
        defaultValue: 300,
      },
      status: {
        type: DataTypes.STRING(50),
        defaultValue: "active",
      },
      installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastSeenAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastMissedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      missedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      offlineAfterMisses: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
      },
      offlineAfterMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
      },
    },
    {
      tableName: "iot_device",
      freezeTableName: true,
    }
  );

  IotDevice.associate = (models) => {
    IotDevice.belongsTo(models.UnitBudidaya, { foreignKey: "unitBudidayaId" });
    IotDevice.hasMany(models.IotParameterMapping, {
      foreignKey: "deviceId",
      as: "parameterMappings",
    });
    IotDevice.hasMany(models.IotSensorData, {
      foreignKey: "deviceId",
      as: "sensorData",
    });
    IotDevice.hasMany(models.IotDeviceLog, {
      foreignKey: "deviceId",
      as: "logs",
    });
  };

  return IotDevice;
};
