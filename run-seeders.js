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
  // Penting: Sequelize-CLI menggunakan tabel 'SequelizeData' untuk melacak seeder
  storage: new SequelizeStorage({ sequelize, tableName: "SequelizeData" }),
  logger: console,
});

// Fungsi untuk menjalankan seeder
const runSeeders = async () => {
  try {
    // List semua seeder yang terdeteksi
    const pending = await umzug.pending();
    const executed = await umzug.executed();
    
    console.log(`Seeder yang sudah dijalankan: ${executed.length}`);
    if (executed.length > 0) {
      console.log("Daftar seeder yang sudah dijalankan:");
      executed.forEach((s) => console.log(`  ✓ ${s.name}`));
    }
    
    console.log(`\nSeeder yang tertunda: ${pending.length}`);
    if (pending.length > 0) {
      console.log("Daftar seeder yang akan dijalankan:");
      pending.forEach((s) => console.log(`  → ${s.name}`));
    }
    
    console.log("\nMenjalankan seeder yang tertunda...");
    const seeded = await umzug.up();
    if (seeded.length > 0) {
      console.log("\n✅ Seeder yang berhasil dijalankan:");
      seeded.forEach((s) => console.log(`  ✓ ${s.name}`));
    } else {
      console.log("\n⚠️  Tidak ada seeder baru yang perlu dijalankan.");
    }
    console.log("\n✅ Proses seeding selesai.");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding GAGAL:", error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Jalankan fungsi
runSeeders();
