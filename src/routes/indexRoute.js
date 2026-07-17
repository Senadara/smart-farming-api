const express = require("express");
const router = express.Router();

const userRouter = require("./user");
const authRouter = require("./auth");
const farmRouter = require("./farm/farmIndex");
const storeRouter = require("./store/storeIndex");
const webhookRouter = require("./webhook");
const iotRouter = require("./iot");
const internalRouter = require("./internal");

const { authenticate } = require("../middleware/validation");

router.use("/user", userRouter);
router.use("/auth", authRouter);
router.use("/midtrans", webhookRouter);
router.use("/iot", iotRouter);
router.use("/internal", internalRouter);

router.use("/farm", authenticate(["pjawab", "inventor", "petugas", "penjual"]), farmRouter);
router.use("/store", authenticate(["admin", "pjawab", "penjual", "supplier", "user"]), storeRouter);


module.exports = router;
