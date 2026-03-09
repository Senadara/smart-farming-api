const express = require("express");
const router = express.Router();
// const ayamController = require("../../controller/farm/ayamController");

// [DEPRECATED] Routes disabled — ayam_sensor_data table dropped, replaced by iot_sensor_data schema.
// router.get("/latest", ayamController.getLatest);
// router.get("/history", ayamController.getHistory);

module.exports = router;
