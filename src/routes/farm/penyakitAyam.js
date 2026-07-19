const express = require("express");
const router = express.Router();
const penyakitAyamController = require("../../controller/farm/penyakitAyamController");
const gejalaPenyakitController = require("../../controller/farm/gejalaPenyakit");

router.get("/", penyakitAyamController.getAllPenyakit);
router.get("/with-gejala", penyakitAyamController.getPenyakitWithGejala);
router.get("/with-penanganan", penyakitAyamController.getPenyakitWithPenanganan);

router.post("/diagnosa", penyakitAyamController.diagnosaPenyakitAyam)
router.post("/laporan", penyakitAyamController.createLaporanPenyakit)
router.put("/laporan/:id/status", penyakitAyamController.updateStatusLaporanPenyakit)
router.post("/penanganan", penyakitAyamController.createPenangananPenyakitAyam)
router.get("/penanganan/by-gejala", penyakitAyamController.getPenangananByGejala)
router.get("/penanganan/:id", penyakitAyamController.getPenangananPenyakitAyamById)
router.put("/penanganan/:id", penyakitAyamController.updatePenangananPenyakitAyam)
router.delete("/penanganan/:id", penyakitAyamController.deletePenangananPenyakitAyam)


router.post("/", penyakitAyamController.createPenyakit);
router.put("/:id", penyakitAyamController.updatePenyakit);
router.delete("/:id", penyakitAyamController.deletePenyakit);

router.delete("/delete-gejala/:id", gejalaPenyakitController.deleteGejalaPenyakit);

module.exports = router;