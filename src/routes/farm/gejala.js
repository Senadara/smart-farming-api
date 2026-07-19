const express = require("express");
const router = express.Router();
const GejalaController = require("../../controller/farm/gejalaPenyakit.js");
const auditMiddleware = require("../../middleware/auditTrail.js");

const sequelize = require("../../model/index");
const Gejala = sequelize.Gejala;

router.get("/", GejalaController.getGejalaPenyakit);
router.post("/", GejalaController.createGejalaPenyakit);
router.put("/:id", GejalaController.updateGejalaPenyakit);

module.exports = router;