const express = require('express');
const router = express.Router();
const komoditasController = require('../../controller/farm/komoditas.js');
const auditMiddleware = require('../../middleware/auditTrail.js');

const sequelize = require("../../model/index");
const db = sequelize.sequelize;
const Komoditas = sequelize.Komoditas;

router.get('/', komoditasController.getAllKomoditas);

router.get('/unproduct', komoditasController.getAllKomoditasWithoutProduk);

router.get('/search/:nama/:tipe', komoditasController.getKomoditasSearch);

router.get('/tipe/:tipe', komoditasController.getKomoditasByTipe);

router.get('/:id', komoditasController.getKomoditasById);

router.post('/', auditMiddleware({ model: Komoditas, tableName: "Komoditas" }), komoditasController.createKomoditas);

router.put('/:id', auditMiddleware({ model: Komoditas, tableName: "Komoditas" }), komoditasController.updateKomoditas);

router.delete('/:id', auditMiddleware({ model: Komoditas, tableName: "Komoditas" }), komoditasController.deleteKomoditas);

module.exports = router;
