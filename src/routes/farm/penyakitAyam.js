const express = require("express");
const router = express.Router();
const penyakitAyamController = require("../../controller/farm/penyakitAyamController");

router.get("/", penyakitAyamController.getAllPenyakit);
router.get("/bobot-cf", penyakitAyamController.getBobotCF);
router.get("/cf-log", penyakitAyamController.getCfLog);
router.get("/:id", penyakitAyamController.getPenyakitById);

router.post("/", penyakitAyamController.createPenyakit);
router.post("/recalculate-cf", penyakitAyamController.recalculateCFManual);

router.put("/:id", penyakitAyamController.updatePenyakit);
router.delete("/:id", penyakitAyamController.deletePenyakit);

module.exports = router;