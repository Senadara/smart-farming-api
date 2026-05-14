module.exports = (sequelize, DataTypes) => {
    const PenangananPenyakitAyam = sequelize.define("PenangananPenyakitAyam", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        penanganan: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        tableName: 'penangananPenyakitAyam',
        freezeTableName: true,
    });
    return PenangananPenyakitAyam;
};