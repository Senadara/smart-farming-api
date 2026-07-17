module.exports = (sequelize, DataTypes) => {
  const DailyReportMetric = sequelize.define(
    "DailyReportMetric",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      laporan_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      metric_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      value: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
      },
      unit: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "daily_report_metrics",
      freezeTableName: true,
    }
  );

  DailyReportMetric.associate = (models) => {
    DailyReportMetric.belongsTo(models.Laporan, {
      foreignKey: "laporan_id",
      as: "laporan",
    });
  };

  return DailyReportMetric;
};
