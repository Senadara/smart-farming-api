const sequelize = require("../model/index");
const Gejala = sequelize.Gejala;
const PenyakitGejala = sequelize.PenyakitGejala;
const PenyakitAyam = sequelize.PenyakitAyam;

/**
 * Hitung bobot CF satu gejala terhadap semua penyakit (IDF)
 */
const computeCF = (df, n, metode = 'idf') => {
    if (n <= 1) return 0.50;

    let cf;
    switch (metode) {
        case 'ratio':
            cf = 0.9 * (1 - (df - 1) / n);
            break;

        case 'entropy': {
            const p = 1 / df;
            const H = (p > 0 && p < 1)
                ? -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p))
                : 0;
            const maxH = Math.log2(n) || 1;
            cf = 1 - H / maxH;
            break;
        }

        default: // idf
            cf = Math.log(n / df) / Math.log(n);
    }

    return Math.round(Math.min(0.90, Math.max(0.20, cf)) * 100) / 100;
};



const combineCF = (cfLama, cfBaru) => {
    return cfLama + cfBaru * (1 - cfLama);
};

const diagnosePenyakit = async (gejalaInput) => {
    // #1 Ambil data knowledge base yang relevan
    const knowledgeBase = await PenyakitGejala.findAll({
        where: {
            gejala_id: gejalaInput.map((g) => g.id)
        },
        include: [
            {
                model: Gejala,
                as: 'gejala',
                attributes: ['nama_gejala']
            },
            {
                model: PenyakitAyam,
                as: 'penyakit',
                attributes: ['id', 'nama_penyakit'],
                required: true
            }
        ]
    });

    // #2 Pengelompokan gejala berdasarkan penyakit
    const grouped = {};

    for (const kb of knowledgeBase) {
        const penyakitId = kb.penyakit?.id ?? 'unknown';
        const namaPenyakit = kb.penyakit?.nama_penyakit ?? 'Unknown';
        const userInput = gejalaInput.find(g => g.id === kb.gejala_id);
        
        const cfUser = userInput ? (userInput.cf ?? userInput.cf_user ?? 1) : 0;
        const cfWeight = parseFloat(kb.cf_weight || 0);
        
        const cfE = cfWeight * cfUser;

        if (!grouped[penyakitId]) {
            grouped[penyakitId] = {
                id: penyakitId,
                nama: namaPenyakit,
                bobotList: []
            };
        }
        grouped[penyakitId].bobotList.push(cfE);
    }

    // #3 Hitung kombinasi CF untuk setiap penyakit
    const hasil = Object.values(grouped).map((p) => {
        const cfAkhir = p.bobotList.reduce((cfLama, cfBaru) => combineCF(cfLama, cfBaru), 0);

        return {
            id: p.id,
            penyakit: p.nama,
            cf_score: parseFloat(cfAkhir.toFixed(4)),
            persentase: parseFloat((cfAkhir * 100).toFixed(2)),
            jumlah_gejala_cocok: p.bobotList.length
        };
    });

    // #4 Urutkan: utama dari skor tertinggi, tiebreaker jumlah gejala cocok terbanyak
    hasil.sort((a, b) => {
        if (b.cf_score !== a.cf_score) return b.cf_score - a.cf_score;
        return b.jumlah_gejala_cocok - a.jumlah_gejala_cocok;
    });

    if (hasil.length === 0) return null;

    const utama = hasil[0];
    
    // Tambahkan list penyakit lain sebagai alternatif diagnosa (hanya yang skornya > 0)
    utama.penyakitLain = hasil.slice(1).filter(p => p.cf_score > 0);
    
    // Tandai jika ada penyakit lain yang memiliki cf_score SAMA PERSIS dengan penyakit utama
    utama.isTie = utama.penyakitLain.length > 0 && utama.penyakitLain[0].cf_score === utama.cf_score;

    return utama;
};

module.exports = { 
    computeCF, 
    combineCF, 
    diagnosePenyakit 
};