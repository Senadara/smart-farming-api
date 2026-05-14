// models/PenyakitGejala.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PenyakitGejala = sequelize.define('PenyakitGejala', {
        id: {
            type: DataTypes.CHAR(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4,
        },
        penyakit_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        gejala_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        cf_weight: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
        disease_frequency: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'df(g): jumlah penyakit yang memiliki gejala ini',
        },
        total_disease: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: 'N: total penyakit saat bobot dihitung',
        },
        metode: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'idf',
        },
        cf_updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        penanganan_id: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
    }, {
        tableName: 'penyakit_gejala',
        timestamps: false,
    });

    PenyakitGejala.associate = (models) => {
        PenyakitGejala.belongsTo(models.PenyakitAyam, {
            foreignKey: 'penyakit_id',
            as: 'penyakit',
        });
        PenyakitGejala.belongsTo(models.Gejala, {
            foreignKey: 'gejala_id',
            as: 'gejala',
        });
        PenyakitGejala.hasMany(models.CfWeightLog, {
            foreignKey: 'penyakit_gejala_id',
            as: 'cfLogs',
        });
    };

    return PenyakitGejala;
};