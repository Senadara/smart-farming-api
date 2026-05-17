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
        LaporanGejala.belongsTo(models.PenyakitAyam, { foreignKey: 'penyakit_ayam_id' });
        LaporanGejala.belongsTo(models.Gejala, { foreignKey: 'gejala_id' });
    };

    return LaporanGejala;
};
