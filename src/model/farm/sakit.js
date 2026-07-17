module.exports = (sequelize, DataTypes) => {
    const Sakit = sequelize.define(
        "Sakit",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            diagnosisPenyakit: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            isDeleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            status: {
                type: DataTypes.ENUM(
                    'Belum Ditangani',
                    'Pemantauan',
                    'Sembuh',
                    // Nilai lama — tetap ada agar data existing tidak rusak
                    'Sudah ditangani',
                    'Belum ditangani'
                ),
                allowNull: false,
                defaultValue: 'Belum Ditangani',
            },
        },
        {
            tableName: "sakit",
            freezeTableName: true,
        }
    );

    Sakit.associate = (models) => {
        Sakit.belongsTo(models.Laporan);
        Sakit.belongsTo(models.PenyakitAyam, { foreignKey: 'diagnosisPenyakit' });
    };

    return Sakit;
}