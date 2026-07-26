module.exports = (sequelize, DataTypes) => {
    const LaporanGejala = sequelize.define(
        "LaporanGejala",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            penyakit_ayam_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
            gejala_id: {
                type: DataTypes.UUID,
                allowNull: false,
            },
        },
        {
            tableName: "laporan_gejala",
        }
    );

    LaporanGejala.associate = (models) => {
        LaporanGejala.belongsTo(models.PenyakitAyam, { foreignKey: 'penyakit_ayam_id', as: 'penyakitAyam' });
        LaporanGejala.belongsTo(models.Gejala, { foreignKey: 'gejala_id', as: 'gejala' });
        // Inverse relation: satu baris laporan_gejala dapat direferensikan oleh banyak sakit
        LaporanGejala.hasMany(models.Sakit, {
            foreignKey: 'diagnosisPenyakit',
            as: 'sakitList',
            constraints: false,
        });
    };

    return LaporanGejala;
};
