// helpers/cfHelper.js

/**
 * Hitung bobot CF satu gejala terhadap semua penyakit
 * @param {number} df  - disease_frequency: jumlah penyakit yang punya gejala ini
 * @param {number} n   - total penyakit
 * @param {string} metode - 'idf' | 'ratio' | 'entropy'
 * @returns {number} cf_weight (2 desimal, range 0.20–0.90)
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

    // Normalisasi ke [0.20, 0.90]
    return Math.round(Math.min(0.90, Math.max(0.20, cf)) * 100) / 100;
};

/**
 * Gabungkan beberapa nilai CF dengan rumus berantai:
 * CF_combine(A,B) = A + B*(1-A)
 * @param {number[]} cfValues
 * @returns {number} cf gabungan (4 desimal)
 */
const combineCF = (cfValues) => {
    let combined = 0;
    for (const cf of cfValues) {
        combined = combined + cf * (1 - combined);
    }
    return Math.round(combined * 10000) / 10000;
};

module.exports = { computeCF, combineCF };