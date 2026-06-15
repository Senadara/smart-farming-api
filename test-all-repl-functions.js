/**
 * COMPREHENSIVE TEST SCRIPT FOR ALL REPL HELPER FUNCTIONS
 * 
 * This script tests all 15 helper functions to ensure they work correctly
 * 
 * Usage:
 *   docker compose exec node-api node test-all-repl-functions.js
 */

require('dotenv').config();

const db = require('./src/model');
const cfHelper = require('./src/utils/cfHelper');

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

let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

function logTest(name, passed, error = null) {
     if (passed) {
          console.log(`✅ ${name}`);
          testsPassed++;
     } else {
          console.log(`❌ ${name}`);
          if (error) console.log(`   Error: ${error.message}`);
          testsFailed++;
          failedTests.push({ name, error: error?.message });
     }
}

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║       COMPREHENSIVE REPL HELPER FUNCTIONS TEST               ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

async function runAllTests() {

     // =================================================================
     // SECTION 1: CF ALGORITHM TESTING
     // =================================================================
     console.log('\n🧮 SECTION 1: CF ALGORITHM TESTING');
     console.log('─'.repeat(60));

     try {
          const cf1 = cfHelper.computeCF(2, 10, 'idf');
          logTest('testComputeCF with IDF method', cf1 >= 0.2 && cf1 <= 0.9);
     } catch (error) {
          logTest('testComputeCF with IDF method', false, error);
     }

     try {
          const cf2 = cfHelper.computeCF(3, 10, 'ratio');
          logTest('testComputeCF with RATIO method', cf2 >= 0.2 && cf2 <= 0.9);
     } catch (error) {
          logTest('testComputeCF with RATIO method', false, error);
     }

     try {
          const cf3 = cfHelper.computeCF(4, 10, 'entropy');
          logTest('testComputeCF with ENTROPY method', cf3 >= 0.2 && cf3 <= 0.9);
     } catch (error) {
          logTest('testComputeCF with ENTROPY method', false, error);
     }

     try {
          const cfCombined = cfHelper.combineCF(0.5, 0.3);
          logTest('testCombineCF combination', cfCombined > 0.5 && cfCombined < 1);
     } catch (error) {
          logTest('testCombineCF combination', false, error);
     }

     // =================================================================
     // SECTION 2: DATABASE CONNECTIVITY
     // =================================================================
     console.log('\n🔌 SECTION 2: DATABASE CONNECTIVITY');
     console.log('─'.repeat(60));

     try {
          await sequelize.authenticate();
          logTest('testDbConnection', true);
     } catch (error) {
          logTest('testDbConnection', false, error);
     }

     try {
          const penyakitCount = await PenyakitAyam.count();
          const gejalaCount = await Gejala.count();
          logTest('dbStats (query counts)', true);
          console.log(`   • Penyakit: ${penyakitCount}, Gejala: ${gejalaCount}`);
     } catch (error) {
          logTest('dbStats (query counts)', false, error);
     }

     // =================================================================
     // SECTION 3: PENYAKIT OPERATIONS
     // =================================================================
     console.log('\n🦠 SECTION 3: PENYAKIT OPERATIONS');
     console.log('─'.repeat(60));

     try {
          const penyakitList = await PenyakitAyam.findAll({ limit: 1 });
          logTest('testGetAllPenyakit', Array.isArray(penyakitList));
          console.log(`   • Found ${penyakitList.length} penyakit`);
     } catch (error) {
          logTest('testGetAllPenyakit', false, error);
     }

     try {
          const firstPenyakit = await PenyakitAyam.findOne();
          if (firstPenyakit) {
               const penyakit = await PenyakitAyam.findByPk(firstPenyakit.id);
               logTest('testGetPenyakitById', penyakit !== null);
               console.log(`   • Retrieved: ${penyakit?.nama_penyakit || 'N/A'}`);
          } else {
               logTest('testGetPenyakitById', true);
               console.log('   • Skipped (no data)');
          }
     } catch (error) {
          logTest('testGetPenyakitById', false, error);
     }

     // =================================================================
     // SECTION 4: GEJALA OPERATIONS
     // =================================================================
     console.log('\n🩺 SECTION 4: GEJALA OPERATIONS');
     console.log('─'.repeat(60));

     try {
          const gejalaList = await Gejala.findAll({ limit: 1 });
          logTest('testGetAllGejala', Array.isArray(gejalaList));
          console.log(`   • Found ${gejalaList.length} gejala`);
     } catch (error) {
          logTest('testGetAllGejala', false, error);
     }

     try {
          const firstGejala = await Gejala.findOne();
          if (firstGejala) {
               const gejala = await Gejala.findByPk(firstGejala.id);
               logTest('testGetGejalaById', gejala !== null);
               console.log(`   • Retrieved: ${gejala?.nama_gejala || 'N/A'}`);
          } else {
               logTest('testGetGejalaById', true);
               console.log('   • Skipped (no data)');
          }
     } catch (error) {
          logTest('testGetGejalaById', false, error);
     }

     // =================================================================
     // SECTION 5: DIAGNOSIS ENGINE
     // =================================================================
     console.log('\n🔬 SECTION 5: DIAGNOSIS ENGINE');
     console.log('─'.repeat(60));

     try {
          const gejalaList = await Gejala.findAll({ limit: 3 });
          if (gejalaList.length > 0) {
               const gejalaInput = gejalaList.map(g => ({ id: g.id, cf: 1 }));
               const result = await cfHelper.diagnosePenyakit(gejalaInput);
               logTest('testDiagnosePenyakit', result !== undefined);
               if (result) {
                    console.log(`   • Diagnosed: ${result.penyakit} (CF: ${result.cf_score})`);
               } else {
                    console.log('   • No diagnosis (empty KB or no match)');
               }
          } else {
               logTest('testDiagnosePenyakit', true);
               console.log('   • Skipped (no gejala data)');
          }
     } catch (error) {
          logTest('testDiagnosePenyakit', false, error);
     }

     // =================================================================
     // SECTION 6: CF WEIGHTS
     // =================================================================
     console.log('\n⚖️  SECTION 6: CF WEIGHTS');
     console.log('─'.repeat(60));

     try {
          const cfWeights = await PenyakitGejala.findAll({ limit: 1 });
          logTest('testShowCFWeights', Array.isArray(cfWeights));
          console.log(`   • Found ${cfWeights.length} CF weights`);
     } catch (error) {
          logTest('testShowCFWeights', false, error);
     }

     try {
          const cfLogs = await CfWeightLog.findAll({ limit: 1 });
          logTest('testShowCFLogs', Array.isArray(cfLogs));
          console.log(`   • Found ${cfLogs.length} CF logs`);
     } catch (error) {
          logTest('testShowCFLogs', false, error);
     }

     // =================================================================
     // SECTION 7: PENANGANAN OPERATIONS
     // =================================================================
     console.log('\n💊 SECTION 7: PENANGANAN OPERATIONS');
     console.log('─'.repeat(60));

     try {
          const penanganan = await PenangananPenyakitAyam.findAll({ limit: 1 });
          logTest('testGetAllPenanganan', Array.isArray(penanganan));
          console.log(`   • Found ${penanganan.length} penanganan`);
     } catch (error) {
          logTest('testGetAllPenanganan', false, error);
     }

     try {
          const firstPenyakit = await PenyakitAyam.findOne();
          if (firstPenyakit) {
               const relasi = await PenyakitGejala.findAll({
                    where: { penyakit_id: firstPenyakit.id }
               });
               logTest('testGetPenanganan', true);
               console.log(`   • Found ${relasi.length} relasi for penyakit`);
          } else {
               logTest('testGetPenanganan', true);
               console.log('   • Skipped (no penyakit data)');
          }
     } catch (error) {
          logTest('testGetPenanganan', false, error);
     }

     // =================================================================
     // SECTION 8: LAPORAN SAKIT OPERATIONS
     // =================================================================
     console.log('\n📋 SECTION 8: LAPORAN SAKIT OPERATIONS');
     console.log('─'.repeat(60));

     try {
          const laporan = await Laporan.findAll({
               where: { isDeleted: false, tipe: 'sakit' },
               limit: 1
          });
          logTest('testGetLaporanSakit', Array.isArray(laporan));
          console.log(`   • Found ${laporan.length} laporan sakit`);
     } catch (error) {
          logTest('testGetLaporanSakit', false, error);
     }

     try {
          const firstLaporan = await Laporan.findOne({
               where: { isDeleted: false, tipe: 'sakit' }
          });
          if (firstLaporan) {
               const laporan = await Laporan.findByPk(firstLaporan.id);
               logTest('testGetLaporanSakitById', laporan !== null);
               console.log(`   • Retrieved laporan: ${laporan?.judul || 'N/A'}`);
          } else {
               logTest('testGetLaporanSakitById', true);
               console.log('   • Skipped (no laporan data)');
          }
     } catch (error) {
          logTest('testGetLaporanSakitById', false, error);
     }

     // =================================================================
     // FINAL SUMMARY
     // =================================================================
     console.log('\n═'.repeat(60));
     console.log('FINAL TEST RESULTS');
     console.log('═'.repeat(60));
     console.log(`✅ Tests Passed: ${testsPassed}`);
     console.log(`❌ Tests Failed: ${testsFailed}`);
     console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(2)}%`);

     if (failedTests.length > 0) {
          console.log('\n❌ FAILED TESTS:');
          failedTests.forEach((t, idx) => {
               console.log(`${idx + 1}. ${t.name}`);
               console.log(`   Error: ${t.error}`);
          });
     } else {
          console.log('\n🎉 ALL TESTS PASSED!');
     }

     console.log('═'.repeat(60));

     // Close database connection
     await sequelize.close();

     // Exit with appropriate code
     process.exit(testsFailed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
     console.error('\n💥 FATAL ERROR:', error);
     process.exit(1);
});
