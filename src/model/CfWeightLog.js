const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CfWeightLog = sequelize.define('CfWeightLog', {
        id: {
            type: DataTypes.CHAR(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        penyakit_gejala_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        cf_weight_lama: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        cf_weight_baru: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
        },
        total_disease_lama: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        triggered_by: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: 'cf_weight_log',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: false,
    });

    CfWeightLog.associate = (models) => {
        CfWeightLog.belongsTo(models.PenyakitGejala, {
            foreignKey: 'penyakit_gejala_id',
            as: 'penyakitGejala',
        });
    };

    return CfWeightLog;
};