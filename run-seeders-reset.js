const { Sequelize } = require("sequelize");
const { Umzug, SequelizeStorage } = require("umzug");
const path = require("path");
const fs = require("fs");

const env = process.env.NODE_ENV || "development";
const config = require(path.join(__dirname, "src/config/config.js"))[env];

// Buat instance Sequelize
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Baca semua file seeder dari folder seeders
const seedersPath = path.join(__dirname, "src/seeders");
const seederFiles = fs
  .readdirSync(seedersPath)
  .filter((file) => file.endsWith(".js"))
  .sort(); // Urutkan berdasarkan nama untuk konsistensi

console.log(`📁 Ditemukan ${seederFiles.length} file seeder di ${seedersPath}\n`);

// Buat array migrations secara eksplisit
const migrations = seederFiles.map((file) => {
  const seederPath = path.join(seedersPath, file);
  return {
    name: file,
    up: async () => {
      const seeder = require(seederPath);
      const queryInterface = sequelize.getQueryInterface();
      return seeder.up(queryInterface, Sequelize);
    },
    down: async () => {
      const seeder = require(seederPath);
      const queryInterface = sequelize.getQueryInterface();
      return seeder.down(queryInterface, Sequelize);
    },
  };
});

// Konfigurasi Umzug untuk Seeder
const umzug = new Umzug({
  migrations: migrations,
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: "SequelizeData" }),
  logger: console,
});

// Fungsi untuk mereset dan menjalankan semua seeder
const resetAndRunSeeders = async () => {
  try {
    console.log("⚠️  MEMULAI RESET SEEDERS...\n");
    
    // 1. Menonaktifkan foreign key checks untuk sementara
    console.log("1. Menonaktifkan foreign key checks...");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { raw: true });
    console.log("   ✓ Foreign key checks dinonaktifkan\n");
    
    // 2. Hapus semua data dari semua tabel (kecuali tabel meta Sequelize)
    console.log("2. Menghapus data dari semua tabel...");
    
    // Dapatkan daftar tabel dari database
    const [tables] = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '${config.database}' AND TABLE_TYPE = 'BASE TABLE'`,
      { raw: true }
    );
    
    let deletedCount = 0;
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      // Skip tabel meta Sequelize
      if (tableName !== "SequelizeMeta" && tableName !== "SequelizeData") {
        try {
          await sequelize.query(`TRUNCATE TABLE \`${tableName}\``, { raw: true });
          console.log(`   ✓ Data dari tabel '${tableName}' dihapus`);
          deletedCount++;
        } catch (error) {
          // Jika truncate gagal, coba DELETE FROM
          try {
            await sequelize.query(`DELETE FROM \`${tableName}\``, { raw: true });
            console.log(`   ✓ Data dari tabel '${tableName}' dihapus (dengan DELETE)`);
            deletedCount++;
          } catch (err) {
            console.log(`   ⚠️  Tidak bisa menghapus data dari tabel '${tableName}': ${err.message}`);
          }
        }
      }
    }
    console.log(`   ✓ Total ${deletedCount} tabel berhasil dibersihkan\n`);
    
    // 3. Hapus semua data dari tabel SequelizeData
    console.log("\n3. Menghapus histori seeder...");
    await sequelize.query("TRUNCATE TABLE `SequelizeData`", { raw: true });
    console.log("   ✓ Histori seeder dihapus\n");
    
    // 4. Mengaktifkan kembali foreign key checks
    console.log("4. Mengaktifkan kembali foreign key checks...");
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
    console.log("   ✓ Foreign key checks diaktifkan\n");
    
    // 5. List semua seeder yang terdeteksi
    const pending = await umzug.pending();
    console.log(`5. Seeder yang terdeteksi: ${pending.length}`);
    pending.forEach((s, idx) => {
      console.log(`   ${idx + 1}. ${s.name}`);
    });
    
    // 6. Jalankan semua seeder
    console.log("\n6. Menjalankan semua seeder...");
    const seeded = await umzug.up();
    
    if (seeded.length > 0) {
      console.log(`\n✅ ${seeded.length} seeder berhasil dijalankan:`);
      seeded.forEach((s) => console.log(`   ✓ ${s.name}`));
    } else {
      console.log("\n⚠️  Tidak ada seeder yang dijalankan.");
    }
    
    console.log("\n✅ Reset dan seeding selesai!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Reset seeder GAGAL:", error);
    console.error(error.stack);
    // Pastikan foreign key check diaktifkan kembali meskipun terjadi error
    try {
      await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { raw: true });
    } catch (err) {
      // Ignore error jika ada
    }
    process.exit(1);
  }
};

// Jalankan fungsi
resetAndRunSeeders();

