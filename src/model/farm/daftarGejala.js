module.exports = (sequelize, DataTypes) => {
    const DaftarGejala = sequelize.define(
        "DaftarGejala",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            sakitId: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            gejalaId: {
                type: DataTypes.CHAR(36),
                allowNull: true,
            },
            catatan: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            timestamp: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.literal("CURRENT_TIMESTAMP"),
            },
        },
        {
            tableName: "daftargejala",
            freezeTableName: true,
            timestamps: false,
        }
    );

    DaftarGejala.associate = (models) => {
        DaftarGejala.belongsTo(models.Sakit, { foreignKey: "sakitId" });
        DaftarGejala.belongsTo(models.Gejala, { foreignKey: "gejalaId" });
    };

    return DaftarGejala;
};
