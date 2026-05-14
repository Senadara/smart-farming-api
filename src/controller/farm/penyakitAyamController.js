const { v4: uuidv4 } = require('uuid');
const db = require('../../model/index');

const sequelize = db.sequelize;
const PenyakitAyam = db.PenyakitAyam;
const Sakit = db.Sakit;
const LaporanGejala = db.LaporanGejala;
const Laporan = db.Laporan;
const PenyakitGejala = db.PenyakitGejala;
const Gejala = db.Gejala;
const CfWeightLog = db.CfWeightLog;
const PenangananPenyakitAyam = db.PenangananPenyakitAyam;
const cfHelper = require("../../utils/cfHelper");

const getAllPenyakit = async (req, res) => {

    try {
        const penyakit = await PenyakitAyam.findAll();

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: penyakit,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const diagnosaPenyakitAyam = async (req, res) => {
    try {
        const { gejala = [] } = req.body

        if (!Array.isArray(gejala) || gejala.length === 0) {
            return res.status(400).json({
                message: "Gejala tidak boleh kosong"
            });
        }

        const daftarGejala = await Gejala.findAll({
            where: {
                id: gejala.map((g) => g.id)
            },
        });

        const namaGejala = daftarGejala.map((g) => g.nama_gejala)

        const hasil = await cfHelper.diagnosePenyakit(gejala)

        const penyakitGejala = await PenyakitGejala.findAll({
            where: { penyakit_id: hasil?.id },
        });

        // Kumpulkan penanganan_id unik (filter null)
        const penangananIds = [...new Set(
            penyakitGejala
                .map(pg => pg.penanganan_id)
                .filter(id => id != null)
        )];

        // Ambil data penanganan berdasarkan id
        const { Op } = require('sequelize');
        const penanganan = penangananIds.length > 0
            ? await PenangananPenyakitAyam.findAll({
                where: { id: { [Op.in]: penangananIds } },
              })
            : [];

        return res.status(200).json({
            message: 'Diagnosis berhasil',
            gejala_dipilih: gejala.length,
            data: {
                ...hasil,
                gejala_terdeteksi: namaGejala,
                penanganan,
            }
        })

    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
}

const createPenyakit = async (req, res) => {
    const { nama_penyakit, gejala_ids = [], metode = 'idf' } = req.body;

    if (!nama_penyakit || !nama_penyakit.trim()) {
        return res.status(400).json({ message: 'nama_penyakit wajib diisi' });
    }
    if (!Array.isArray(gejala_ids) || gejala_ids.length === 0) {
        return res.status(400).json({ message: 'gejala_ids wajib diisi minimal 1 gejala' });
    }

    const transaction = await sequelize.transaction();
    try {
        // Validasi gejala_ids ada di DB
        const gejalaValid = await Gejala.findAll({
            where: { id: gejala_ids },
            transaction,
        });
        if (gejalaValid.length !== gejala_ids.length) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Satu atau lebih gejala_id tidak valid' });
        }

        const penyakit = await PenyakitAyam.create({
            id: uuidv4(),
            nama_penyakit: nama_penyakit.trim(),
        }, { transaction });

        // const penanganan = await PenangananPenyakitAyam.create({
        //     id: uuidv4(),
        //     penyakit_id: penyakit.id,
        //     penanganan: req.body.penanganan,
        // }, { transaction });

        const relasiData = gejala_ids.map(gejalaId => ({
            id: uuidv4(),
            penyakit_id: penyakit.id,
            gejala_id: gejalaId,
            cf_weight: 0,
            // penanganan_id: penanganan.id,
            metode,
        }));

        await PenyakitGejala.bulkCreate(relasiData, { transaction });

        // 3. Recalculate seluruh bobot CF karena N bertambah
        await _recalculateCF(transaction, metode);

        await transaction.commit();

        // Ambil data lengkap untuk response
        const result = await PenyakitAyam.findByPk(penyakit.id, {
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{ model: Gejala, as: 'gejala' }],
            }],
        });

        return res.status(201).json({
            message: 'Penyakit berhasil ditambahkan dan bobot CF otomatis dihitung ulang',
            data: result,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const createLaporanPenyakit = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { sakit } = req.body;

        const data = await Laporan.create(
            {
                ...req.body,
                UnitBudidayaId: req.body.unitBudidayaId,
                ObjekBudidayaId: req.body.objekBudidayaId,
                UserId: req.user.id,
            },
            { transaction }
        );
        const laporanGejala = await LaporanGejala.bulkCreate(
            (sakit.gejala || []).map((g) => ({
                penyakit_ayam_id: sakit.penyakitAyamId,
                gejala_id: g.id || g.gejala_id,
            })),
            { transaction }
        );
        const dataPenyakit = await Sakit.create(
            {
                LaporanId: data.id,
                diagnosisPenyakit: sakit.penyakitAyamId,
                status: req.body.status,
            },
            { transaction }
        );

        await transaction.commit();
        res.locals.createdData = { data, laporanGejala, dataPenyakit };
        return res.status(201).json({
            message: 'Laporan penyakit berhasil dibuat',
            data: { data, laporanGejala, dataPenyakit },
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getRiwayatPenyakitAyam = async (req, res) => {
    try {

        const laporan = await Laporan.findAll({
            where: {
                isDeleted: false,
                tipe: "sakit",
            },
            include: [
                {
                    model: Sakit,
                },
            ],
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: laporan,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getRiwayatPenyakitAyamById = async (req, res) => {
    try {
        const { id } = req.params;
        const laporan = await Laporan.findOne({
            where: {
                id,
                isDeleted: false,
                tipe: "sakit",
            },
            include: [
                {
                    model: Sakit,
                },
            ],
        });

        const namaPenyakit = await PenyakitAyam.findOne({
            where: {
                id: laporan.Sakit.diagnosisPenyakit,
            },
        });

        const laporanGejalaList = await LaporanGejala.findAll({
            where: {
                penyakit_ayam_id: laporan.Sakit.diagnosisPenyakit,
            }
        });

        const listGejala = await Gejala.findAll({
            where: {
                id: laporanGejalaList.map((g) => g.gejala_id),
            },
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: { laporan, namaPenyakit, listGejala },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const createPenangananPenyakitAyam = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { id_penyakit, catatan, gambar } = req.body;

        const data = await PenangananPenyakitAyam.create(
            {
                id: uuidv4(),
                penyakit_id: id_penyakit,
                penanganan: catatan,
                gambar: gambar,
            },
            { transaction }
        );

        const penyakitAyam = await PenyakitGejala.findAll({
            where: {
                penyakit_id: id_penyakit,
            },
            transaction
        });

        for (const item of penyakitAyam) {
            await item.update(
                {
                    penanganan_id: data.id,
                },
                { transaction }
            );
        }

        await transaction.commit();
        res.locals.createdData = { data };
        return res.status(201).json({
            message: 'Penanganan penyakit berhasil dibuat',
            data: { data },
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getPenangananPenyakitAyamById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await PenangananPenyakitAyam.findOne({
            where: {
                id,
            },
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const _recalculateCF = async (transaction, metode = 'idf') => {
    const allRelasi = await PenyakitGejala.findAll({ transaction });

    const uniquePenyakitIds = [...new Set(allRelasi.map(r => r.penyakit_id))];
    const N = uniquePenyakitIds.length;

    const dfMap = {};
    for (const r of allRelasi) {
        dfMap[r.gejala_id] = (dfMap[r.gejala_id] || 0) + 1;
    }

    for (const r of allRelasi) {
        const df = dfMap[r.gejala_id] || 1;
        const cfBaru = cfHelper.computeCF(df, N, metode);

        await CfWeightLog.create({
            id: uuidv4(),
            penyakit_gejala_id: r.id,
            cf_weight_lama: r.cf_weight,
            cf_weight_baru: cfBaru,
            total_disease_lama: r.total_disease,
            triggered_by: `recalculate_${metode}`,
        }, { transaction });

        await r.update({
            cf_weight: cfBaru,
            disease_frequency: df,
            total_disease: N,
            metode,
            cf_updated_at: new Date(),
        }, { transaction });
    }
};



module.exports = {
    getAllPenyakit,
    getRiwayatPenyakitAyam,
    getRiwayatPenyakitAyamById,
    getPenangananPenyakitAyamById,
    diagnosaPenyakitAyam,
    createLaporanPenyakit,
    createPenyakit,
    createPenangananPenyakitAyam,
    _recalculateCF,
};  