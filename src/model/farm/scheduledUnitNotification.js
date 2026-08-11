module.exports = (sequelize, DataTypes) => {
  const ScheduledUnitNotification = sequelize.define(
    "ScheduledUnitNotification",
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
        references: {
          model: "UnitBudidaya",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      messageTemplate: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      notificationType: {
        type: DataTypes.ENUM("daily", "weekly", "monthly"),
        allowNull: false,
      },
      tipeLaporan: {
        type: DataTypes.ENUM("panen", "vitamin"),
        allowNull: false,
      },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      dayOfMonth: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      scheduledTime: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lastTriggered: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "scheduledUnitNotification",
      timestamps: true,
    }
  );

  ScheduledUnitNotification.associate = (models) => {
    ScheduledUnitNotification.belongsTo(models.UnitBudidaya, {
      foreignKey: "unitBudidayaId",
    });
  };
  return ScheduledUnitNotification;
};
