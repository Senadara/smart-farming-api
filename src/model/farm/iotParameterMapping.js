module.exports = (sequelize, DataTypes) => {
  const IotParameterMapping = sequelize.define(
    "IotParameterMapping",
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
      payloadKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "iot_parameter_mapping",
      freezeTableName: true,
    }
  );

  IotParameterMapping.associate = (models) => {
    IotParameterMapping.belongsTo(models.IotDevice, {
      foreignKey: "deviceId",
      as: "device",
    });
    IotParameterMapping.belongsTo(models.IotParameter, {
      foreignKey: "parameterId",
      as: "parameter",
    });
  };

  return IotParameterMapping;
};
