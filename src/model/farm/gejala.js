'use strict';

module.exports = (sequelize, DataTypes) => {
    const Gejala = sequelize.define(
        'Gejala',
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            nama_gejala: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            gambar: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            deletedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            tableName: 'gejala',
            freezeTableName: true,
            paranoid: true,
        }
    );

    Gejala.associate = function (models) {
        // relasi bisa ditambahkan di sini
        Gejala.hasMany(models.PenyakitGejala, {
            foreignKey: 'gejala_id',
            as: 'penyakit_gejala'
        });
    };

    return Gejala;
};
