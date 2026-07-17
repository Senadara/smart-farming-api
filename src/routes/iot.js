const express = require("express");
const router = express.Router();
const iotController = require("../controller/iot");

router.post("/webhook/:deviceCode", iotController.receiveWebhook);

module.exports = router;
