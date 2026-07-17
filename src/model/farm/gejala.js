module.exports = (sequelize, DataTypes) => {
    const Gejala = sequelize.define(
        "Gejala",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
                allowNull: false,
                unique: true,
            },
            gejala1: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            gejala2: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            gejala3: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            gejala4: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
        },
        {
            tableName: "gejala",
            freezeTableName: true,
            timestamps: false,
        }
    );

    Gejala.associate = (models) => {
        Gejala.hasMany(models.DaftarGejala, { foreignKey: "gejalaId" });
    };

    return Gejala;
};
