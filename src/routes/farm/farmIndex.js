const express = require("express");
const router = express.Router();

const jenisBudidayaRouter = require("./jenisBudidaya");
const unitBudidayaRouter = require("./unitBudidaya");
const satuanRouter = require("./satuan");
const kategoriInventarisRouter = require("./kategoriInventaris");
const jenisHamaRouter = require("./jenisHama");
const komoditasRouter = require("./komoditas");
const inventarisRouter = require("./inventaris");
const laporanRouter = require("./laporan");
const objekBudidayaRouter = require("./objekBudidaya");
const globalNotificationSettingRouter = require("./globalNotificationSetting");
const scheduledUnitNotificationRouter = require("./scheduledUnitNotification");
const gradeRouter = require("./grade");
const laporanHamaRouter = require("./laporanHama");
const melonRouter = require("./sensor"); // Melon sensor data (formerly sensor)
const ayamRouter = require("./ayam"); // Ayam sensor data from MQTT

const reportRouter = require("./report");

const dashboardRouter = require("./dashboard");

router.use("/jenis-budidaya", jenisBudidayaRouter);
router.use("/unit-budidaya", unitBudidayaRouter);
router.use("/objek-budidaya", objekBudidayaRouter);
router.use("/komoditas", komoditasRouter);
router.use("/jenis-hama", jenisHamaRouter);
router.use("/satuan", satuanRouter);
router.use("/kategori-inventaris", kategoriInventarisRouter);
router.use("/inventaris", inventarisRouter);
router.use("/laporan", laporanRouter);
router.use("/dashboard", dashboardRouter);
router.use("/globalNotification", globalNotificationSettingRouter);
router.use("/scheduledUnitNotification", scheduledUnitNotificationRouter);
router.use("/grade", gradeRouter);
router.use("/laporan-hama", laporanHamaRouter);
router.use("/report", reportRouter);
router.use("/melon", melonRouter); // /api/farm/melon/latest
router.use("/ayam", ayamRouter);   // /api/farm/ayam/latest, /api/farm/ayam/history

module.exports = router;
