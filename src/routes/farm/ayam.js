const express = require("express");
const router = express.Router();
const ayamController = require("../../controller/farm/ayamController");

// GET /api/ayam/latest - Get latest ayam sensor data
router.get("/latest", ayamController.getLatest);

// GET /api/ayam/history - Get ayam sensor data history
router.get("/history", ayamController.getHistory);

module.exports = router;
