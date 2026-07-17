module.exports = (sequelize, DataTypes) => {
    const PenangananPenyakitAyam = sequelize.define("PenangananPenyakitAyam", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        penyakit_id: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
        gejala_id: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
        penanganan: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        gambar: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    }, {
        tableName: 'penangananPenyakitAyam',
        freezeTableName: true,
        paranoid: true,
    });

    PenangananPenyakitAyam.associate = (models) => {
        PenangananPenyakitAyam.belongsTo(models.PenyakitAyam, {
            foreignKey: 'penyakit_id',
            as: 'penyakit',
        });
        PenangananPenyakitAyam.belongsTo(models.Gejala, {
            foreignKey: 'gejala_id',
            as: 'gejala',
        });
    };

    return PenangananPenyakitAyam;
};