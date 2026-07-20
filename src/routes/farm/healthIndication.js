const express = require("express");
const router = express.Router();
const healthIndicationController = require("../../controller/farm/healthIndication");

router.get("/", healthIndicationController.getPendingIndications);
router.get("/pending", healthIndicationController.getPendingIndications);
router.get("/:id", healthIndicationController.getIndicationById);
router.patch("/:id/status", healthIndicationController.updateIndicationStatus);

module.exports = router;
