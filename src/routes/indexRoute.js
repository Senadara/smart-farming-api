const express = require("express");
const router = express.Router();

const userRouter = require("./user");
const authRouter = require("./auth");
const farmRouter = require("./farm/farmIndex");
const storeRouter = require("./store/storeIndex");
const webhookRouter = require("./webhook");

const { authenticate } = require("../middleware/validation");

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/midtrans", webhookRouter);

// Public endpoint for testing - REMOVE AFTER TESTING
const sensorRouter = require("./farm/sensor");
router.use("/sensors", sensorRouter);

router.use("/farm", authenticate(["pjawab", "inventor", "petugas", "penjual"]), farmRouter);
router.use("/store", authenticate(["admin", "pjawab", "penjual", "user"]), storeRouter);


module.exports = router;
