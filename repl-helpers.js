/**
 * ============================================================================
 * NODE.JS REPL HELPER FUNCTIONS - DEVELOPER 2 (DIAGNOSIS PENYAKIT TERNAK)
 * ============================================================================
 * 
 * Interactive testing tool untuk modul diagnosis penyakit ayam menggunakan
 * algoritma Certainty Factor (CF).
 * 
 * USAGE:
 * 1. Enter container: docker compose exec node-api sh
 * 2. Start REPL: node repl-helpers.js
 * 3. Use functions: await testDiagnosa(['gejala-id-1', 'gejala-id-2'])
 * 
 * SCOPE: Developer 2 - Diagnosis Penyakit ONLY
 * - INCLUDED: Penyakit, Gejala, CF Algorithm, Diagnosis, Penanganan, Laporan
 * - EXCLUDED: Alumni code (auth, store, dashboard, inventory, sensor)
 * 
 * Author: QA Team
 * Created: 2026-06-08
 * ============================================================================
 */

const repl = require('repl');
const path = require('path');

// Load environment
require('dotenv').config();

// Load models and utilities
const db = require('./src/model');
const cfHelper = require('./src/utils/cfHelper');

// Extract models for diagnosis penyakit domain
const {
     PenyakitAyam,
     Gejala,
     PenyakitGejala,
     CfWeightLog,
     PenangananPenyakitAyam,
     Laporan,
     LaporanGejala,
     Sakit,
     sequelize
} = db;

// ============================================================================
// SECTION 1: CF ALGORITHM TESTING
// ============================================================================

/**
 * Test CF computation dengan berbagai metode
 * @param {number} df - Disease frequency (jumlah penyakit yang punya gejala ini)
 * @param {number} n - Total disease count
 * @param {string} metode - 'idf', 'ratio', atau 'entropy'
 */
async function testComputeCF(df, n, metode = 'idf') {
     console.log('\n🧮 Testing CF Computation...');
     console.log('═'.repeat(60));

     try {
          const result = cfHelper.computeCF(df, n, metode);

          console.log(`Input:`);
          console.log(`  • df (disease frequency): ${df}`);
          console.log(`  • N (total disease):      ${n}`);
          console.log(`  • Metode:                 ${metode.toUpperCase()}`);
          console.log(`\nResult:`);
          console.log(`  ✅ CF Weight: ${result}`);
          console.log(`  📊 Persentase: ${(result * 100).toFixed(2)}%`);

          // Show formula
          if (metode === 'idf') {
               console.log(`\n📐 Formula: CF = log(N/df) / log(N)`);
               console.log(`           CF = log(${n}/${df}) / log(${n})`);
          } else if (metode === 'ratio') {
               console.log(`\n📐 Formula: CF = 0.9 × (1 - (df-1)/N)`);
               console.log(`           CF = 0.9 × (1 - (${df}-1)/${n})`);
          } else if (metode === 'entropy') {
               console.log(`\n📐 Formula: CF = 1 - H/maxH`);
          }

          console.log(`\n💡 Range: CF always clamped to [0.2, 0.9]`);
          console.log('═'.repeat(60));

          return result;
     } catch (error) {
          console.log(`\n❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Test CF combination untuk multi-gejala
 * @param {number} cfLama - CF existing
 * @param {number} cfBaru - CF new symptom
 */
async function testCombineCF(cfLama, cfBaru) {
     console.log('\n🔗 Testing CF Combination...');
     console.log('═'.repeat(60));

     try {
          const result = cfHelper.combineCF(cfLama, cfBaru);

          console.log(`Input:`);
          console.log(`  • CF Old: ${cfLama}`);
          console.log(`  • CF New: ${cfBaru}`);
          console.log(`\nFormula:`);
          console.log(`  CF_combined = CF_old + CF_new × (1 - CF_old)`);
          console.log(`  CF_combined = ${cfLama} + ${cfBaru} × (1 - ${cfLama})`);
          console.log(`\nResult:`);
          console.log(`  ✅ CF Combined: ${result.toFixed(4)}`);
          console.log(`  📊 Persentase: ${(result * 100).toFixed(2)}%`);
          console.log('═'.repeat(60));

          return result;
     } catch (error) {
          console.log(`\n❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 2: DATABASE CONNECTIVITY
// ============================================================================

/**
 * Test database connection
 */
async function testDbConnection() {
     console.log('\n🔌 Testing Database Connection...');
     console.log('═'.repeat(60));

     try {
          await sequelize.authenticate();
          console.log('✅ Database connection successful!');

          const [results] = await sequelize.query('SELECT DATABASE() as db');
          console.log(`📊 Connected to database: ${results[0].db}`);

          const [versionResult] = await sequelize.query('SELECT VERSION() as version');
          console.log(`🗄️  MySQL Version: ${versionResult[0].version}`);

          console.log('═'.repeat(60));
          return true;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return false;
     }
}

/**
 * Show database statistics untuk diagnosis penyakit domain
 */
async function dbStats() {
     console.log('\n📊 Database Statistics - Diagnosis Penyakit Domain');
     console.log('═'.repeat(60));

     try {
          const penyakitCount = await PenyakitAyam.count();
          const gejalaCount = await Gejala.count();
          const relasiCount = await PenyakitGejala.count();
          const penangananCount = await PenangananPenyakitAyam.count();
          const cfLogCount = await CfWeightLog.count();
          const laporanSakitCount = await Sakit.count();

          console.log(`📦 Master Data:`);
          console.log(`  • Penyakit Ayam:        ${penyakitCount} records`);
          console.log(`  • Gejala:               ${gejalaCount} records`);
          console.log(`  • Penyakit-Gejala:      ${relasiCount} relations`);
          console.log(`  • Penanganan:           ${penangananCount} treatments`);
          console.log(`\n📝 Transactional Data:`);
          console.log(`  • CF Weight Logs:       ${cfLogCount} audit logs`);
          console.log(`  • Laporan Sakit:        ${laporanSakitCount} reports`);

          // Calculate knowledge base density
          if (penyakitCount > 0 && gejalaCount > 0) {
               const maxRelasi = penyakitCount * gejalaCount;
               const density = ((relasiCount / maxRelasi) * 100).toFixed(2);
               console.log(`\n💡 Knowledge Base Density: ${density}%`);
               console.log(`   (${relasiCount} relations of ${maxRelasi} possible)`);
          }

          console.log('═'.repeat(60));
          return {
               penyakit: penyakitCount,
               gejala: gejalaCount,
               relasi: relasiCount,
               penanganan: penangananCount,
               cfLogs: cfLogCount,
               laporanSakit: laporanSakitCount
          };
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 3: PENYAKIT (DISEASE) CRUD OPERATIONS
// ============================================================================

/**
 * Get all penyakit ayam
 */
async function testGetAllPenyakit() {
     console.log('\n🦠 Getting All Penyakit Ayam...');
     console.log('═'.repeat(60));

     try {
          const penyakitList = await PenyakitAyam.findAll({
               include: [{
                    model: PenyakitGejala,
                    as: 'penyakitGejala',
                    include: [{
                         model: Gejala,
                         as: 'gejala'
                    }]
               }],
               order: [['createdAt', 'DESC']]
          });

          console.log(`✅ Found ${penyakitList.length} penyakit\n`);

          penyakitList.forEach((p, idx) => {
               console.log(`${idx + 1}. ${p.nama_penyakit}`);
               console.log(`   ID: ${p.id}`);
               console.log(`   Gejala: ${p.penyakitGejala?.length || 0} symptoms`);
               if (p.penyakitGejala && p.penyakitGejala.length > 0) {
                    p.penyakitGejala.forEach((pg, gIdx) => {
                         console.log(`     ${gIdx + 1}) ${pg.gejala?.nama_gejala || 'N/A'} (CF: ${pg.cf_weight})`);
                    });
               }
               console.log('');
          });

          console.log('═'.repeat(60));
          return penyakitList;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Get specific penyakit by ID
 * @param {string} penyakitId - UUID of penyakit
 */
async function testGetPenyakitById(penyakitId) {
     console.log(`\n🦠 Getting Penyakit: ${penyakitId}...`);
     console.log('═'.repeat(60));

     try {
          const penyakit = await PenyakitAyam.findByPk(penyakitId, {
               include: [{
                    model: PenyakitGejala,
                    as: 'penyakitGejala',
                    include: [{
                         model: Gejala,
                         as: 'gejala'
                    }]
               }]
          });

          if (!penyakit) {
               console.log('❌ Penyakit not found');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`✅ Found: ${penyakit.nama_penyakit}\n`);
          console.log(`📝 Details:`);
          console.log(`  ID: ${penyakit.id}`);
          console.log(`  Nama: ${penyakit.nama_penyakit}`);
          console.log(`  Created: ${penyakit.createdAt}`);
          console.log(`  Gejala Count: ${penyakit.penyakitGejala?.length || 0}`);

          if (penyakit.penyakitGejala && penyakit.penyakitGejala.length > 0) {
               console.log(`\n🔬 Gejala & CF Weights:`);
               penyakit.penyakitGejala.forEach((pg, idx) => {
                    console.log(`  ${idx + 1}. ${pg.gejala?.nama_gejala || 'N/A'}`);
                    console.log(`     CF Weight: ${pg.cf_weight}`);
                    console.log(`     DF: ${pg.disease_frequency}, N: ${pg.total_disease}`);
                    console.log(`     Metode: ${pg.metode}`);
               });
          }

          console.log('═'.repeat(60));
          return penyakit;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 4: GEJALA (SYMPTOM) OPERATIONS
// ============================================================================

/**
 * Get all gejala
 */
async function testGetAllGejala() {
     console.log('\n🩺 Getting All Gejala...');
     console.log('═'.repeat(60));

     try {
          const gejalaList = await Gejala.findAll({
               order: [['nama_gejala', 'ASC']]
          });

          console.log(`✅ Found ${gejalaList.length} gejala\n`);

          gejalaList.forEach((g, idx) => {
               console.log(`${idx + 1}. ${g.nama_gejala}`);
               console.log(`   ID: ${g.id}`);
               console.log(`   Gambar: ${g.gambar || 'N/A'}`);
               console.log('');
          });

          console.log('═'.repeat(60));
          return gejalaList;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Get gejala by ID
 * @param {string} gejalaId - UUID of gejala
 */
async function testGetGejalaById(gejalaId) {
     console.log(`\n🩺 Getting Gejala: ${gejalaId}...`);
     console.log('═'.repeat(60));

     try {
          const gejala = await Gejala.findByPk(gejalaId);

          if (!gejala) {
               console.log('❌ Gejala not found');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`✅ Found: ${gejala.nama_gejala}\n`);
          console.log(`📝 Details:`);
          console.log(`  ID: ${gejala.id}`);
          console.log(`  Nama: ${gejala.nama_gejala}`);
          console.log(`  Gambar: ${gejala.gambar || 'N/A'}`);

          // Count how many penyakit have this gejala
          const relatedPenyakit = await PenyakitGejala.count({
               where: { gejala_id: gejalaId }
          });
          console.log(`  📊 Used in ${relatedPenyakit} penyakit`);

          console.log('═'.repeat(60));
          return gejala;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 5: DIAGNOSIS ENGINE TESTING
// ============================================================================

/**
 * Test diagnosis engine dengan gejala input
 * @param {Array<Object>} gejalaInput - Array of {id, cf} objects
 * @example testDiagnosePenyakit([{id: 'gejala-1', cf: 1}, {id: 'gejala-2', cf: 0.8}])
 */
async function testDiagnosePenyakit(gejalaInput) {
     console.log('\n🔬 Testing Diagnosis Engine...');
     console.log('═'.repeat(60));

     if (!Array.isArray(gejalaInput) || gejalaInput.length === 0) {
          console.log('❌ Error: gejalaInput harus array dan tidak boleh kosong');
          console.log('💡 Example: [{id: "gejala-id", cf: 1}]');
          console.log('═'.repeat(60));
          return null;
     }

     try {
          console.log(`Input: ${gejalaInput.length} gejala selected\n`);

          // Fetch gejala names
          const gejalaIds = gejalaInput.map(g => g.id);
          const gejalaData = await Gejala.findAll({
               where: { id: gejalaIds }
          });

          console.log(`🩺 Gejala Input:`);
          gejalaData.forEach((g, idx) => {
               const cfUser = gejalaInput.find(gi => gi.id === g.id)?.cf || 1;
               console.log(`  ${idx + 1}. ${g.nama_gejala} (CF User: ${cfUser})`);
          });

          // Run diagnosis
          console.log(`\n⚙️  Running CF diagnosis engine...`);
          const result = await cfHelper.diagnosePenyakit(gejalaInput);

          if (!result) {
               console.log(`\n❌ No diagnosis found (empty knowledge base)`);
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`\n✅ Diagnosis Result:\n`);
          console.log(`🦠 Penyakit: ${result.penyakit}`);
          console.log(`   ID: ${result.id}`);
          console.log(`   CF Score: ${result.cf_score.toFixed(4)}`);
          console.log(`   Confidence: ${result.persentase}%`);
          console.log(`   Matching Symptoms: ${result.jumlah_gejala_cocok}/${gejalaInput.length}`);

          // Interpretation
          console.log(`\n📊 Interpretation:`);
          if (result.persentase >= 80) {
               console.log(`   🔴 HIGH confidence - Strong indication`);
          } else if (result.persentase >= 60) {
               console.log(`   🟡 MEDIUM confidence - Probable diagnosis`);
          } else {
               console.log(`   🟢 LOW confidence - Weak indication`);
          }

          console.log('═'.repeat(60));
          return result;
     } catch (error) {
          console.log(`\n❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Shortcut untuk diagnosa dengan hanya array ID (cf_user = 1 default)
 * @param {Array<string>} gejalaIds - Array of gejala IDs
 */
async function testDiagnosa(gejalaIds) {
     const gejalaInput = gejalaIds.map(id => ({ id, cf: 1 }));
     return await testDiagnosePenyakit(gejalaInput);
}


// ============================================================================
// SECTION 6: CF WEIGHT ANALYSIS
// ============================================================================

/**
 * Show CF weights untuk semua penyakit-gejala relations
 */
async function testShowCFWeights() {
     console.log('\n⚖️  CF Weights Analysis...');
     console.log('═'.repeat(60));

     try {
          const relasi = await PenyakitGejala.findAll({
               include: [
                    { model: PenyakitAyam, as: 'penyakit' },
                    { model: Gejala, as: 'gejala' }
               ],
               order: [['cf_weight', 'DESC']]
          });

          if (relasi.length === 0) {
               console.log('❌ No CF weights found (knowledge base empty)');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`✅ Found ${relasi.length} CF weights\n`);

          // Group by penyakit
          const grouped = {};
          relasi.forEach(r => {
               const pName = r.penyakit?.nama_penyakit || 'Unknown';
               if (!grouped[pName]) {
                    grouped[pName] = [];
               }
               grouped[pName].push(r);
          });

          Object.keys(grouped).forEach((pName, idx) => {
               console.log(`${idx + 1}. 🦠 ${pName}`);
               grouped[pName].forEach((r, gIdx) => {
                    console.log(`   ${gIdx + 1}) ${r.gejala?.nama_gejala || 'N/A'}`);
                    console.log(`      CF: ${r.cf_weight} | DF: ${r.disease_frequency} | N: ${r.total_disease}`);
                    console.log(`      Method: ${r.metode} | Updated: ${r.cf_updated_at || 'N/A'}`);
               });
               console.log('');
          });

          // Statistics
          const avgCF = relasi.reduce((sum, r) => sum + parseFloat(r.cf_weight), 0) / relasi.length;
          const maxCF = Math.max(...relasi.map(r => parseFloat(r.cf_weight)));
          const minCF = Math.min(...relasi.map(r => parseFloat(r.cf_weight)));

          console.log(`📊 Statistics:`);
          console.log(`   Average CF: ${avgCF.toFixed(4)}`);
          console.log(`   Max CF: ${maxCF}`);
          console.log(`   Min CF: ${minCF}`);

          console.log('═'.repeat(60));
          return relasi;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Show CF weight logs (audit trail)
 * @param {number} limit - Number of logs to show
 */
async function testShowCFLogs(limit = 10) {
     console.log(`\n📜 CF Weight Audit Logs (Latest ${limit})...`);
     console.log('═'.repeat(60));

     try {
          const logs = await CfWeightLog.findAll({
               include: [{
                    model: PenyakitGejala,
                    as: 'penyakitGejala',
                    include: [
                         { model: PenyakitAyam, as: 'penyakit' },
                         { model: Gejala, as: 'gejala' }
                    ]
               }],
               order: [['createdAt', 'DESC']],
               limit
          });

          if (logs.length === 0) {
               console.log('❌ No CF logs found');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`✅ Found ${logs.length} logs\n`);

          logs.forEach((log, idx) => {
               const pg = log.penyakitGejala;
               console.log(`${idx + 1}. ${pg?.penyakit?.nama_penyakit || 'N/A'} - ${pg?.gejala?.nama_gejala || 'N/A'}`);
               console.log(`   Old CF: ${log.cf_weight_lama} → New CF: ${log.cf_weight_baru}`);
               console.log(`   Old N: ${log.total_disease_lama} → Triggered by: ${log.triggered_by}`);
               console.log(`   Timestamp: ${log.createdAt}`);
               console.log('');
          });

          console.log('═'.repeat(60));
          return logs;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 7: PENANGANAN (TREATMENT) OPERATIONS
// ============================================================================

/**
 * Get penanganan for specific penyakit
 * @param {string} penyakitId - UUID of penyakit
 */
async function testGetPenanganan(penyakitId) {
     console.log(`\n💊 Getting Penanganan for Penyakit: ${penyakitId}...`);
     console.log('═'.repeat(60));

     try {
          const penyakit = await PenyakitAyam.findByPk(penyakitId);

          if (!penyakit) {
               console.log('❌ Penyakit not found');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`🦠 Penyakit: ${penyakit.nama_penyakit}\n`);

          // Find penanganan via PenyakitGejala relations
          const relasi = await PenyakitGejala.findAll({
               where: { penyakit_id: penyakitId }
          });

          const penangananIds = [...new Set(relasi.map(r => r.penanganan_id).filter(id => id))];

          if (penangananIds.length === 0) {
               console.log('⚠️  No penanganan found for this penyakit');
               console.log('═'.repeat(60));
               return [];
          }

          const penanganan = await PenangananPenyakitAyam.findAll({
               where: { id: penangananIds }
          });

          console.log(`✅ Found ${penanganan.length} penanganan:\n`);

          penanganan.forEach((p, idx) => {
               console.log(`${idx + 1}. Penanganan ID: ${p.id}`);
               console.log(`   Treatment: ${p.penanganan}`);
               console.log(`   Gambar: ${p.gambar || 'N/A'}`);
               console.log(`   Created: ${p.createdAt}`);
               console.log('');
          });

          console.log('═'.repeat(60));
          return penanganan;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Get all penanganan
 */
async function testGetAllPenanganan() {
     console.log('\n💊 Getting All Penanganan...');
     console.log('═'.repeat(60));

     try {
          const penanganan = await PenangananPenyakitAyam.findAll({
               order: [['createdAt', 'DESC']]
          });

          console.log(`✅ Found ${penanganan.length} penanganan\n`);

          penanganan.forEach((p, idx) => {
               console.log(`${idx + 1}. ID: ${p.id}`);
               console.log(`   Penyakit ID: ${p.penyakit_id}`);
               console.log(`   Treatment: ${p.penanganan.substring(0, 60)}${p.penanganan.length > 60 ? '...' : ''}`);
               console.log(`   Gambar: ${p.gambar || 'N/A'}`);
               console.log('');
          });

          console.log('═'.repeat(60));
          return penanganan;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 8: LAPORAN SAKIT (DIAGNOSIS REPORT) OPERATIONS
// ============================================================================

/**
 * Get all laporan sakit
 * @param {number} limit - Number of records to fetch
 */
async function testGetLaporanSakit(limit = 10) {
     console.log(`\n📋 Getting Latest ${limit} Laporan Sakit...`);
     console.log('═'.repeat(60));

     try {
          const laporan = await Laporan.findAll({
               where: {
                    isDeleted: false,
                    tipe: 'sakit'
               },
               include: [{
                    model: Sakit
               }],
               order: [['createdAt', 'DESC']],
               limit
          });

          console.log(`✅ Found ${laporan.length} laporan\n`);

          for (const l of laporan) {
               console.log(`📄 Laporan ID: ${l.id}`);
               console.log(`   Judul: ${l.judul}`);
               console.log(`   Tipe: ${l.tipe}`);
               console.log(`   Status: ${l.status || 'N/A'}`);

               if (l.Sakit) {
                    console.log(`   🦠 Diagnosis Penyakit ID: ${l.Sakit.diagnosisPenyakit}`);

                    // Fetch penyakit name
                    const penyakit = await PenyakitAyam.findByPk(l.Sakit.diagnosisPenyakit);
                    if (penyakit) {
                         console.log(`      Nama Penyakit: ${penyakit.nama_penyakit}`);
                    }
               }

               console.log(`   Created: ${l.createdAt}`);
               console.log('');
          }

          console.log('═'.repeat(60));
          return laporan;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}

/**
 * Get laporan sakit by ID with full details
 * @param {string} laporanId - UUID of laporan
 */
async function testGetLaporanSakitById(laporanId) {
     console.log(`\n📋 Getting Laporan Sakit: ${laporanId}...`);
     console.log('═'.repeat(60));

     try {
          const laporan = await Laporan.findOne({
               where: {
                    id: laporanId,
                    isDeleted: false,
                    tipe: 'sakit'
               },
               include: [{ model: Sakit }]
          });

          if (!laporan) {
               console.log('❌ Laporan not found');
               console.log('═'.repeat(60));
               return null;
          }

          console.log(`✅ Laporan Found\n`);
          console.log(`📝 Details:`);
          console.log(`  ID: ${laporan.id}`);
          console.log(`  Judul: ${laporan.judul}`);
          console.log(`  Tipe: ${laporan.tipe}`);
          console.log(`  Status: ${laporan.status || 'N/A'}`);
          console.log(`  Catatan: ${laporan.catatan || 'N/A'}`);
          console.log(`  Created: ${laporan.createdAt}`);

          if (laporan.Sakit) {
               console.log(`\n🦠 Diagnosis:`);
               const penyakit = await PenyakitAyam.findByPk(laporan.Sakit.diagnosisPenyakit);
               console.log(`  Penyakit: ${penyakit?.nama_penyakit || 'N/A'}`);
               console.log(`  Status: ${laporan.Sakit.status || 'N/A'}`);

               // Get gejala from LaporanGejala
               const laporanGejala = await LaporanGejala.findAll({
                    where: { penyakit_ayam_id: laporan.Sakit.diagnosisPenyakit }
               });

               if (laporanGejala.length > 0) {
                    console.log(`\n🩺 Gejala Detected:`);
                    for (const lg of laporanGejala) {
                         const gejala = await Gejala.findByPk(lg.gejala_id);
                         console.log(`  • ${gejala?.nama_gejala || 'N/A'}`);
                    }
               }
          }

          console.log('═'.repeat(60));
          return laporan;
     } catch (error) {
          console.log(`❌ Error: ${error.message}`);
          console.log('═'.repeat(60));
          return null;
     }
}


// ============================================================================
// SECTION 9: UTILITY & HELPER FUNCTIONS
// ============================================================================

/**
 * List all available models
 */
function listModels() {
     console.log('\n📦 Available Models - Diagnosis Penyakit Domain');
     console.log('═'.repeat(60));
     console.log(`1. PenyakitAyam       - Disease entity`);
     console.log(`2. Gejala             - Symptom entity`);
     console.log(`3. PenyakitGejala     - Disease-Symptom relation (CF weights)`);
     console.log(`4. CfWeightLog        - CF weight audit trail`);
     console.log(`5. PenangananPenyakitAyam - Treatment entity`);
     console.log(`6. Laporan            - Report entity`);
     console.log(`7. LaporanGejala      - Report-Symptom relation`);
     console.log(`8. Sakit              - Diagnosis record`);
     console.log('═'.repeat(60));
}

/**
 * Show help menu
 */
function help() {
     console.log('\n');
     console.log('╔═══════════════════════════════════════════════════════════════╗');
     console.log('║   REPL HELPER FUNCTIONS - DEVELOPER 2 (DIAGNOSIS PENYAKIT)   ║');
     console.log('╚═══════════════════════════════════════════════════════════════╝');
     console.log('');

     console.log('🧮 CF ALGORITHM TESTING:');
     console.log('  • await testComputeCF(df, n, metode)    - Test CF calculation');
     console.log('  • await testCombineCF(cfLama, cfBaru)   - Test CF combination');
     console.log('');

     console.log('🔌 DATABASE:');
     console.log('  • await testDbConnection()               - Test DB connection');
     console.log('  • await dbStats()                        - Show DB statistics');
     console.log('');

     console.log('🦠 PENYAKIT (DISEASE):');
     console.log('  • await testGetAllPenyakit()             - List all diseases');
     console.log('  • await testGetPenyakitById(id)          - Get disease by ID');
     console.log('');

     console.log('🩺 GEJALA (SYMPTOM):');
     console.log('  • await testGetAllGejala()               - List all symptoms');
     console.log('  • await testGetGejalaById(id)            - Get symptom by ID');
     console.log('');

     console.log('🔬 DIAGNOSIS ENGINE:');
     console.log('  • await testDiagnosePenyakit(gejalaInput) - Run diagnosis');
     console.log('    Example: [{id: "uuid", cf: 1}]');
     console.log('  • await testDiagnosa(["id1", "id2"])      - Quick diagnosis (cf=1)');
     console.log('');

     console.log('⚖️  CF WEIGHTS:');
     console.log('  • await testShowCFWeights()              - Show all CF weights');
     console.log('  • await testShowCFLogs(limit)            - Show CF audit logs');
     console.log('');

     console.log('💊 PENANGANAN (TREATMENT):');
     console.log('  • await testGetPenanganan(penyakitId)    - Get treatments for disease');
     console.log('  • await testGetAllPenanganan()           - List all treatments');
     console.log('');

     console.log('📋 LAPORAN SAKIT:');
     console.log('  • await testGetLaporanSakit(limit)       - List diagnosis reports');
     console.log('  • await testGetLaporanSakitById(id)      - Get report details');
     console.log('');

     console.log('🛠️  UTILITIES:');
     console.log('  • listModels()                           - Show available models');
     console.log('  • help()                                 - Show this help menu');
     console.log('');

     console.log('💡 TIPS:');
     console.log('  • Use "await" for async functions');
     console.log('  • Check dbStats() first to see data availability');
     console.log('  • Use Ctrl+C twice to exit REPL');
     console.log('');
     console.log('═'.repeat(60));
}

// ============================================================================
// REPL INITIALIZATION
// ============================================================================

console.log('\n');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║                                                               ║');
console.log('║   SMART FARMING API - REPL HELPER FUNCTIONS                  ║');
console.log('║   Developer 2: Diagnosis Penyakit Ternak (CF Algorithm)      ║');
console.log('║                                                               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');
console.log('✅ REPL Helper Functions Loaded!');
console.log('');
console.log('📚 Quick Start:');
console.log('  1. await testDbConnection()    → Test database');
console.log('  2. await dbStats()              → Check data availability');
console.log('  3. await testGetAllPenyakit()   → List diseases');
console.log('  4. help()                       → Show all functions');
console.log('');
console.log('💡 Type "help()" to see all available functions');
console.log('');

// Create REPL instance
const replServer = repl.start({
     prompt: '🧪 diagnosis-penyakit> ',
     useColors: true,
});

// Add all functions to REPL context
replServer.context.testComputeCF = testComputeCF;
replServer.context.testCombineCF = testCombineCF;
replServer.context.testDbConnection = testDbConnection;
replServer.context.dbStats = dbStats;
replServer.context.testGetAllPenyakit = testGetAllPenyakit;
replServer.context.testGetPenyakitById = testGetPenyakitById;
replServer.context.testGetAllGejala = testGetAllGejala;
replServer.context.testGetGejalaById = testGetGejalaById;
replServer.context.testDiagnosePenyakit = testDiagnosePenyakit;
replServer.context.testDiagnosa = testDiagnosa;
replServer.context.testShowCFWeights = testShowCFWeights;
replServer.context.testShowCFLogs = testShowCFLogs;
replServer.context.testGetPenanganan = testGetPenanganan;
replServer.context.testGetAllPenanganan = testGetAllPenanganan;
replServer.context.testGetLaporanSakit = testGetLaporanSakit;
replServer.context.testGetLaporanSakitById = testGetLaporanSakitById;
replServer.context.listModels = listModels;
replServer.context.help = help;

// Add models to context
replServer.context.PenyakitAyam = PenyakitAyam;
replServer.context.Gejala = Gejala;
replServer.context.PenyakitGejala = PenyakitGejala;
replServer.context.CfWeightLog = CfWeightLog;
replServer.context.PenangananPenyakitAyam = PenangananPenyakitAyam;
replServer.context.Laporan = Laporan;
replServer.context.LaporanGejala = LaporanGejala;
replServer.context.Sakit = Sakit;
replServer.context.sequelize = sequelize;
replServer.context.cfHelper = cfHelper;
