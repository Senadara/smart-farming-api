module.exports = (sequelize, DataTypes) => {
    const StatusLogPenyakitAyam = sequelize.define('StatusLogPenyakitAyam', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        laporan_sakit_id: {
            type: DataTypes.CHAR(36),
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        catatan: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        updated_by: {
            type: DataTypes.CHAR(36),
            allowNull: true,
        },
    }, {
        tableName: 'status_log_penyakit_ayam',
        freezeTableName: true,
        updatedAt: false,   // hanya createdAt yang relevan
    });

    StatusLogPenyakitAyam.associate = (models) => {
        StatusLogPenyakitAyam.belongsTo(models.Sakit, {
            foreignKey: 'laporan_sakit_id',
            as: 'laporanSakit',
        });
        StatusLogPenyakitAyam.belongsTo(models.User, {
            foreignKey: 'updated_by',
            as: 'petugas',
        });
    };

    return StatusLogPenyakitAyam;
};
