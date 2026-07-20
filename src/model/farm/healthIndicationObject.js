module.exports = (sequelize, DataTypes) => {
  const HealthIndicationObject = sequelize.define(
    "HealthIndicationObject",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      healthIndicationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      objekBudidayaId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      namaId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dropPercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      dropPoints: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      currentLayingPercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      previousLayingPercent: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true,
      },
      currentLayingDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      previousLayingDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "checked", "dismissed"),
        allowNull: false,
        defaultValue: "pending",
      },
      checkedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "health_indication_objects",
      freezeTableName: true,
    }
  );

  HealthIndicationObject.associate = (models) => {
    HealthIndicationObject.belongsTo(models.HealthIndication, {
      foreignKey: "healthIndicationId",
    });
    HealthIndicationObject.belongsTo(models.ObjekBudidaya, {
      foreignKey: "objekBudidayaId",
    });
  };

  return HealthIndicationObject;
};
