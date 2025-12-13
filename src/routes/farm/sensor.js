const express = require("express");
const router = express.Router();
const sensorController = require("../../controller/farm/sensorController");

// GET /api/farm/melon/latest - Get latest melon sensor data
router.get("/latest", sensorController.getLatest);

// GET /api/farm/melon/history - Get melon sensor data history
router.get("/history", sensorController.getHistory);

module.exports = router;

