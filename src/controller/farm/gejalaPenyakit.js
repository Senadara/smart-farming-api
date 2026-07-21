const sequelize = require("../../model/index");


const Gejala = sequelize.Gejala;
const PenyakitGejala = sequelize.PenyakitGejala;
const LaporanGejala = sequelize.LaporanGejala;
const CfWeightLog = sequelize.CfWeightLog;

const getGejalaPenyakit = async (req, res) => {
    try {
        const gejala = await Gejala.findAll({
            order: [["updatedAt", "DESC"]],
        });

        if (!gejala) {
            return res.status(404).json({
                message: "Gejala penyakit data not found",
            });
        }

        return res.status(200).json({
            message: "Successfully retrieved gejala penyakit data",
            data: gejala,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            detail: error,
        });
    }
};

const createGejalaPenyakit = async (req, res) => {
    try {
        const { nama_gejala, gambar } = req.body;

        const existingGejala = await Gejala.findOne({
            where: {
                nama_gejala,
            },
        });

        if (existingGejala) {
            return res.status(400).json({
                message: "Gejala penyakit already exists",
            });
        }

        const gejala = await Gejala.create({
            nama_gejala,
            gambar,
        });

        return res.status(200).json({
            message: "Successfully created new gejala penyakit data",
            data: gejala,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            detail: error,
        });
    }
};

const updateGejalaPenyakit = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_gejala, gambar } = req.body;

        const existingGejala = await Gejala.findOne({
            where: {
                id,
            },
        });

        if (!existingGejala) {
            return res.status(404).json({
                message: "Gejala penyakit data not found",
            });
        }

        const gejala = await existingGejala.update({
            nama_gejala,
            gambar,
        });

        return res.status(200).json({
            message: "Successfully updated gejala penyakit data",
            data: gejala,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            detail: error,
        });
    }
};

const deleteGejalaPenyakit = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.sequelize.transaction();

    try {
        const existingGejala = await Gejala.findOne({
            where: { id },
            transaction,
        });

        if (!existingGejala) {
            await transaction.rollback();
            return res.status(404).json({
                message: 'Gejala penyakit data not found',
            });
        }

        // Soft delete: hanya mengisi deletedAt, data relasi tetap aman
        await existingGejala.destroy({ transaction });


        await transaction.commit();

        return res.status(200).json({
            message: 'Successfully deleted gejala penyakit data',
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

module.exports = {
    getGejalaPenyakit,
    createGejalaPenyakit,
    updateGejalaPenyakit,
    deleteGejalaPenyakit,
};
