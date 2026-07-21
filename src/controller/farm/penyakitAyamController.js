const { v4: uuidv4 } = require('uuid');
const { Op, QueryTypes } = require('sequelize');
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
const StatusLogPenyakitAyam = db.StatusLogPenyakitAyam;
const User = db.User;
const cfHelper = require("../../utils/cfHelper");

const VALID_STATUS = ['Belum Ditangani', 'Pemantauan', 'Sembuh', 'Mati'];

async function describeTableIfExists(tableName, transaction = null) {
    try {
        return await sequelize.getQueryInterface().describeTable(tableName, { transaction });
    } catch (error) {
        const code = error?.original?.code || error?.parent?.code;
        if (
            code === 'ER_NO_SUCH_TABLE' ||
            String(error?.message || '').includes(`No description found for "${tableName}" table`)
        ) {
            return null;
        }

        throw error;
    }
}

async function findPenyakitAyamByIdRaw(id) {
    if (!id) return null;

    const schema = await describeTableIfExists('penyakit_ayam');
    if (!schema) return null;

    const rows = await sequelize.query(
        'SELECT id, nama_penyakit FROM penyakit_ayam WHERE id = :id LIMIT 1',
        {
            replacements: { id },
            type: QueryTypes.SELECT,
        }
    );

    return rows[0] || null;
}

async function findGejalaByIdsRaw(ids = []) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const schema = await describeTableIfExists('gejala');
    if (!schema) return [];

    const labelColumn = schema.nama_gejala ? 'nama_gejala' : (schema.gejala1 ? 'gejala1' : null);
    if (!labelColumn) return [];

    const selectColumns = [
        'id',
        `${labelColumn} AS nama_gejala`,
    ];

    if (schema.gambar) {
        selectColumns.push('gambar');
    }

    const rows = await sequelize.query(
        `
            SELECT ${selectColumns.join(', ')}
            FROM gejala
            WHERE id IN (:ids)
        `,
        {
            replacements: { ids: uniqueIds },
            type: QueryTypes.SELECT,
        }
    );

    return rows.map((row) => ({
        id: row.id,
        nama_gejala: row.nama_gejala,
        gambar: row.gambar ?? null,
    }));
}

async function findPenangananRaw({ penyakitId = null, gejalaIds = [] } = {}) {
    const schema = await describeTableIfExists('penangananPenyakitAyam');
    if (!schema) return [];

    const where = [];
    const replacements = {};

    if (penyakitId && schema.penyakit_id) {
        where.push('penyakit_id = :penyakitId');
        replacements.penyakitId = penyakitId;
    }

    const validGejalaIds = [...new Set(gejalaIds.filter(Boolean))];
    if (validGejalaIds.length > 0 && schema.gejala_id) {
        where.push('gejala_id IN (:gejalaIds)');
        replacements.gejalaIds = validGejalaIds;
    }

    if (where.length === 0) return [];

    if (schema.deletedAt) {
        where.push('deletedAt IS NULL');
    }

    const rows = await sequelize.query(
        `
            SELECT *
            FROM penangananPenyakitAyam
            WHERE ${where.join(' AND ')}
            ORDER BY updatedAt DESC
        `,
        {
            replacements,
            type: QueryTypes.SELECT,
        }
    );

    return rows;
}

async function findStatusLogRaw(sakitId) {
    if (!sakitId) return [];

    const schema = await describeTableIfExists('status_log_penyakit_ayam');
    if (!schema) return [];

    return sequelize.query(
        `
            SELECT *
            FROM status_log_penyakit_ayam
            WHERE laporan_sakit_id = :sakitId
            ORDER BY createdAt ASC
        `,
        {
            replacements: { sakitId },
            type: QueryTypes.SELECT,
        }
    );
}

const getAllPenyakit = async (req, res) => {

    try {
        const penyakit = await PenyakitAyam.findAll({
            order: [["updatedAt", "DESC"]],
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: penyakit,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getPenyakitWithGejala = async (req, res) => {
    try {
        const penyakit = await PenyakitAyam.findAll({
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{ model: Gejala, as: 'gejala' }],
            }],
            order: [["updatedAt", "DESC"]],
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit with gejala data',
            data: penyakit,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getBobotGejalaTiapPenyakit = async (req, res) => {
    try {
        const data = await PenyakitAyam.findAll({
            attributes: ['id', 'nama_penyakit', 'createdAt', 'updatedAt', 'deletedAt'],
            paranoid: false,
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                attributes: ['cf_weight'],
                include: [{ model: Gejala, as: 'gejala', attributes: ['id', 'nama_gejala'] }],
            }],
            order: [["nama_penyakit", "ASC"]],
        });

        // Mapping agar struktur response lebih bersih dan mudah digunakan di frontend
        const result = data.map(penyakit => ({
            id: penyakit.id,
            nama_penyakit: penyakit.nama_penyakit,
            createdAt: penyakit.createdAt,
            updatedAt: penyakit.updatedAt,
            deletedAt: penyakit.deletedAt,
            gejala: penyakit.penyakitGejala.map(pg => ({
                id: pg.gejala?.id,
                nama_gejala: pg.gejala?.nama_gejala,
                bobot: pg.cf_weight
            }))
        }));

        return res.status(200).json({
            message: 'Berhasil mengambil data gejala dan bobot tiap penyakit',
            data: result,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getPenyakitWithPenanganan = async (req, res) => {
    try {
        const PenangananPenyakitAyam = db.PenangananPenyakitAyam;
        const penyakit = await PenyakitAyam.findAll({
            include: [{
                model: PenangananPenyakitAyam,
                as: 'penanganan',
            }],
            order: [["updatedAt", "DESC"]],
        });

        return res.status(200).json({
            message: 'Successfully retrieved penyakit with penanganan data',
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

        const gejalaIds = gejala.map((g) => g.id);

        const daftarGejala = await Gejala.findAll({
            where: { id: gejalaIds },
        });

        const namaGejala = daftarGejala.map((g) => g.nama_gejala)

        const hasil = await cfHelper.diagnosePenyakit(gejala)

        // Penanganan berdasarkan penyakit hasil diagnosa
        // Jika isTie bernilai true (terdapat cfScore sama semua/imbang), maka JANGAN tampilkan penanganan per penyakit
        const penanganan = (hasil?.id && !hasil?.isTie)
            ? await PenangananPenyakitAyam.findAll({
                where: { penyakit_id: hasil.id },
            })
            : [];

        // Penanganan berdasarkan gejala yang dipilih
        const penangananGejala = gejalaIds.length > 0
            ? await PenangananPenyakitAyam.findAll({
                where: { gejala_id: gejalaIds },
                include: [{ model: Gejala, as: 'gejala', attributes: ['id', 'nama_gejala'] }],
            })
            : [];

        return res.status(200).json({
            message: 'Diagnosis berhasil',
            gejala_dipilih: gejala.length,
            data: {
                ...hasil,
                gejala_terdeteksi: namaGejala,
                penanganan,
                penangananGejala,
            }
        })

    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
}


const createPenyakit = async (req, res) => {
    const { nama_penyakit, gejala = [] } = req.body;

    if (!nama_penyakit || !nama_penyakit.trim()) {
        return res.status(400).json({ message: 'nama_penyakit wajib diisi' });
    }
    if (!Array.isArray(gejala) || gejala.length === 0) {
        return res.status(400).json({ message: 'gejala wajib diisi minimal 1 gejala' });
    }

    // Validasi setiap item harus punya { id, bobot }
    const itemTidakValid = gejala.find(
        g => !g.id || typeof g.bobot !== 'number' || g.bobot < 0 || g.bobot > 1
    );
    if (itemTidakValid) {
        return res.status(400).json({
            message: 'Setiap gejala harus memiliki id dan bobot (angka antara 0–1)',
        });
    }

    const transaction = await sequelize.transaction();
    try {
        // Validasi semua gejala id ada di DB
        const gejalaIds = gejala.map(g => g.id);
        const gejalaValid = await Gejala.findAll({
            where: { id: gejalaIds },
            transaction,
        });
        if (gejalaValid.length !== gejalaIds.length) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Satu atau lebih gejala id tidak valid' });
        }

        const penyakit = await PenyakitAyam.create({
            id: uuidv4(),
            nama_penyakit: nama_penyakit.trim(),
        }, { transaction });

        // Simpan bobot langsung dari input user (tidak menggunakan IDF)
        const relasiData = gejala.map(g => ({
            id: uuidv4(),
            penyakit_id: penyakit.id,
            gejala_id: g.id,
            cf_weight: g.bobot,
            disease_frequency: 0,
            total_disease: 0,
            cf_updated_at: new Date(),
            metode: 'manual',
        }));

        await PenyakitGejala.bulkCreate(relasiData, { transaction });

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
            message: 'Penyakit berhasil ditambahkan dengan bobot manual',
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

        // Support single objekBudidayaId atau array objekBudidayaIds
        const objekIds = req.body.objekBudidayaIds && req.body.objekBudidayaIds.length > 0
            ? req.body.objekBudidayaIds
            : (req.body.objekBudidayaId ? [req.body.objekBudidayaId] : [null]);

        // Buat LaporanGejala sekali untuk penyakit ini (tidak terikat per laporan)
        const laporanGejala = await LaporanGejala.bulkCreate(
            (sakit.gejala || []).map((g) => ({
                penyakit_ayam_id: sakit.penyakitAyamId,
                gejala_id: g.id || g.gejala_id,
            })),
            { transaction, ignoreDuplicates: true }
        );

        // Buat satu Laporan + satu Sakit per ObjekBudidaya
        const allLaporan = [];
        const allDataPenyakit = [];

        for (const objekId of objekIds) {
            const data = await Laporan.create(
                {
                    ...req.body,
                    UnitBudidayaId: req.body.unitBudidayaId,
                    ObjekBudidayaId: objekId,
                    UserId: req.user.id,
                },
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

            allLaporan.push(data);
            allDataPenyakit.push(dataPenyakit);
        }

        await transaction.commit();
        res.locals.createdData = { laporan: allLaporan, laporanGejala, dataPenyakit: allDataPenyakit };
        return res.status(201).json({
            message: 'Laporan penyakit berhasil dibuat',
            data: { laporan: allLaporan, laporanGejala, dataPenyakit: allDataPenyakit },
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const updateStatusLaporanPenyakit = async (req, res) => {
    let transaction;
    try {
        const { id } = req.params;
        const { status, catatan } = req.body;
        const userId = req.user?.id ?? null;

        // Validasi nilai status
        if (!VALID_STATUS.includes(status)) {
            return res.status(400).json({
                message: `Status harus salah satu dari: ${VALID_STATUS.join(', ')}`,
            });
        }

        // Cari dataPenyakit (Sakit) via id Sakit atau id Laporan
        let dataPenyakit = await Sakit.findOne({ where: { id } });

        let data;
        if (dataPenyakit) {
            data = await Laporan.findOne({
                where: {
                    id: dataPenyakit.LaporanId,
                    isDeleted: false,
                    tipe: 'sakit',
                },
            });
        } else {
            data = await Laporan.findOne({
                where: { id, isDeleted: false, tipe: 'sakit' },
            });
            if (data) {
                dataPenyakit = await Sakit.findOne({ where: { LaporanId: id } });
            }
        }

        if (!data) {
            return res.status(404).json({ message: 'Laporan penyakit tidak ditemukan' });
        }
        if (!dataPenyakit) {
            return res.status(404).json({ message: 'Data penyakit tidak ditemukan' });
        }

        transaction = await sequelize.transaction();

        // 1. Update status di tabel Sakit
        await dataPenyakit.update(
            { status, updatedAt: new Date() },
            { transaction }
        );

        // 2. Tulis entri log jika tabel status log tersedia di schema aktif.
        const statusLogSchema = await describeTableIfExists('status_log_penyakit_ayam', transaction);
        if (StatusLogPenyakitAyam && statusLogSchema) {
            await StatusLogPenyakitAyam.create(
                {
                    id: uuidv4(),
                    laporan_sakit_id: dataPenyakit.id,
                    status,
                    catatan: catatan ?? null,
                    updated_by: userId,
                },
                { transaction }
            );
        }

        // 3. Jika status diubah menjadi 'Mati', buat laporan kematian otomatis
        if (status === 'Mati') {
            const Kematian = db.Kematian;
            const UnitBudidaya = db.UnitBudidaya;
            const ObjekBudidaya = db.ObjekBudidaya;

            let penyebab = 'Sakit';
            if (dataPenyakit.diagnosisPenyakit) {
                const penyakit = await PenyakitAyam.findByPk(dataPenyakit.diagnosisPenyakit, { transaction });
                if (penyakit) {
                    penyebab = penyakit.nama_penyakit;
                }
            }

            const tanggalMati = req.body.tanggal || req.body.kematian?.tanggal || new Date();
            const laporanKematianData = await Laporan.create(
                {
                    judul: `Laporan Kematian - ${penyebab}`,
                    tipe: "kematian",
                    UnitBudidayaId: data.UnitBudidayaId,
                    ObjekBudidayaId: data.ObjekBudidayaId,
                    UserId: userId,
                    catatan: catatan ?? null,
                },
                { transaction }
            );

            await Kematian.create(
                {
                    LaporanId: laporanKematianData.id,
                    tanggal: tanggalMati,
                    penyebab: penyebab,
                },
                { transaction }
            );

            if (data.ObjekBudidayaId) {
                await ObjekBudidaya.update(
                    { isDeleted: true },
                    { transaction, where: { id: data.ObjekBudidayaId } }
                );
            }

            if (data.UnitBudidayaId) {
                await UnitBudidaya.decrement(
                    "jumlah",
                    { by: 1, transaction, where: { id: data.UnitBudidayaId } }
                );
            }
        }

        await transaction.commit();

        return res.status(200).json({
            message: 'Status laporan penyakit berhasil diperbarui',
            data: { data, dataPenyakit },
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getRiwayatPenyakitAyam = async (req, res) => {
    const { id } = req.params;
    try {
        const ObjekBudidaya = db.ObjekBudidaya;

        const laporan = await Laporan.findAll({
            where: {
                isDeleted: false,
                tipe: "sakit",
                unitBudidayaId: id
            },
            include: [
                {
                    model: Sakit,
                    include: [
                        {
                            model: PenyakitAyam,
                            paranoid: false,
                            attributes: ['nama_penyakit']
                        }
                    ]
                },
                {
                    model: ObjekBudidaya,
                    attributes: ['id', 'namaId'],
                },
            ],
            order: [['createdAt', 'DESC']]
        });

        // Kelompokkan laporan yang dibuat dalam 60 detik dengan diagnosis yang sama
        // sebagai satu entri riwayat (karena 1 sesi bisa menghasilkan N laporan untuk N ayam)
        const groups = [];
        const usedIds = new Set();

        for (const item of laporan) {
            if (usedIds.has(item.id)) continue;

            const data = item.toJSON();
            const diagnosisId = data.Sakit?.diagnosisPenyakitId || data.Sakit?.diagnosisPenyakit;
            const createdTime = new Date(data.createdAt).getTime();

            // Cari laporan lain yang merupakan bagian dari sesi yang sama
            const siblings = laporan.filter(other => {
                if (usedIds.has(other.id) || other.id === item.id) return false;
                const otherData = other.toJSON();
                const otherDiagnosis = otherData.Sakit?.diagnosisPenyakitId || otherData.Sakit?.diagnosisPenyakit;
                const otherTime = new Date(otherData.createdAt).getTime();
                return otherDiagnosis === diagnosisId && Math.abs(otherTime - createdTime) <= 60000;
            });

            // Tandai semua laporan dalam grup ini sebagai sudah diproses
            usedIds.add(item.id);
            siblings.forEach(s => usedIds.add(s.id));

            // Format nama penyakit
            if (data.Sakit) {
                data.Sakit.diagnosisPenyakit = data.Sakit.PenyakitAyam
                    ? data.Sakit.PenyakitAyam.nama_penyakit
                    : "Unknown";
                delete data.Sakit.PenyakitAyam;
            }

            // Kumpulkan semua ObjekBudidaya (ayam) yang terlibat
            const allObjek = [data.ObjekBudidaya, ...siblings.map(s => s.toJSON().ObjekBudidaya)]
                .filter(Boolean);

            // Kumpulkan semua Laporan ID dalam grup
            const allLaporanIds = [data.id, ...siblings.map(s => s.id)];

            groups.push({
                ...data,
                objekBudidayaList: allObjek,
                laporanIds: allLaporanIds,
            });
        }

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: groups,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};


const getRiwayatPenyakitAyamById = async (req, res) => {
    try {
        const { id } = req.params;
        const ObjekBudidaya = db.ObjekBudidaya;

        const laporan = await Laporan.findOne({
            where: {
                id,
                isDeleted: false,
                tipe: "sakit",
            },
            include: [
                { model: Sakit },
                { model: ObjekBudidaya, attributes: ['id', 'namaId'] },
            ],
        });

        if (!laporan) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan' });
        }

        const diagnosisPenyakitId = laporan.Sakit.diagnosisPenyakit;

        // Cari laporan saudara: unit sama, penyakit sama, dibuat dalam 60 detik
        const siblingLaporan = await Laporan.findAll({
            where: {
                isDeleted: false,
                tipe: "sakit",
                UnitBudidayaId: laporan.UnitBudidayaId,
            },
            include: [
                {
                    model: Sakit,
                    where: { diagnosisPenyakit: diagnosisPenyakitId },
                    required: true,
                },
                { model: ObjekBudidaya, attributes: ['id', 'namaId'] },
            ],
        });

        // Filter yang dibuat dalam 60 detik dari laporan utama
        const mainTime = new Date(laporan.createdAt).getTime();
        const relatedLaporan = siblingLaporan.filter(l =>
            Math.abs(new Date(l.createdAt).getTime() - mainTime) <= 60000
        );

        // Kumpulkan semua ObjekBudidaya dari sesi ini
        const objekBudidayaList = relatedLaporan
            .map(l => l.ObjekBudidaya)
            .filter(Boolean);

        // Kumpulkan semua Laporan ID dalam sesi ini
        const laporanIds = relatedLaporan.map(l => l.id);

        const namaPenyakit = await findPenyakitAyamByIdRaw(diagnosisPenyakitId);

        const laporanGejalaList = await LaporanGejala.findAll({
            where: {
                penyakit_ayam_id: diagnosisPenyakitId,
            }
        });

        const gejalaIds = laporanGejalaList.map((g) => g.gejala_id);
        const listGejala = await findGejalaByIdsRaw(gejalaIds);

        const penanganan = await findPenangananRaw({ penyakitId: diagnosisPenyakitId });

        // Ambil penanganan yang terikat pada gejala-gejala yang terdeteksi di laporan ini
        const penangananGejala = await findPenangananRaw({
            gejalaIds: listGejala.map((g) => g.id),
        });

        // Ambil riwayat status log untuk Sakit yang bersangkutan
        const statusLog = laporan.Sakit
            ? await findStatusLogRaw(laporan.Sakit.id)
            : [];

        return res.status(200).json({
            message: 'Successfully retrieved penyakit data',
            data: {
                laporan,
                catatan: laporan.catatan ?? null,
                gambar: laporan.gambar ?? null,
                objekBudidayaList,
                laporanIds,
                namaPenyakit,
                listGejala,
                penanganan,
                penangananGejala,
                statusLog,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }

};

const createPenangananPenyakitAyam = async (req, res) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        const { tipe, id_penyakit, id_gejala, catatan, gambar } = req.body;

        // Validasi tipe wajib
        if (!tipe || !['penyakit', 'gejala'].includes(tipe)) {
            await transaction.rollback();
            return res.status(400).json({
                message: "tipe wajib diisi dengan nilai 'penyakit' atau 'gejala'",
            });
        }

        let penyakitId = null;
        let gejalaId = null;

        if (tipe === 'penyakit') {
            // Validasi penyakit ada
            if (!id_penyakit) {
                await transaction.rollback();
                return res.status(400).json({ message: 'id_penyakit wajib diisi untuk tipe penyakit' });
            }
            const existingPenyakit = await PenyakitAyam.findOne({
                where: { id: id_penyakit },
                transaction,
            });
            if (!existingPenyakit) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Penyakit tidak ditemukan' });
            }
            penyakitId = id_penyakit;
        } else if (tipe === 'gejala') {
            // Validasi gejala ada
            if (!id_gejala) {
                await transaction.rollback();
                return res.status(400).json({ message: 'id_gejala wajib diisi untuk tipe gejala' });
            }
            const existingGejala = await Gejala.findOne({
                where: { id: id_gejala },
                transaction,
            });
            if (!existingGejala) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Gejala tidak ditemukan' });
            }
            gejalaId = id_gejala;
        }

        // Simpan penanganan
        const data = await PenangananPenyakitAyam.create(
            {
                id: uuidv4(),
                penyakit_id: penyakitId,
                gejala_id: gejalaId,
                penanganan: catatan,
                gambar: gambar,
            },
            { transaction }
        );

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



const updatePenangananPenyakitAyam = async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan, gambar } = req.body;

        const existingPenanganan = await PenangananPenyakitAyam.findOne({
            where: { id },
        });

        if (!existingPenanganan) {
            return res.status(404).json({ message: 'Penanganan tidak ditemukan' });
        }

        await existingPenanganan.update({
            ...(catatan !== undefined && { penanganan: catatan }),
            ...(gambar !== undefined && { gambar }),
            updatedAt: new Date(),
        });

        // Update updatedAt pada PenyakitAyam induk
        const existingPenyakit = await PenyakitAyam.findByPk(existingPenanganan.penyakit_id);
        if (existingPenyakit) {
            existingPenyakit.changed('nama_penyakit', true);
            await existingPenyakit.save();
        }

        return res.status(200).json({
            message: 'Penanganan penyakit berhasil diupdate',
            data: existingPenanganan,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};



const deletePenangananPenyakitAyam = async (req, res) => {
    try {
        const { id } = req.params;

        const existingPenanganan = await PenangananPenyakitAyam.findOne({
            where: { id },
        });

        if (!existingPenanganan) {
            return res.status(404).json({ message: 'Penanganan tidak ditemukan' });
        }

        // Soft delete: mengisi deletedAt
        await existingPenanganan.destroy();

        return res.status(200).json({
            message: 'Penanganan penyakit berhasil dihapus',
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const updatePenyakit = async (req, res) => {
    const { id } = req.params;
    const { nama_penyakit, gejala } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const existingPenyakit = await PenyakitAyam.findOne({
            where: { id },
            transaction,
        });

        if (!existingPenyakit) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Penyakit tidak ditemukan' });
        }

        if (nama_penyakit !== undefined) {
            await existingPenyakit.update(
                { nama_penyakit: nama_penyakit.trim() },
                { transaction }
            );
        }

        if (Array.isArray(gejala) && gejala.length > 0) {
            // Validasi setiap item harus punya { id, bobot }
            const itemTidakValid = gejala.find(
                g => !g.id || typeof g.bobot !== 'number' || g.bobot < 0 || g.bobot > 1
            );
            if (itemTidakValid) {
                await transaction.rollback();
                return res.status(400).json({
                    message: 'Setiap gejala harus memiliki id dan bobot (angka antara 0–1)',
                });
            }

            // Validasi semua gejala id ada di DB
            const gejalaIds = gejala.map(g => g.id);
            const gejalaValid = await Gejala.findAll({
                where: { id: gejalaIds },
                transaction,
            });
            if (gejalaValid.length !== gejalaIds.length) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Satu atau lebih gejala id tidak valid' });
            }

            // Ambil id relasi lama untuk hapus CfWeightLog terkait
            const relasiLama = await PenyakitGejala.findAll({
                where: { penyakit_id: id },
                transaction,
            });
            const relasiLamaIds = relasiLama.map(r => r.id);

            // Hapus CfWeightLog yang mereferensikan relasi lama (FK constraint)
            if (relasiLamaIds.length > 0) {
                await CfWeightLog.destroy({
                    where: { penyakit_gejala_id: relasiLamaIds },
                    transaction,
                });
            }

            // Hapus relasi lama
            await PenyakitGejala.destroy({
                where: { penyakit_id: id },
                transaction,
            });

            // Buat relasi baru dengan bobot langsung dari input user
            const relasiData = gejala.map(g => ({
                id: uuidv4(),
                penyakit_id: id,
                gejala_id: g.id,
                cf_weight: g.bobot,
                disease_frequency: 0,
                total_disease: 0,
                cf_updated_at: new Date(),
                metode: 'manual',
            }));
            await PenyakitGejala.bulkCreate(relasiData, { transaction });
        }

        // Pastikan updatedAt PenyakitAyam selalu diperbarui dengan memanipulasi _changed
        existingPenyakit.changed('nama_penyakit', true);
        await existingPenyakit.save({ transaction });

        await transaction.commit();

        const result = await PenyakitAyam.findByPk(id, {
            include: [{
                model: PenyakitGejala,
                as: 'penyakitGejala',
                include: [{ model: Gejala, as: 'gejala' }],
            }],
        });

        return res.status(200).json({
            message: 'Penyakit berhasil diupdate dengan bobot manual',
            data: result,
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const deletePenyakit = async (req, res) => {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
        const existingPenyakit = await PenyakitAyam.findOne({
            where: { id },
            transaction,
        });

        if (!existingPenyakit) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Penyakit tidak ditemukan' });
        }

        // Soft delete: mengisi deletedAt
        await existingPenyakit.destroy({ transaction });

        await transaction.commit();

        return res.status(200).json({
            message: 'Penyakit berhasil dihapus',
        });
    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ message: error.message, detail: error });
    }
};



const getStatistikPenyakitAyam = async (req, res) => {
    try {
        const { unitBudidayaId, year } = req.query;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();
        
        const whereClause = {
            isDeleted: false,
            tipe: "sakit"
        };
        
        if (unitBudidayaId) {
            whereClause.UnitBudidayaId = unitBudidayaId;
        }

        const laporan = await Laporan.findAll({
            where: whereClause,
            include: [
                {
                    model: Sakit,
                    include: [
                        {
                            model: PenyakitAyam,
                            paranoid: false,
                            attributes: ['nama_penyakit']
                        }
                    ]
                },
            ]
        });

        const stats = {};

        laporan.forEach(item => {
            const date = new Date(item.createdAt);
            if (date.getFullYear() === currentYear) {
                const month = date.getMonth(); // 0 to 11
                const penyakit = item.Sakit?.PenyakitAyam?.nama_penyakit || "Unknown";
                
                if (!stats[penyakit]) {
                    stats[penyakit] = Array(12).fill(0);
                }
                
                stats[penyakit][month] += 1;
            }
        });

        // Format untuk frontend chart
        const chartData = Object.keys(stats).map(penyakit => ({
            name: penyakit,
            data: stats[penyakit] // Array 12 elemen (Jan-Des)
        }));

        return res.status(200).json({
            message: 'Berhasil mengambil statistik penyakit ayam',
            year: currentYear,
            data: chartData,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};

const getPenangananByGejala = async (req, res) => {
    try {
        // Support query: ?gejala_ids=id1,id2,id3  atau  ?gejala_ids[]=id1&gejala_ids[]=id2
        let gejalaIds = req.query.gejala_ids;
        if (!gejalaIds) {
            return res.status(400).json({ message: 'gejala_ids wajib diisi (pisahkan dengan koma atau kirim sebagai array)' });
        }

        // Normalisasi: bisa string CSV atau array
        if (typeof gejalaIds === 'string') {
            gejalaIds = gejalaIds.split(',').map((id) => id.trim()).filter(Boolean);
        }

        if (!Array.isArray(gejalaIds) || gejalaIds.length === 0) {
            return res.status(400).json({ message: 'gejala_ids tidak boleh kosong' });
        }

        const penanganan = await PenangananPenyakitAyam.findAll({
            where: { gejala_id: gejalaIds },
            include: [
                { model: Gejala, as: 'gejala', attributes: ['id', 'nama_gejala'] },
            ],
        });

        return res.status(200).json({
            message: 'Berhasil mengambil penanganan berdasarkan gejala',
            data: penanganan,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message, detail: error });
    }
};


module.exports = {
    getAllPenyakit,
    getPenyakitWithGejala,
    getBobotGejalaTiapPenyakit,
    getPenyakitWithPenanganan,
    getRiwayatPenyakitAyam,
    getRiwayatPenyakitAyamById,
    getPenangananPenyakitAyamById,
    getPenangananByGejala,
    getStatistikPenyakitAyam,
    diagnosaPenyakitAyam,
    createLaporanPenyakit,
    createPenyakit,
    createPenangananPenyakitAyam,
    updatePenyakit,
    updatePenangananPenyakitAyam,
    deletePenangananPenyakitAyam,
    updateStatusLaporanPenyakit,
    deletePenyakit,
};
