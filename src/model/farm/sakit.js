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
                defaultValue: "-",
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: true,
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
        Sakit.belongsTo(models.PenyakitAyam, { foreignKey: 'diagnosisPenyakit' });
        Sakit.hasMany(models.DaftarGejala, { foreignKey: "sakitId" });
    };

    return Sakit;
}