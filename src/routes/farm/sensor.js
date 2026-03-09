const express = require("express");
const router = express.Router();
// const sensorController = require("../../controller/farm/sensorController");

// [DEPRECATED] Routes disabled — sensor_data table dropped, replaced by iot_sensor_data schema.
// router.get("/latest", sensorController.getLatest);
// router.get("/history", sensorController.getHistory);

module.exports = router;
