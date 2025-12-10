const express = require("express");
const router = express.Router();
const sensorController = require("../../controller/farm/sensorController");

// GET /api/sensors/latest - Get latest sensor data
router.get("/latest", sensorController.getLatest);

module.exports = router;
