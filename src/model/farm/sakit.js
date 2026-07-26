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
                allowNull: true,
                // FK ke laporan_gejala.id (bukan penyakit_ayam)
                // Menyimpan ID LaporanGejala yang merupakan pasangan penyakit + gejala
                // yang terdeteksi saat diagnosa dilakukan
            },
            status: {
                type: DataTypes.ENUM(
                    'Belum Ditangani',
                    'Pemantauan',
                    'Sembuh',
                    'Mati',
                    // Nilai lama — tetap ada agar data existing tidak rusak
                    'Sudah ditangani',
                    'Belum ditangani'
                ),
                allowNull: false,
                defaultValue: 'Belum Ditangani',
            },
            isDeleted: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
        },
        {
            tableName: "sakit",
            freezeTableName: true,
        }
    );

    Sakit.associate = (models) => {
        Sakit.belongsTo(models.Laporan);
        // FK diagnosisPenyakit sekarang mengarah ke laporan_gejala
        Sakit.belongsTo(models.LaporanGejala, {
            foreignKey: 'diagnosisPenyakit',
            as: 'laporanGejala',
            constraints: false, // FK constraint dikelola di migration
        });
        Sakit.hasMany(models.DaftarGejala, { foreignKey: "sakitId" });
        Sakit.hasMany(models.StatusLogPenyakitAyam, { foreignKey: "laporan_sakit_id" });
    };

    return Sakit;
}