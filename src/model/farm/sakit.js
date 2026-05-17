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