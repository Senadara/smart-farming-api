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
        },
        {
            tableName: 'gejala',
            freezeTableName: true,
        }
    );

    Gejala.associate = function (models) {
        // relasi bisa ditambahkan di sini
    };

    return Gejala;
};
