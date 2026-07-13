module.exports = (sequelize, DataTypes) => {
  const IotParameter = sequelize.define(
    "IotParameter",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      parameterCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      parameterName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "iot_parameter",
      freezeTableName: true,
    }
  );

  IotParameter.associate = (models) => {
    IotParameter.hasMany(models.IotParameterMapping, {
      foreignKey: "parameterId",
      as: "mappings",
    });
    IotParameter.hasMany(models.IotSensorData, {
      foreignKey: "parameterId",
      as: "sensorData",
    });
  };

  return IotParameter;
};
