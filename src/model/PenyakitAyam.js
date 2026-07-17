'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PenyakitAyam = sequelize.define('PenyakitAyam', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
            unique: true,
        },
        nama_penyakit: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
    }, {
        tableName: 'penyakit_ayam',
        timestamps: true,
        paranoid: true,
    });

    PenyakitAyam.associate = (models) => {
        PenyakitAyam.hasMany(models.PenyakitGejala, {
            foreignKey: 'penyakit_id',
            as: 'penyakitGejala',
        });
        PenyakitAyam.hasMany(models.PenangananPenyakitAyam, {
            foreignKey: 'penyakit_id',
            as: 'penanganan',
        });
    };

    return PenyakitAyam;
};
