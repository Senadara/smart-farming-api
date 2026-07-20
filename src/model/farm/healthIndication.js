module.exports = (sequelize, DataTypes) => {
  const HealthIndication = sequelize.define(
    "HealthIndication",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      unitBudidayaId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "spk-web",
      },
      indicationCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      analysisMode: {
        type: DataTypes.STRING(80),
        allowNull: false,
        defaultValue: "individual_productivity_drop",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      severity: {
        type: DataTypes.ENUM("info", "warning", "critical"),
        allowNull: false,
        defaultValue: "warning",
      },
      status: {
        type: DataTypes.ENUM("pending", "checked", "dismissed"),
        allowNull: false,
        defaultValue: "pending",
      },
      periodStart: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      periodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      periodDays: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      thresholdPercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      affectedObjectCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      context: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      notificationResult: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      detectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      checkedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      checkedBy: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "health_indications",
      freezeTableName: true,
    }
  );

  HealthIndication.associate = (models) => {
    HealthIndication.belongsTo(models.UnitBudidaya, {
      foreignKey: "unitBudidayaId",
    });
    HealthIndication.hasMany(models.HealthIndicationObject, {
      foreignKey: "healthIndicationId",
      as: "objects",
    });
  };

  return HealthIndication;
};
