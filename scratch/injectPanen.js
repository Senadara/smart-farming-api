const { v4: uuidv4 } = require('uuid');
const db = require('../src/model/index');

const excludedIds = [
    '2923225d-a73b-49bb-a095-1c1b91edfa91',
    'fa2215cf-cb77-4c68-a962-8c211e87853f',
    '199a78f2-54d9-4b28-98b8-75f496f83aaf',
    '8b1892b1-5978-4058-af14-9ca3a9874265',
    '73c372b7-92b7-4f05-b038-bb20c71c53f1'
];

const injectData = async () => {
    const t = await db.sequelize.transaction();
    try {
        // Find the unit budidaya from one of the excluded chickens
        const sampleAyam = await db.ObjekBudidaya.findOne({
            where: { id: excludedIds[0] }
        });

        if (!sampleAyam) {
            console.log("Ayam pengecualian tidak ditemukan di database.");
            return;
        }

        const unitBudidayaId = sampleAyam.UnitBudidayaId;
        console.log("Ditemukan UnitBudidayaId:", unitBudidayaId);

        // Get any user
        const user = await db.User.findOne();
        const userId = user ? user.id : null;

        // Get komoditas (assume first active one)
        const komoditas = await db.Komoditas.findOne({ where: { isDeleted: false } });
        const komoditasId = komoditas ? komoditas.id : null;

        if (!userId || !komoditasId) {
            console.log("User atau Komoditas tidak ditemukan, pastikan data master tersedia.");
            return;
        }

        const allAyam = await db.ObjekBudidaya.findAll({
            where: { UnitBudidayaId: unitBudidayaId, isDeleted: false }
        });

        const ayamToHarvest = allAyam.filter(a => !excludedIds.includes(a.id));
        console.log(`Total ayam di kandang: ${allAyam.length}. Ayam yang dipanen (setelah dipotong 3): ${ayamToHarvest.length}`);

        for (let i = 1; i <= 5; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // 1. Create Laporan
            const laporan = await db.Laporan.create({
                id: uuidv4(),
                judul: `Laporan Panen Telur (Inject H-${i})`,
                tipe: 'panen',
                UnitBudidayaId: unitBudidayaId,
                UserId: userId,
                createdAt: date,
                updatedAt: date
            }, { transaction: t });

            // 2. Create Panen
            const panen = await db.Panen.create({
                id: uuidv4(),
                LaporanId: laporan.id,
                komoditasId: komoditasId,
                jumlah: ayamToHarvest.length, // 1 butir per ayam
                jumlahHewan: ayamToHarvest.length,
                createdAt: date,
                updatedAt: date
            }, { transaction: t });

            // 3. Create Detail Panen
            const detailPanenData = ayamToHarvest.map(ayam => ({
                id: uuidv4(),
                PanenId: panen.id,
                ObjekBudidayaId: ayam.id,
                createdAt: date,
                updatedAt: date
            }));

            await db.DetailPanen.bulkCreate(detailPanenData, { transaction: t });
            console.log(`Berhasil membuat data panen untuk tanggal ${date.toISOString().split('T')[0]}`);
        }

        await t.commit();
        console.log("✨ Inject data selama 5 hari ke belakang berhasil dilakukan!");
    } catch (e) {
        await t.rollback();
        console.error("Gagal melakukan inject data:", e);
    } finally {
        process.exit();
    }
}

injectData();
