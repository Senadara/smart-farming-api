const sequelize = require("../../model/index");

const Gejala = sequelize.Gejala;

const getGejalaPenyakit = async (req, res) => {
    try {
        const gejala = await Gejala.findAll();

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
        const { id, nama_gejala, gambar } = req.body;

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
    try {
        const { id } = req.body;

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

        const gejala = await existingGejala.destroy();

        return res.status(200).json({
            message: "Successfully deleted gejala penyakit data",
            data: gejala,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
            detail: error,
        });
    }
};

module.exports = {
    getGejalaPenyakit,
    createGejalaPenyakit,
    updateGejalaPenyakit,
    deleteGejalaPenyakit,
};
