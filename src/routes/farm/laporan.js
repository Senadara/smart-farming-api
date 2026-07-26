const express = require("express");
const router = express.Router();
const laporanController = require("../../controller/farm/laporan.js");
const penyakitAyamController = require("../../controller/farm/penyakitAyamController.js");
const auditMiddleware = require("../../middleware/auditTrail.js");

const sequelize = require("../../model/index");
const { getRiwayatPenyakitAyam } = require("../../controller/farm/penyakitAyamController.js");
const db = sequelize.sequelize;
const Laporan = sequelize.Laporan;

router.get(
  "/harian-kebun/last/:objekBudidayaId",
  laporanController.getLastHarianKebunByObjekBudidayaId
);

router.post(
  "/harian-kebun",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanHarianKebun
);
router.post(
  "/harian-ternak",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanHarianTernak
);

router.post(
  "/sakit",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanSakit
);
router.post(
  "/sakit-tanpa-diagnosa",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanSakitTanpaDiagnosa
);
router.post(
  "/kematian",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanKematian
);
router.post(
  "/vitamin",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanVitamin
);

router.post(
  "/panen",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanPanen
);

router.post(
  "/panen-simple",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanPanenSimple
);

router.post(
  "/hama",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanHama
);

router.post(
  "/penggunaan-inventaris",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanPenggunaanInventaris
);

router.post(
  "/panen-kebun",
  auditMiddleware({ model: Laporan, tableName: "Laporan" }),
  laporanController.createLaporanPanenKebun
);

router.get("/harian-ternak/:id", laporanController.getLaporanHarianTernakById);

router.get("/harian-kebun/:id", laporanController.getLaporanHarianKebunById);

router.get("/sakit/:id", laporanController.getLaporanSakitById);

router.get("/kematian/:id", laporanController.getLaporanKematianById);

router.get(
  "/jumlah-kematian/:unitBudidayaId",
  laporanController.getJumlahKematian
);

router.get("/vitamin/:id", laporanController.getLaporanVitaminById);

router.get("/panen", laporanController.getLaporanPanen);

router.get("/panen/:id", laporanController.getLaporanPanenById);

router.get("/hama/:id", laporanController.getLaporanHamaById);

router.get(
  "/penggunaan-inventaris/:id",
  laporanController.getLaporanPenggunaanInventarisById
);

router.get("/panen-kebun/:id", laporanController.getLaporanPanenKebunById);

// New endpoints for harvest data with grades
router.get(
  "/hasil-panen-with-grades",
  laporanController.getHasilPanenWithGrades
);
router.get(
  "/grade-summary-by-komoditas",
  laporanController.getGradeSummaryByKomoditas
);
router.get(
  "/hasil-panen-ternak-with-grades",
  laporanController.getHasilPanenTernakWithGrades
);

router.get(
  "/ayam-tidak-bertelur",
  laporanController.getAyamTidakBertelur
);

router.get(
  "/ayam-penurunan-produktivitas",
  laporanController.getAyamPenurunanProduktivitas
);

router.get(
  "/riwayat-penyakit-ayam/unit/:id", 
  penyakitAyamController.getRiwayatPenyakitAyam
);

router.get(
  "/riwayat-penyakit-ayam/:id", 
  penyakitAyamController.getRiwayatPenyakitAyamById
);

router.get(
  "/statistik-penyakit-ayam",
  penyakitAyamController.getStatistikPenyakitAyam
);

module.exports = router;
