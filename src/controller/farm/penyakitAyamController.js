const { v4: uuidv4 } = require('uuid');
const db = require('../../model/index');

const sequelize = db.sequelize;
const PenyakitAyam = db.PenyakitAyam;
const PenyakitGejala = db.PenyakitGejala;
const Gejala = db.Gejala;
const CfWeightLog = db.CfWeightLog;

const { computeCF } = require('../../utils/cfHelper');

// ─────────────────────────────────────────────
// Helper internal: hitung ulang semua bobot CF
// ─────────────────────────────────────────────
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
        const cfBaru = computeCF(df, N, metode);

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

const getAllPenyakit = async (req, res) => {
    try {
        const penyakit = await PenyakitAyam.findAll({
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{
                    model: Gejala,
                    as: 'gejala',
                    attributes: ['id', 'nama_gejala', 'gambar'],
                }],
            }],
            order: [['nama_penyakit', 'ASC']],
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: penyakit,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getPenyakitById = async (req, res) => {
    try {
        const penyakit = await PenyakitAyam.findByPk(req.params.id, {
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{ model: Gejala, as: 'gejala' }],
            }],
        });

        if (!penyakit) {
            return res.status(404).json({ message: 'Penyakit not found' });
        }

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: penyakit,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

// ─────────────────────────────────────────────
// POST /penyakit
// Tambah penyakit baru + gejala sekaligus
// Body: { nama_penyakit, gejala_ids: [], metode? }
//
// Flow:
// 1. Buat penyakit baru
// 2. Buat relasi penyakit_gejala (cf_weight = 0 dulu)
// 3. Recalculate semua bobot CF (N bertambah)
// ─────────────────────────────────────────────

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

        // 1. Buat penyakit
        const penyakit = await PenyakitAyam.create({
            id: uuidv4(),
            nama_penyakit: nama_penyakit.trim(),
        }, { transaction });

        // 2. Buat relasi penyakit–gejala (bobot 0, akan diisi recalculate)
        const relasiData = gejala_ids.map(gejalaId => ({
            id: uuidv4(),
            penyakit_id: penyakit.id,
            gejala_id: gejalaId,
            cf_weight: 0,
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

// ─────────────────────────────────────────────
// PUT /penyakit/:id
// Update nama penyakit dan/atau daftar gejala
// Body: { nama_penyakit?, gejala_ids?: [], metode? }
// ─────────────────────────────────────────────
const updatePenyakit = async (req, res) => {
    const { nama_penyakit, gejala_ids, metode = 'idf' } = req.body;
    const transaction = await sequelize.transaction();
    try {
        const penyakit = await PenyakitAyam.findByPk(req.params.id, { transaction });
        if (!penyakit) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Penyakit not found' });
        }

        // Update nama jika ada
        if (nama_penyakit && nama_penyakit.trim()) {
            await penyakit.update({ nama_penyakit: nama_penyakit.trim() }, { transaction });
        }

        // Update relasi gejala jika ada
        if (Array.isArray(gejala_ids)) {
            // Hapus relasi lama
            const relasiLama = await PenyakitGejala.findAll({
                where: { penyakit_id: penyakit.id },
                transaction,
            });

            // Catat log penghapusan relasi lama
            if (relasiLama.length > 0) {
                const logHapus = relasiLama.map(r => ({
                    id: uuidv4(),
                    penyakit_gejala_id: r.id,
                    cf_weight_lama: r.cf_weight,
                    cf_weight_baru: 0,
                    total_disease_lama: r.total_disease,
                    triggered_by: 'update_penyakit',
                }));
                await CfWeightLog.bulkCreate(logHapus, { transaction });
                await PenyakitGejala.destroy({
                    where: { penyakit_id: penyakit.id },
                    transaction,
                });
            }

            // Validasi & buat relasi baru
            if (gejala_ids.length > 0) {
                const gejalaValid = await Gejala.findAll({
                    where: { id: gejala_ids },
                    transaction,
                });
                if (gejalaValid.length !== gejala_ids.length) {
                    await transaction.rollback();
                    return res.status(400).json({ message: 'Satu atau lebih gejala_id tidak valid' });
                }

                const relasiData = gejala_ids.map(gejalaId => ({
                    id: uuidv4(),
                    penyakit_id: penyakit.id,
                    gejala_id: gejalaId,
                    cf_weight: 0,
                    metode,
                }));
                await PenyakitGejala.bulkCreate(relasiData, { transaction });
            }
        }

        // Recalculate semua bobot karena df gejala berubah
        await _recalculateCF(transaction, metode);
        await transaction.commit();

        const result = await PenyakitAyam.findByPk(penyakit.id, {
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{ model: Gejala, as: 'gejala' }],
            }],
        });

        return res.status(200).json({
            message: 'Penyakit berhasil diupdate dan bobot CF dihitung ulang',
            data: result,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

// ─────────────────────────────────────────────
// DELETE /penyakit/:id
// Hapus penyakit + relasi gejala, lalu recalculate
// ─────────────────────────────────────────────
const deletePenyakit = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const penyakit = await PenyakitAyam.findByPk(req.params.id, { transaction });
        if (!penyakit) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Penyakit not found' });
        }

        await PenyakitGejala.destroy({
            where: { penyakit_id: penyakit.id },
            transaction,
        });
        await penyakit.destroy({ transaction });

        // Recalculate karena N berkurang
        await _recalculateCF(transaction, 'idf');
        await transaction.commit();

        return res.status(200).json({
            message: 'Penyakit berhasil dihapus dan bobot CF dihitung ulang',
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

// ─────────────────────────────────────────────
// POST /penyakit/recalculate-cf
// Trigger recalculate manual dengan pilihan metode
// Body: { metode: 'idf' | 'ratio' | 'entropy' }
// ─────────────────────────────────────────────
const recalculateCFManual = async (req, res) => {
    const { metode = 'idf' } = req.body;
    const metodValid = ['idf', 'ratio', 'entropy'];
    if (!metodValid.includes(metode)) {
        return res.status(400).json({
            message: `Metode tidak valid. Pilih salah satu: ${metodValid.join(', ')}`,
        });
    }

    const transaction = await sequelize.transaction();
    try {
        await _recalculateCF(transaction, metode);
        await transaction.commit();

        // Ambil ringkasan hasil
        const bobotTerbaru = await PenyakitGejala.findAll({
            include: [
                { model: PenyakitAyam, as: 'penyakit', attributes: ['nama_penyakit'] },
                { model: Gejala, as: 'gejala', attributes: ['nama_gejala'] },
            ],
            order: [['cf_weight', 'DESC']],
        });

        return res.status(200).json({
            message: `Bobot CF berhasil dihitung ulang dengan metode ${metode.toUpperCase()}`,
            metode,
            total_relasi: bobotTerbaru.length,
            data: bobotTerbaru,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

// ─────────────────────────────────────────────
// GET /penyakit/bobot-cf
// Lihat semua bobot CF saat ini
// ─────────────────────────────────────────────
const getBobotCF = async (req, res) => {
    try {
        const bobot = await PenyakitGejala.findAll({
            include: [
                { model: PenyakitAyam, as: 'penyakit', attributes: ['id', 'nama_penyakit'] },
                { model: Gejala, as: 'gejala', attributes: ['id', 'nama_gejala'] },
            ],
            order: [
                [{ model: PenyakitAyam, as: 'penyakit' }, 'nama_penyakit', 'ASC'],
                ['cf_weight', 'DESC'],
            ],
        });

        return res.status(200).json({
            message: 'Successfully retrieved bobot CF',
            data: bobot,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

// ─────────────────────────────────────────────
// GET /penyakit/cf-log
// Riwayat perubahan bobot CF
// ─────────────────────────────────────────────
const getCfLog = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await CfWeightLog.findAll({
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [
                    { model: PenyakitAyam, as: 'penyakit', attributes: ['nama_penyakit'] },
                    { model: Gejala, as: 'gejala', attributes: ['nama_gejala'] },
                ],
            }],
            order: [['createdAt', 'DESC']],
            limit,
        });

        return res.status(200).json({
            message: 'Successfully retrieved CF weight log',
            data: logs,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

module.exports = {
    getAllPenyakit,
    getPenyakitById,
    createPenyakit,
    updatePenyakit,
    deletePenyakit,
    recalculateCFManual,
    getBobotCF,
    getCfLog,
};