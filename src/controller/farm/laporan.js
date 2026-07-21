const e = require("express");
const sequelize = require("../../model/index");
const { where, fn, col } = require("sequelize");
const model = require("../../model/index");
const db = sequelize.sequelize;
const Op = sequelize.Sequelize.Op;
const Laporan = sequelize.Laporan;

const User = sequelize.User;

const UnitBudidaya = sequelize.UnitBudidaya;
const ObjekBudidaya = sequelize.ObjekBudidaya;
const JenisBudidaya = sequelize.JenisBudidaya;

const HarianKebun = sequelize.HarianKebun;
const HarianTernak = sequelize.HarianTernak;
const DailyReportMetric = sequelize.DailyReportMetric;

const Sakit = sequelize.Sakit;
const Kematian = sequelize.Kematian;
const Vitamin = sequelize.Vitamin;

const PanenKebun = sequelize.PanenKebun;
const PanenRincianGrade = sequelize.PanenRincianGrade;
const Panen = sequelize.Panen;
const DetailPanen = sequelize.DetailPanen;
const Hama = sequelize.Hama;

const PenggunaanInventaris = sequelize.PenggunaanInventaris;
const KategoriInventaris = sequelize.KategoriInventaris;

const Inventaris = sequelize.Inventaris;
const Komoditas = sequelize.Komoditas;
const Satuan = sequelize.Satuan;
const Grade = sequelize.Grade;

const Produk = sequelize.Produk;

const DaftarGejala = sequelize.DaftarGejala;
const Gejala = sequelize.Gejala;
const {
  mergeMetrics,
  saveDailyReportMetrics,
} = require("../../services/dailyReportMetricService");
const {
  attachPanenConfig,
  normalizePanenConfig,
} = require("../../utils/panenConfigUtils");
const {
  getEggProductionDropContext,
} = require("../../services/eggProductionHealthService");

const hasNumericValue = (value) =>
  value !== undefined && value !== null && value !== "";

const parseOptionalNumber = (value) => {
  if (!hasNumericValue(value)) {
    return null;
  }

  return Number(value);
};

const percentageOf = (value, total) =>
  value === null || total <= 0 ? null : Number(((value / total) * 100).toFixed(2));

const uniqueIds = (ids = []) => [...new Set(ids.filter(Boolean))];

const validateDetailPanenIds = async (unitBudidayaId, detailPanenIds, transaction) => {
  const ids = uniqueIds(detailPanenIds);

  if (ids.length === 0) {
    return { ids, message: null };
  }

  const validObjects = await ObjekBudidaya.findAll({
    where: {
      id: ids,
      UnitBudidayaId: unitBudidayaId,
      isDeleted: false,
    },
    attributes: ["id"],
    transaction,
  });

  const validIds = new Set(validObjects.map((item) => item.id));
  const invalidIds = ids.filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    return {
      ids,
      message: `detailPanen berisi ayam yang tidak valid atau bukan milik kandang ini: ${invalidIds.join(", ")}`,
    };
  }

  return { ids, message: null };
};

const buildPositiveNumberMessage = (fieldConfig, fallbackLabel, fallbackSatuan) => {
  const label = fieldConfig.label || fallbackLabel;
  const satuan = fieldConfig.satuan || fallbackSatuan;
  const integerText = fieldConfig.integerOnly ? " bulat" : "";
  const satuanText = satuan ? ` ${satuan}` : "";

  return `${label} wajib diisi sebagai angka${integerText}${satuanText} lebih dari 0.`;
};

const validatePositiveField = (value, fieldConfig, fallbackLabel, fallbackSatuan) => {
  const numberValue = parseOptionalNumber(value);

  if (!fieldConfig.enabled) {
    return { value: null, provided: numberValue !== null };
  }

  if (numberValue === null) {
    if (fieldConfig.required) {
      return {
        message: buildPositiveNumberMessage(
          fieldConfig,
          fallbackLabel,
          fallbackSatuan
        ),
      };
    }

    return { value: null, provided: false };
  }

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return {
      message: buildPositiveNumberMessage(fieldConfig, fallbackLabel, fallbackSatuan),
    };
  }

  if (fieldConfig.integerOnly && !Number.isInteger(numberValue)) {
    return {
      message: buildPositiveNumberMessage(fieldConfig, fallbackLabel, fallbackSatuan),
    };
  }

  return { value: numberValue, provided: true };
};

const createLaporanHarianKebun = async (req, res) => {
  const t = await db.transaction();

  try {
    const { harianKebun } = req.body;

    const data = await Laporan.create(
      {
        ...req.body,
        UserId: req.user.id,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UnitBudidayaId: req.body.unitBudidayaId,
      },
      { transaction: t }
    );

    // Inisialisasi data harian dengan nilai dari request
    let finalHarianData = {
      LaporanId: data.id,
      // Tindakan massal tetap dipertahankan
      penyiraman: harianKebun.penyiraman || false,
      pruning: harianKebun.pruning || false,
      repotting: harianKebun.repotting || false,
      // Data individual
      tinggiTanaman:
        harianKebun.tinggiTanaman === undefined
          ? null
          : harianKebun.tinggiTanaman,
      kondisiDaun:
        harianKebun.kondisiDaun === undefined || harianKebun.kondisiDaun === ""
          ? null
          : harianKebun.kondisiDaun,
      statusTumbuh:
        harianKebun.statusTumbuh === undefined ||
          harianKebun.statusTumbuh === ""
          ? null
          : harianKebun.statusTumbuh,
    };

    // Jika ada field individual yang null, coba ambil dari laporan terakhir
    if (
      finalHarianData.tinggiTanaman === null ||
      finalHarianData.kondisiDaun === null ||
      finalHarianData.statusTumbuh === null
    ) {
      try {
        const lastReport = await Laporan.findOne({
          where: {
            objekBudidayaId: req.body.objekBudidayaId,
            isDeleted: false,
            tipe: "harian",
          },
          order: [["createdAt", "DESC"]],
          include: [
            {
              model: HarianKebun,
            },
          ],
          transaction: t,
        });

        if (lastReport && lastReport.HarianKebun) {
          const lastHarian = lastReport.HarianKebun;

          // Gunakan data terakhir jika data baru null
          if (
            finalHarianData.tinggiTanaman === null &&
            lastHarian.tinggiTanaman !== null
          ) {
            finalHarianData.tinggiTanaman = lastHarian.tinggiTanaman;
          }
          if (
            finalHarianData.kondisiDaun === null &&
            lastHarian.kondisiDaun !== null
          ) {
            finalHarianData.kondisiDaun = lastHarian.kondisiDaun;
          }
          if (
            finalHarianData.statusTumbuh === null &&
            lastHarian.statusTumbuh !== null
          ) {
            finalHarianData.statusTumbuh = lastHarian.statusTumbuh;
          }
        }
      } catch (lastReportError) {
        // Jika gagal mengambil laporan terakhir, lanjutkan dengan data yang ada
        console.log(
          "Gagal mengambil laporan terakhir:",
          lastReportError.message
        );
      }
    }

    // Jika masih ada field yang null setelah mencoba mengambil dari laporan terakhir,
    // berikan nilai default untuk tanaman baru
    if (finalHarianData.tinggiTanaman === null) {
      finalHarianData.tinggiTanaman = 0.0;
    }
    if (finalHarianData.kondisiDaun === null) {
      finalHarianData.kondisiDaun = "sehat";
    }
    if (finalHarianData.statusTumbuh === null) {
      finalHarianData.statusTumbuh = "bibit";
    }

    const harian = await HarianKebun.create(finalHarianData, {
      transaction: t,
    });

    const metrics = mergeMetrics(
      {
        penyiraman: { value: finalHarianData.penyiraman ? 1 : 0, unit: "boolean" },
        pruning: { value: finalHarianData.pruning ? 1 : 0, unit: "boolean" },
        repotting: { value: finalHarianData.repotting ? 1 : 0, unit: "boolean" },
        tinggi_tanaman: { value: Number(finalHarianData.tinggiTanaman || 0), unit: "cm" },
      },
      req.body.metrics,
      harianKebun?.metrics
    );

    const dynamicMetrics = await saveDailyReportMetrics(data.id, metrics, t);

    await t.commit();

    res.locals.createdData = { data, harian, metrics: dynamicMetrics };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        harian,
        metrics: dynamicMetrics,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLastHarianKebunByObjekBudidayaId = async (req, res) => {
  try {
    const { objekBudidayaId } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        objekBudidayaId: objekBudidayaId,
        isDeleted: false,
        tipe: "harian",
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: HarianKebun,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved last harian kebun data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanHarianTernak = async (req, res) => {
  const t = await db.transaction();

  try {
    const { harianTernak } = req.body;
    const rawPakan =
      harianTernak?.pakanKg ??
      harianTernak?.jumlahPakan ??
      harianTernak?.pakan;
    const pakanKg = Number(rawPakan);

    if (!harianTernak || rawPakan === undefined || rawPakan === null || rawPakan === "") {
      await t.rollback();
      return res.status(400).json({
        message: "Jumlah pakan wajib diisi dalam satuan kilogram.",
      });
    }

    if (typeof rawPakan === "boolean" || !Number.isFinite(pakanKg) || pakanKg < 0) {
      await t.rollback();
      return res.status(400).json({
        message: "Jumlah pakan harus berupa angka kilogram, contoh: 12.5.",
      });
    }

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporan = await Laporan.findOne({
      where: {
        id: data.id,
      },
      transaction: t,
    });

    if (!laporan) {
      await t.rollback();
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    const harian = await HarianTernak.create(
      {
        LaporanId: laporan.id,
        pakan: pakanKg,
        cekKandang: Boolean(harianTernak.cekKandang),
      },
      { transaction: t }
    );

    const metrics = mergeMetrics(
      {
        pakan: { value: pakanKg, unit: "kg" },
        cek_kandang: { value: Boolean(harianTernak.cekKandang) ? 1 : 0, unit: "boolean" },
      },
      req.body.metrics,
      harianTernak.metrics
    );

    const dynamicMetrics = await saveDailyReportMetrics(laporan.id, metrics, t);

    await t.commit();

    res.locals.createdData = { data, harian, metrics: dynamicMetrics };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        harian,
        metrics: dynamicMetrics,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

// create laporan sakit
const createLaporanSakit = async (req, res) => {
  const t = await db.transaction();

  try {
    const { sakit } = req.body;

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanSakit = await Sakit.create(
      {
        LaporanId: data.id,
        diagnosisPenyakit: sakit.diagnosisPenyakit,
        status: sakit.status,
      },
      { transaction: t }
    );

    const gejala = await Gejala.create(
      {
        gejala1: sakit.gejala1,
        gejala2: sakit.gejala2,
        gejala3: sakit.gejala3,
        gejala4: sakit.gejala4,
      },
      { transaction: t }
    );

    const daftarGejala = await DaftarGejala.create(
      {
        sakitId: laporanSakit.id,
        gejalaId: gejala.id,
        catatan: sakit.catatan,
      },
      { transaction: t }
    );

    await t.commit();

    res.locals.createdData = { data, laporanSakit, gejala, daftarGejala };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanSakit,
        gejala,
        daftarGejala,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanSakitTanpaDiagnosa = async (req, res) => {
  const t = await db.transaction();

  try {
    const { sakit, ...laporanData } = req.body;

    if (!sakit || !sakit.penyakit) {
      await t.rollback();
      return res.status(400).json({
        status: false,
        message: "sakit.penyakit wajib diisi",
      });
    }

    const data = await Laporan.create(
      {
        ...laporanData,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanSakit = await Sakit.create(
      {
        LaporanId: data.id,
        diagnosisPenyakit: null,
        status: "Belum Ditangani",
      },
      { transaction: t, validate: false }
    );

    const gejala = await Gejala.create(
      {
        nama_gejala: sakit.penyakit,
        gambar: req.body.gambar || "-",
      },
      { transaction: t }
    );

    const daftarGejala = await DaftarGejala.create(
      {
        sakitId: laporanSakit.id,
        gejalaId: gejala.id,
        catatan: req.body.catatan || "",
      },
      { transaction: t }
    );

    // Lakukan soft-delete pada gejala yang baru dibuat agar tidak muncul
    // di master list gejala (getGejalaPenyakit), namun karena database
    // disetting paranoid: true, datanya tetap tersimpan dan bisa direferensikan.
    await gejala.destroy({ transaction: t });

    await t.commit();

    return res.status(201).json({
      status: true,
      message: "Successfully created new laporan sakit tanpa diagnosa",
      data: {
        data,
        laporanSakit,
        gejala,
        daftarGejala,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanKematian = async (req, res) => {
  const t = await db.transaction();

  try {
    const { kematian } = req.body;
    const jumlahKematian = Number.parseInt(req.body.jumlah ?? 1, 10);

    if (!kematian || !kematian.tanggal || !kematian.penyebab) {
      await t.rollback();
      return res.status(400).json({
        message: "Tanggal dan penyebab kematian wajib diisi.",
      });
    }

    if (!Number.isInteger(jumlahKematian) || jumlahKematian <= 0) {
      await t.rollback();
      return res.status(400).json({
        message: "Jumlah kematian harus berupa bilangan bulat lebih dari 0.",
      });
    }

    const unitBudidaya = await UnitBudidaya.findOne({
      where: {
        id: req.body.unitBudidayaId,
        isDeleted: false,
      },
      transaction: t,
    });

    if (!unitBudidaya) {
      await t.rollback();
      return res.status(404).json({
        message: "Unit budidaya tidak ditemukan.",
      });
    }

    const currentPopulation = Number(unitBudidaya.jumlah ?? 0);
    if (jumlahKematian > currentPopulation) {
      await t.rollback();
      return res.status(400).json({
        message: `Jumlah kematian (${jumlahKematian}) melebihi populasi saat ini (${currentPopulation}).`,
      });
    }

    if (unitBudidaya.tipe == "individu" && req.body.objekBudidayaId) {
      await ObjekBudidaya.update(
        {
          isDeleted: true,
        },
        {
          transaction: t,
          where: {
            id: req.body.objekBudidayaId,
          },
        }
      );
    }

    await unitBudidaya.update(
      {
        jumlah: currentPopulation - jumlahKematian,
      },
      {
        transaction: t,
      }
    );

    let data;
    let laporanKematian;

    for (let i = 0; i < jumlahKematian; i++) {
      data = await Laporan.create(
        {
          ...req.body,
          jumlah: jumlahKematian,
          UnitBudidayaId: req.body.unitBudidayaId,
          ObjekBudidayaId: req.body.objekBudidayaId,
          UserId: req.user.id,
        },
        { transaction: t }
      );

      laporanKematian = await Kematian.create(
        {
          LaporanId: data.id,
          tanggal: kematian.tanggal,
          penyebab: kematian.penyebab,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const updatedUnit = await UnitBudidaya.findOne({
      where: {
        id: req.body.unitBudidayaId,
      },
    });

    if (unitBudidaya.tipe == "individu") {
      const updatedObjek = await ObjekBudidaya.findOne({
        where: {
          id: req.body.objekBudidayaId,
        },
      });
      res.locals.updatedData = updatedObjek.toJSON();
    }

    res.locals.createdData = { data, laporanKematian };
    res.locals.updatedData = updatedUnit.toJSON();

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanKematian,
        jumlahKematian,
        updatedUnit,
      },
    });
  } catch (error) {
    console.log(error);
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanVitamin = async (req, res) => {
  const t = await db.transaction();

  try {
    const { vitamin } = req.body;

    if (!vitamin || typeof vitamin.jumlah !== "number" || vitamin.jumlah <= 0) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Jumlah penggunaan vitamin tidak valid atau harus lebih besar dari 0.",
      });
    }
    if (!vitamin.inventarisId) {
      await t.rollback();
      return res.status(400).json({
        message: "ID Inventaris untuk vitamin tidak disertakan.",
      });
    }

    const inventaris = await Inventaris.findOne({
      where: { id: vitamin.inventarisId },
      transaction: t,
    });

    if (!inventaris) {
      await t.rollback();
      return res.status(404).json({
        message: `Inventaris (vitamin) dengan ID ${vitamin.inventarisId} tidak ditemukan.`,
      });
    }

    if (inventaris.jumlah < vitamin.jumlah) {
      await t.rollback();
      return res.status(400).json({
        message: `Stok inventaris (vitamin) "${inventaris.nama}" tidak mencukupi. Tersedia: ${inventaris.jumlah}, Dibutuhkan: ${vitamin.jumlah}.`,
      });
    }

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanVitamin = await Vitamin.create(
      {
        LaporanId: data.id,
        inventarisId: vitamin.inventarisId,
        tipe: vitamin.tipe,
        jumlah: vitamin.jumlah,
      },
      { transaction: t }
    );

    inventaris.jumlah -= vitamin.jumlah;

    await inventaris.save({ transaction: t });

    await t.commit();

    res.locals.createdData = { data, laporanVitamin };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanVitamin,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanPanen = async (req, res) => {
  const t = await db.transaction();

  try {
    const { panen, detailPanen } = req.body;
    const detailPanenIds = Array.isArray(detailPanen) ? detailPanen : [];

    if (!panen || !panen.komoditasId) {
      await t.rollback();
      return res.status(400).json({
        message: "Data panen dan komoditas wajib diisi.",
      });
    }

    const komoditas = await Komoditas.findOne({
      where: { id: panen.komoditasId, isDeleted: false },
      include: [
        {
          model: Satuan,
          required: false,
        },
      ],
      transaction: t,
    });

    if (!komoditas) {
      await t.rollback();
      return res.status(404).json({
        message: "Komoditas tidak ditemukan.",
      });
    }

    const panenConfig = normalizePanenConfig(komoditas.panenConfig, komoditas);

    const jumlahValidation = validatePositiveField(
      panen.jumlah,
      panenConfig.jumlah,
      "Jumlah panen",
      "satuan"
    );

    if (jumlahValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: jumlahValidation.message });
    }

    const beratValidation = validatePositiveField(
      panen.berat,
      panenConfig.berat,
      "Berat panen",
      "kg"
    );

    if (beratValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: beratValidation.message });
    }

    const jumlahPanen = jumlahValidation.value;
    const beratPanen = beratValidation.value;
    const rawJumlahHewan = parseOptionalNumber(panen.jumlahHewan);
    const jumlahHewanConfig = {
      ...panenConfig.jumlahHewan,
      integerOnly: true,
    };
    let jumlahHewan = Number(jumlahHewanConfig.defaultValue ?? 0) || 0;

    if (!jumlahHewanConfig.enabled) {
      if (rawJumlahHewan !== null && rawJumlahHewan > 0) {
        await t.rollback();
        return res.status(400).json({
          message: "Jumlah hewan tidak digunakan untuk komoditas ini.",
        });
      }
    } else if (rawJumlahHewan === null) {
      if (jumlahHewanConfig.required) {
        await t.rollback();
        return res.status(400).json({
          message: buildPositiveNumberMessage(
            jumlahHewanConfig,
            "Jumlah hewan yang dipanen",
            "ekor"
          ),
        });
      }
    } else {
      if (
        !Number.isFinite(rawJumlahHewan) ||
        rawJumlahHewan < 0 ||
        !Number.isInteger(rawJumlahHewan)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: "Jumlah hewan yang dipanen harus berupa angka bulat minimal 0.",
        });
      }

      if (jumlahHewanConfig.required && rawJumlahHewan <= 0) {
        await t.rollback();
        return res.status(400).json({
          message: buildPositiveNumberMessage(
            jumlahHewanConfig,
            "Jumlah hewan yang dipanen",
            "ekor"
          ),
        });
      }

      jumlahHewan = rawJumlahHewan;
    }

    const rincianGrade = Array.isArray(panen.rincianGrade) ? panen.rincianGrade : [];
    const rincianGradeData = [];
    const gradeConfig = panenConfig.grade;
    const allowedGradeFields = gradeConfig.allowedFields || ["jumlah", "berat"];
    const allowGradeJumlah = allowedGradeFields.includes("jumlah");
    const allowGradeBerat = allowedGradeFields.includes("berat");
    const allowedGradeText = allowedGradeFields.join(" atau ");

    if (!gradeConfig.enabled && rincianGrade.length > 0) {
      await t.rollback();
      return res.status(400).json({
        message: "Rincian grade tidak digunakan untuk komoditas ini.",
      });
    }

    if (gradeConfig.enabled && gradeConfig.required && rincianGrade.length === 0) {
      await t.rollback();
      return res.status(400).json({
        message: "Rincian grade wajib diisi untuk komoditas ini.",
      });
    }

    for (const rincian of gradeConfig.enabled ? rincianGrade : []) {
      const hasJumlahGrade = hasNumericValue(rincian.jumlah);
      const hasBeratGrade = hasNumericValue(rincian.berat);
      const jumlahGrade = parseOptionalNumber(rincian.jumlah);
      const beratGrade = parseOptionalNumber(rincian.berat);

      if (!rincian.gradeId) {
        await t.rollback();
        return res.status(400).json({
          message: `Rincian grade wajib memiliki gradeId dan minimal salah satu dari ${allowedGradeText}.`,
        });
      }

      if ((!allowGradeJumlah && hasJumlahGrade) || (!allowGradeBerat && hasBeratGrade)) {
        await t.rollback();
        return res.status(400).json({
          message: `Rincian grade hanya boleh mengirim field: ${allowedGradeFields.join(", ")}.`,
        });
      }

      if (
        (!allowGradeJumlah || !hasJumlahGrade) &&
        (!allowGradeBerat || !hasBeratGrade)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: `Rincian grade wajib memiliki gradeId dan minimal salah satu dari ${allowedGradeText}.`,
        });
      }

      if (
        allowGradeJumlah &&
        hasJumlahGrade &&
        (!Number.isFinite(jumlahGrade) ||
          jumlahGrade <= 0 ||
          (panenConfig.jumlah.integerOnly && !Number.isInteger(jumlahGrade)))
      ) {
        await t.rollback();
        return res.status(400).json({
          message: buildPositiveNumberMessage(
            panenConfig.jumlah,
            "Jumlah grade",
            "satuan"
          ),
        });
      }

      if (
        allowGradeBerat &&
        hasBeratGrade &&
        (!Number.isFinite(beratGrade) || beratGrade <= 0)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: "Berat grade wajib diisi sebagai angka kg lebih dari 0.",
        });
      }

      rincianGradeData.push({
        gradeId: rincian.gradeId,
        jumlah: allowGradeJumlah && hasJumlahGrade ? jumlahGrade : null,
        berat: allowGradeBerat && hasBeratGrade ? beratGrade : null,
        persentaseJumlah: percentageOf(jumlahGrade, jumlahPanen),
        persentaseBerat: percentageOf(beratGrade, beratPanen),
      });
    }

    const totalGradeJumlah = rincianGradeData.reduce((sum, item) => sum + (item.jumlah ?? 0), 0);
    const totalGradeBerat = rincianGradeData.reduce((sum, item) => sum + (item.berat ?? 0), 0);

    if (
      gradeConfig.validateTotalJumlah &&
      allowGradeJumlah &&
      jumlahPanen > 0 &&
      totalGradeJumlah > jumlahPanen
    ) {
      await t.rollback();
      return res.status(400).json({
        message: "Total jumlah pada rincian grade tidak boleh melebihi jumlah panen.",
      });
    }

    if (
      gradeConfig.validateTotalBerat &&
      allowGradeBerat &&
      beratPanen > 0 &&
      Number(totalGradeBerat.toFixed(4)) > beratPanen
    ) {
      await t.rollback();
      return res.status(400).json({
        message: "Total berat pada rincian grade tidak boleh melebihi berat panen.",
      });
    }

    const unitBudidaya = await UnitBudidaya.findOne({
      where: { id: req.body.unitBudidayaId, isDeleted: false },
      transaction: t,
    });

    if (!unitBudidaya) {
      await t.rollback();
      return res.status(404).json({
        message: "Unit budidaya tidak ditemukan.",
      });
    }

    const detailValidation = await validateDetailPanenIds(
      req.body.unitBudidayaId,
      detailPanenIds,
      t
    );

    if (detailValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: detailValidation.message });
    }

    const validDetailPanenIds = detailValidation.ids;

    const currentPopulation = Number(unitBudidaya.jumlah ?? 0);
    if (jumlahHewan > currentPopulation) {
      await t.rollback();
      return res.status(400).json({
        message: `Jumlah hewan dipanen (${jumlahHewan}) melebihi populasi saat ini (${currentPopulation}).`,
      });
    }

    const produk = komoditas.produkId
      ? await Produk.findOne({
        where: { id: komoditas.produkId, isDeleted: false },
        transaction: t,
      })
      : null;

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanPanen = await Panen.create(
      {
        LaporanId: data.id,
        komoditasId: panen.komoditasId,
        jumlah: jumlahPanen,
        berat: beratPanen,
        jumlahHewan,
      },
      { transaction: t }
    );

    // Handle grade data for livestock harvest (similar to plant harvest)
    if (rincianGradeData.length > 0) {
      await PanenRincianGrade.bulkCreate(
        rincianGradeData.map((rincianGrade) => ({
          panenId: laporanPanen.id,
          gradeId: rincianGrade.gradeId,
          jumlah: rincianGrade.jumlah,
          berat: rincianGrade.berat,
          persentaseJumlah: rincianGrade.persentaseJumlah,
          persentaseBerat: rincianGrade.persentaseBerat,
        })),
        { transaction: t }
      );
    }

    komoditas.jumlah = Number(komoditas.jumlah ?? 0) + Number(jumlahPanen ?? 0);
    await komoditas.save({ transaction: t });

    if (produk) {
      await produk.update(
        {
          nama: komoditas.nama,
          stok: komoditas.jumlah,
        },
        { transaction: t }
      );
    }

    if (unitBudidaya.tipe === "individu" && validDetailPanenIds.length > 0) {
      for (const item of validDetailPanenIds) {
        await DetailPanen.create(
          {
            PanenId: laporanPanen.id,
            ObjekBudidayaId: item,
          },
          { transaction: t }
        );

        if (komoditas.hapusObjek === true) {
          await ObjekBudidaya.update(
            {
              isDeleted: true,
            },
            {
              transaction: t,
              where: {
                id: item,
              },
            }
          );

          await UnitBudidaya.decrement("jumlah", {
            by: 1,
            transaction: t,
            where: {
              id: req.body.unitBudidayaId,
            },
          });
        }
      }
    } else {
      if (komoditas.tipeKomoditas === "individu") {
        if (komoditas.hapusObjek === true) {
          if (req.body.objekBudidayaId != null) {
            await ObjekBudidaya.update(
              {
                isDeleted: true,
              },
              {
                transaction: t,
                where: {
                  id: req.body.objekBudidayaId,
                },
              }
            );

            await UnitBudidaya.decrement("jumlah", {
              by: 1,
              transaction: t,
              where: {
                id: req.body.unitBudidayaId,
              },
            });
          } else {
            await UnitBudidaya.decrement("jumlah", {
              by: 1,
              transaction: t,
              where: {
                id: req.body.unitBudidayaId,
              },
            });
          }
        }
      } else if (jumlahHewan > 0) {
        unitBudidaya.jumlah = currentPopulation - jumlahHewan;
        await unitBudidaya.save({ transaction: t });
      }
    }

    await t.commit();

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanPanen,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanPanenSimple = async (req, res) => {
  const t = await db.transaction();

  try {
    const { panen, detailPanen } = req.body;
    const detailPanenIds = Array.isArray(detailPanen) ? detailPanen : [];

    if (!panen || !panen.komoditasId) {
      await t.rollback();
      return res.status(400).json({
        message: "Data panen dan komoditas wajib diisi.",
      });
    }

    const komoditas = await Komoditas.findOne({
      where: { id: panen.komoditasId, isDeleted: false },
      include: [
        {
          model: Satuan,
          required: false,
        },
      ],
      transaction: t,
    });

    if (!komoditas) {
      await t.rollback();
      return res.status(404).json({
        message: "Komoditas tidak ditemukan.",
      });
    }

    const panenConfig = normalizePanenConfig(komoditas.panenConfig, komoditas);

    const jumlahValidation = validatePositiveField(
      panen.jumlah,
      panenConfig.jumlah,
      "Jumlah panen",
      "satuan"
    );

    if (jumlahValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: jumlahValidation.message });
    }

    const beratValidation = validatePositiveField(
      panen.berat,
      panenConfig.berat,
      "Berat panen",
      "kg"
    );

    if (beratValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: beratValidation.message });
    }

    const jumlahPanen = jumlahValidation.value;
    const beratPanen = beratValidation.value;
    const rawJumlahHewan = parseOptionalNumber(panen.jumlahHewan);
    const jumlahHewanConfig = {
      ...panenConfig.jumlahHewan,
      integerOnly: true,
    };
    let jumlahHewan = Number(jumlahHewanConfig.defaultValue ?? 0) || 0;

    if (!jumlahHewanConfig.enabled) {
      if (rawJumlahHewan !== null && rawJumlahHewan > 0) {
        await t.rollback();
        return res.status(400).json({
          message: "Jumlah hewan tidak digunakan untuk komoditas ini.",
        });
      }
    } else if (rawJumlahHewan === null) {
      if (jumlahHewanConfig.required) {
        await t.rollback();
        return res.status(400).json({
          message: buildPositiveNumberMessage(
            jumlahHewanConfig,
            "Jumlah hewan yang dipanen",
            "ekor"
          ),
        });
      }
    } else {
      if (
        !Number.isFinite(rawJumlahHewan) ||
        rawJumlahHewan < 0 ||
        !Number.isInteger(rawJumlahHewan)
      ) {
        await t.rollback();
        return res.status(400).json({
          message: "Jumlah hewan yang dipanen harus berupa angka bulat minimal 0.",
        });
      }

      if (jumlahHewanConfig.required && rawJumlahHewan <= 0) {
        await t.rollback();
        return res.status(400).json({
          message: buildPositiveNumberMessage(
            jumlahHewanConfig,
            "Jumlah hewan yang dipanen",
            "ekor"
          ),
        });
      }

      jumlahHewan = rawJumlahHewan;
    }

    const unitBudidaya = await UnitBudidaya.findOne({
      where: { id: req.body.unitBudidayaId, isDeleted: false },
      transaction: t,
    });

    if (!unitBudidaya) {
      await t.rollback();
      return res.status(404).json({
        message: "Unit budidaya tidak ditemukan.",
      });
    }

    const detailValidation = await validateDetailPanenIds(
      req.body.unitBudidayaId,
      detailPanenIds,
      t
    );

    if (detailValidation.message) {
      await t.rollback();
      return res.status(400).json({ message: detailValidation.message });
    }

    const validDetailPanenIds = detailValidation.ids;

    const currentPopulation = Number(unitBudidaya.jumlah ?? 0);
    if (jumlahHewan > currentPopulation) {
      await t.rollback();
      return res.status(400).json({
        message: `Jumlah hewan dipanen (${jumlahHewan}) melebihi populasi saat ini (${currentPopulation}).`,
      });
    }

    const produk = komoditas.produkId
      ? await Produk.findOne({
        where: { id: komoditas.produkId, isDeleted: false },
        transaction: t,
      })
      : null;

    const laporanPayload = {
      judul: req.body.judul || `Laporan Panen - ${komoditas.nama}`,
      tipe: "panen",
      UnitBudidayaId: req.body.unitBudidayaId,
      ObjekBudidayaId: req.body.objekBudidayaId,
      UserId: req.user.id,
      gambar: null,
      catatan: null,
    };

    if (req.body.createdAt) {
      laporanPayload.createdAt = req.body.createdAt;
    }

    const data = await Laporan.create(laporanPayload, { transaction: t });

    const laporanPanen = await Panen.create(
      {
        LaporanId: data.id,
        komoditasId: panen.komoditasId,
        jumlah: jumlahPanen,
        berat: beratPanen,
        jumlahHewan,
      },
      { transaction: t }
    );

    komoditas.jumlah = Number(komoditas.jumlah ?? 0) + Number(jumlahPanen ?? 0);
    await komoditas.save({ transaction: t });

    if (produk) {
      await produk.update(
        {
          nama: komoditas.nama,
          stok: komoditas.jumlah,
        },
        { transaction: t }
      );
    }

    if (unitBudidaya.tipe === "individu" && validDetailPanenIds.length > 0) {
      for (const item of validDetailPanenIds) {
        await DetailPanen.create(
          {
            PanenId: laporanPanen.id,
            ObjekBudidayaId: item,
          },
          { transaction: t }
        );

        if (komoditas.hapusObjek === true) {
          await ObjekBudidaya.update(
            {
              isDeleted: true,
            },
            {
              transaction: t,
              where: {
                id: item,
              },
            }
          );

          await UnitBudidaya.decrement("jumlah", {
            by: 1,
            transaction: t,
            where: {
              id: req.body.unitBudidayaId,
            },
          });
        }
      }
    } else {
      if (komoditas.tipeKomoditas === "individu") {
        if (komoditas.hapusObjek === true) {
          if (req.body.objekBudidayaId != null) {
            await ObjekBudidaya.update(
              {
                isDeleted: true,
              },
              {
                transaction: t,
                where: {
                  id: req.body.objekBudidayaId,
                },
              }
            );

            await UnitBudidaya.decrement("jumlah", {
              by: 1,
              transaction: t,
              where: {
                id: req.body.unitBudidayaId,
              },
            });
          } else {
            await UnitBudidaya.decrement("jumlah", {
              by: 1,
              transaction: t,
              where: {
                id: req.body.unitBudidayaId,
              },
            });
          }
        }
      } else if (jumlahHewan > 0) {
        unitBudidaya.jumlah = currentPopulation - jumlahHewan;
        await unitBudidaya.save({ transaction: t });
      }
    }

    await t.commit();

    return res.status(201).json({
      status: true,
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanPanen,
      },
    });
  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanPanenKebun = async (req, res) => {
  const t = await db.transaction();

  try {
    const { panen } = req.body;

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanPanen = await PanenKebun.create(
      {
        LaporanId: data.id,
        komoditasId: panen.komoditasId,
        tanggalPanen: panen.tanggalPanen,
        estimasiPanen: panen.estimasiPanen,
        realisasiPanen: panen.realisasiPanen,
        gagalPanen: panen.gagalPanen,
        umurTanamanPanen: panen.umurTanamanPanen,
      },
      { transaction: t }
    );

    if (panen.rincianGrade && panen.rincianGrade.length > 0) {
      const rincianGradeData = panen.rincianGrade.map((rincianGrade) => ({
        panenKebunId: laporanPanen.id,
        gradeId: rincianGrade.gradeId,
        jumlah: rincianGrade.jumlah,
      }));

      await PanenRincianGrade.bulkCreate(rincianGradeData, { transaction: t });
    }

    const [komoditas, unitBudidaya] = await Promise.all([
      Komoditas.findOne({
        where: { id: panen.komoditasId },
        transaction: t,
      }),
      UnitBudidaya.findOne({
        where: { id: req.body.unitBudidayaId },
        transaction: t,
      }),
    ]);

    if (!komoditas) {
      throw new Error(
        `Komoditas dengan ID ${panen.komoditasId} tidak ditemukan`
      );
    }

    if (!unitBudidaya) {
      throw new Error(
        `Unit budidaya dengan ID ${req.body.unitBudidayaId} tidak ditemukan`
      );
    }

    const produk = await Produk.findOne({
      where: { id: komoditas.produkId, isDeleted: false },
    });

    komoditas.jumlah += panen.realisasiPanen;
    await komoditas.save({ transaction: t });

    if (produk) {
      await produk.update(
        {
          nama: komoditas.nama,
          stok: komoditas.jumlah,
        },
        { transaction: t }
      );
    }

    if (komoditas.hapusObjek === true) {
      const updateResult = await ObjekBudidaya.update(
        { isDeleted: true },
        {
          where: {
            unitBudidayaId: req.body.unitBudidayaId,
            isDeleted: false,
          },
          transaction: t,
        }
      );

      const deletedCount = updateResult[0];
      if (deletedCount > 0) {
        await UnitBudidaya.decrement("jumlah", {
          by: deletedCount,
          transaction: t,
          where: { id: req.body.unitBudidayaId },
        });
      }
    }

    await t.commit();

    res.locals.createdData = { data, laporanPanen };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanPanen,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanHama = async (req, res) => {
  const t = await db.transaction();

  try {
    const { hama } = req.body;

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanHama = await Hama.create(
      {
        LaporanId: data.id,
        JenisHamaId: hama.jenisHamaId,
        jumlah: hama.jumlah,
        status: hama.status,
      },
      { transaction: t }
    );

    await t.commit();

    res.locals.createdData = { data, laporanHama };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanHama,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createLaporanPenggunaanInventaris = async (req, res) => {
  const t = await db.transaction();

  try {
    const { penggunaanInv } = req.body;

    if (
      !penggunaanInv ||
      typeof penggunaanInv.jumlah !== "number" ||
      penggunaanInv.jumlah <= 0
    ) {
      await t.rollback();
      return res.status(400).json({
        message:
          "Jumlah penggunaan inventaris tidak valid atau harus lebih besar dari 0.",
      });
    }

    const inventaris = await Inventaris.findOne({
      where: { id: penggunaanInv.inventarisId },
      transaction: t,
    });

    if (!inventaris) {
      await t.rollback();
      return res.status(404).json({
        message: `Inventaris dengan ID ${penggunaanInv.inventarisId} tidak ditemukan.`,
      });
    }

    if (inventaris.jumlah < penggunaanInv.jumlah) {
      await t.rollback();
      return res.status(400).json({
        message: `Stok inventaris "${inventaris.nama}" tidak mencukupi (tersedia: ${inventaris.jumlah}, dibutuhkan: ${penggunaanInv.jumlah}). Inventaris tidak dapat digunakan.`,
      });
    }

    const data = await Laporan.create(
      {
        ...req.body,
        UnitBudidayaId: req.body.unitBudidayaId,
        ObjekBudidayaId: req.body.objekBudidayaId,
        UserId: req.user.id,
      },
      { transaction: t }
    );

    const laporanPenggunaanInventaris = await PenggunaanInventaris.create(
      {
        LaporanId: data.id,
        inventarisId: penggunaanInv.inventarisId,
        jumlah: penggunaanInv.jumlah,
      },
      { transaction: t }
    );

    inventaris.jumlah -= penggunaanInv.jumlah;

    await inventaris.save({ transaction: t });

    await t.commit();

    res.locals.createdData = { data, laporanPenggunaanInventaris };

    return res.status(201).json({
      message: "Successfully created new laporan data",
      data: {
        data,
        laporanPenggunaanInventaris,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getJumlahKematian = async (req, res) => {
  try {
    const { unitBudidayaId } = req.params;

    const laporan = await Laporan.findAll({
      where: {
        UnitBudidayaId: unitBudidayaId,
        isDeleted: false,
        tipe: "kematian",
      },
      attributes: [[fn("COUNT", col("id")), "jumlahKematian"]],
      group: ["UnitBudidayaId"],
    });

    if (laporan.length === 0) {
      return res.status(404).json({
        message: "No kematian reports found for this unit.",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved jumlah kematian",
      data: laporan[0].dataValues.jumlahKematian,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getHasilPanenWithGrades = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      komoditasId,
      unitBudidayaId,
      startDate,
      endDate,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate pagination parameters
    if (parseInt(page) < 1 || parseInt(limit) < 1) {
      return res.status(400).json({
        status: false,
        message: "Page and limit must be positive numbers",
      });
    }

    if (parseInt(limit) > 100) {
      return res.status(400).json({
        status: false,
        message: "Limit cannot exceed 100 items per page",
      });
    }

    // Build where clause for filtering
    const whereClause = {
      isDeleted: false,
      tipe: "panen",
    };

    // Validate and apply date filters
    if (startDate || endDate) {
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
              status: false,
              message: "Invalid date format. Please use YYYY-MM-DD format",
            });
          }

          if (start > end) {
            return res.status(400).json({
              status: false,
              message: "Start date must be before or equal to end date",
            });
          }

          whereClause.createdAt = {
            [Op.between]: [start, end],
          };
        } catch (error) {
          return res.status(400).json({
            status: false,
            message: "Error parsing dates. Please use YYYY-MM-DD format",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message:
            "Both startDate and endDate are required when filtering by date range",
        });
      }
    }

    // Unit budidaya filter
    if (unitBudidayaId) {
      whereClause.UnitBudidayaId = unitBudidayaId;
    }

    // Komoditas filter (will be applied in PanenKebun include)
    const panenKebunWhere = {};
    if (komoditasId) {
      panenKebunWhere.komoditasId = komoditasId;
    }

    const { count, rows } = await Laporan.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "judul",
        "tipe",
        "gambar",
        "catatan",
        "isDeleted",
        "createdAt",
        "updatedAt",
        "UnitBudidayaId",
        "ObjekBudidayaId",
        "userId",
      ],
      include: [
        {
          model: PanenKebun,
          where: panenKebunWhere,
          required: true,
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["id", "nama", "panenConfig"],
              include: [
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                },
              ],
            },
            {
              model: PanenRincianGrade,
              include: [
                {
                  model: Grade,
                  attributes: ["id", "nama", "deskripsi"],
                },
              ],
              required: false, // Allow harvest records without grades
            },
          ],
        },
        {
          model: UnitBudidaya,
          attributes: ["id", "nama", "tipe"],
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "tipe"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // Transform data for better frontend consumption
    const transformedData = rows.map((laporan) => {
      const panenKebun = laporan.PanenKebun;
      const grades = panenKebun.PanenRincianGrades || [];

      // Calculate grade summary
      const gradeSummary = grades.map((grade) => ({
        gradeId: grade.Grade.id,
        gradeNama: grade.Grade.nama,
        gradeDeskripsi: grade.Grade.deskripsi,
        jumlah: grade.jumlah,
        persentase:
          panenKebun.realisasiPanen > 0
            ? ((grade.jumlah / panenKebun.realisasiPanen) * 100).toFixed(2)
            : 0,
      }));

      return {
        laporanId: laporan.id,
        judul: laporan.judul,
        tanggalLaporan: laporan.createdAt,
        tanggalPanen: panenKebun.tanggalPanen,
        gambar: laporan.gambar,
        catatan: laporan.catatan,
        pelapor: {
          id: laporan.user.id,
          nama: laporan.user.name,
        },
        unitBudidaya: {
          id: laporan.UnitBudidaya.id,
          nama: laporan.UnitBudidaya.nama,
          tipe: laporan.UnitBudidaya.tipe,
          jenisBudidaya: laporan.UnitBudidaya.JenisBudidaya.nama,
        },
        komoditas: {
          id: panenKebun.komoditas.id,
          nama: panenKebun.komoditas.nama,
          jenis: panenKebun.komoditas.jenis,
          satuan: panenKebun.komoditas.Satuan,
        },
        hasilPanen: {
          estimasiPanen: panenKebun.estimasiPanen,
          realisasiPanen: panenKebun.realisasiPanen,
          gagalPanen: panenKebun.gagalPanen,
          umurTanamanPanen: panenKebun.umurTanamanPanen,
          efisiensiPanen:
            panenKebun.estimasiPanen > 0
              ? (
                (panenKebun.realisasiPanen / panenKebun.estimasiPanen) *
                100
              ).toFixed(2)
              : 0,
        },
        rincianGrade: gradeSummary,
        totalGradeCount: grades.length,
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved hasil panen data with grades",
      data: transformedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const getGradeSummaryByKomoditas = async (req, res) => {
  try {
    const { komoditasId, startDate, endDate, unitBudidayaId } = req.query;

    // Validate required parameter
    if (!komoditasId || komoditasId.trim() === "") {
      return res.status(400).json({
        status: false,
        message: "Parameter 'komoditasId' is required and cannot be empty",
      });
    }

    // Validate that the commodity exists
    const komoditasExists = await Komoditas.findOne({
      where: {
        id: komoditasId.trim(),
        isDeleted: false,
      },
    });

    if (!komoditasExists) {
      return res.status(404).json({
        status: false,
        message: `Komoditas with ID '${komoditasId}' not found or has been deleted`,
      });
    }

    // Build where clause for date filtering
    const whereClause = {
      isDeleted: false,
      tipe: "panen",
    };

    // Validate and apply date filters
    if (startDate || endDate) {
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Check if dates are valid
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
              status: false,
              message: "Invalid date format. Please use YYYY-MM-DD format",
            });
          }

          // Check if start date is before end date
          if (start > end) {
            return res.status(400).json({
              status: false,
              message: "Start date must be before or equal to end date",
            });
          }

          whereClause.createdAt = {
            [Op.between]: [start, end],
          };
        } catch (error) {
          return res.status(400).json({
            status: false,
            message: "Error parsing dates. Please use YYYY-MM-DD format",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message:
            "Both startDate and endDate are required when filtering by date range",
        });
      }
    }

    if (unitBudidayaId) {
      whereClause.UnitBudidayaId = unitBudidayaId;
    }

    // Get all harvest records for the commodity
    const laporanPanen = await Laporan.findAll({
      where: whereClause,
      include: [
        {
          model: PanenKebun,
          where: { komoditasId: komoditasId },
          required: true,
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["id", "nama", "panenConfig"],
              include: [
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                },
              ],
            },
            {
              model: PanenRincianGrade,
              include: [
                {
                  model: Grade,
                  attributes: ["id", "nama", "deskripsi"],
                },
              ],
              required: false,
            },
          ],
        },
      ],
    });

    if (laporanPanen.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No harvest data found for this commodity",
      });
    }

    // Aggregate grade data
    const gradeAggregation = {};
    let totalHarvestAmount = 0;
    let totalHarvestCount = 0;

    laporanPanen.forEach((laporan) => {
      const panenKebun = laporan.PanenKebun;
      totalHarvestAmount += panenKebun.realisasiPanen || 0;
      totalHarvestCount++;

      panenKebun.PanenRincianGrades.forEach((rincian) => {
        const gradeId = rincian.Grade.id;
        const gradeName = rincian.Grade.nama;
        const gradeDesc = rincian.Grade.deskripsi;
        const amount = rincian.jumlah;

        if (!gradeAggregation[gradeId]) {
          gradeAggregation[gradeId] = {
            gradeId: gradeId,
            gradeNama: gradeName,
            gradeDeskripsi: gradeDesc,
            totalJumlah: 0,
            harvestCount: 0,
            averagePerHarvest: 0,
          };
        }

        gradeAggregation[gradeId].totalJumlah += amount;
        gradeAggregation[gradeId].harvestCount++;
      });
    });

    // Calculate averages and percentages
    const gradeSummary = Object.values(gradeAggregation).map((grade) => ({
      ...grade,
      averagePerHarvest: (grade.totalJumlah / grade.harvestCount).toFixed(2),
      persentaseTotal:
        totalHarvestAmount > 0
          ? ((grade.totalJumlah / totalHarvestAmount) * 100).toFixed(2)
          : 0,
    }));

    // Sort by total amount descending
    gradeSummary.sort((a, b) => b.totalJumlah - a.totalJumlah);

    // Get commodity info
    const komoditasInfo = laporanPanen[0].PanenKebun.komoditas;

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved grade summary",
      data: {
        komoditas: {
          id: komoditasInfo.id,
          nama: komoditasInfo.nama,
          jenis: komoditasInfo.jenis,
          satuan: komoditasInfo.Satuan,
        },
        periodeSummary: {
          totalHarvestCount: totalHarvestCount,
          totalHarvestAmount: totalHarvestAmount,
          averagePerHarvest:
            totalHarvestCount > 0
              ? (totalHarvestAmount / totalHarvestCount).toFixed(2)
              : 0,
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
        },
        gradeSummary: gradeSummary,
        totalGradeTypes: gradeSummary.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanHarianKebunById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "harian",
      },
      include: [
        {
          model: HarianKebun,
          attributes: {
            exclude: ["createdAt", "updatedAt", "LaporanId", "id", "isDeleted"],
          },
          require: true,
        },
        ...(DailyReportMetric
          ? [
            {
              model: DailyReportMetric,
              as: "dailyReportMetrics",
              where: { isDeleted: false },
              required: false,
            },
          ]
          : []),
        {
          model: ObjekBudidaya,
          attributes: ["namaId"],
          require: true,
        },
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          require: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama"],
              require: true,
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
          require: true,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanHarianTernakById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "harian",
      },
      include: [
        {
          model: HarianTernak,
          attributes: {
            exclude: ["createdAt", "updatedAt", "LaporanId", "id", "isDeleted"],
          },
          require: true,
        },
        ...(DailyReportMetric
          ? [
            {
              model: DailyReportMetric,
              as: "dailyReportMetrics",
              where: { isDeleted: false },
              required: false,
            },
          ]
          : []),
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          require: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama"],
              require: true,
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
          require: true,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanSakitById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporanSakit = await Sakit.findOne({
      where: {
        id: id,
        isDeleted: false,
      },
      attributes: ["id", ["diagnosisPenyakit", "nama"], "status"],
      include: [
        {
          model: Laporan,
          attributes: ["gambar"],
        },
        {
          model: DaftarGejala,
          attributes: ["id"],
          required: false,
          include: [
            {
              model: Gejala,
              attributes: ["gejala1", "gejala2", "gejala3", "gejala4"],
              required: false,
            },
          ],
        },
      ],
    });

    if (!laporanSakit) {
      return res.status(404).json({
        message: "Data Sakit not found",
      });
    }

    const responseData = laporanSakit.toJSON();
    responseData.gambar = responseData.Laporan ? responseData.Laporan.gambar : null;
    delete responseData.Laporan;

    return res.status(200).json({
      message: "Successfully retrieved sakit data",
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanKematianById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "kematian",
      },
      include: [
        {
          model: Kematian,
          attributes: ["tanggal", "penyebab"],
          require: true,
        },
        {
          model: ObjekBudidaya,
          attributes: ["namaId"],
          require: false,
        },
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          require: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "tipe"],
              require: true,
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
          require: true,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanVitaminById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "vitamin",
      },
      include: [
        {
          model: Vitamin,
          attributes: ["tipe", "jumlah"],
          include: [
            {
              as: "inventaris",
              model: Inventaris,
              attributes: ["nama", "gambar"],
              require: true,
              include: [
                {
                  model: KategoriInventaris,
                  as: "kategoriInventaris",
                  attributes: ["nama"],
                },
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                  require: true,
                },
              ],
            },
          ],
          require: true,
        },
        {
          model: ObjekBudidaya,
          attributes: ["namaId"],
          require: false,
        },
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          require: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "tipe"],
              require: true,
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
          require: true,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanPanenById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "panen",
      },
      include: [
        {
          model: Panen,
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["id", "nama", "panenConfig"],
              include: [
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                },
              ],
            },
            {
              model: PanenRincianGrade,
              include: [
                {
                  model: Grade,
                  attributes: ["id", "nama", "deskripsi"],
                },
              ],
              required: false, // Allow harvest records without grades
            },
          ],
        },
        {
          model: ObjekBudidaya,
          attributes: ["namaId"],
          require: false,
        },
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          require: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "tipe"],
              require: true,
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
          require: true,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    const responseData = laporan.toJSON();

    if (responseData.Panen?.komoditas) {
      responseData.Panen.komoditas = attachPanenConfig(
        responseData.Panen.komoditas
      );
    }

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved laporan data",
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanPanenKebunById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "panen",
      },
      include: [
        {
          model: PanenKebun,
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["nama"],
              include: [
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                },
              ],
            },
            {
              model: PanenRincianGrade,
              include: [
                {
                  model: Grade,
                  attributes: ["nama"],
                },
              ],
            },
          ],
        },
        {
          model: UnitBudidaya,
          attributes: ["nama"],
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["name"],
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanHamaById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "hama",
      },
      include: [
        {
          model: Hama,
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getLaporanPenggunaanInventarisById = async (req, res) => {
  try {
    const { id } = req.params;

    const laporan = await Laporan.findOne({
      where: {
        id: id,
        isDeleted: false,
        tipe: "inventaris",
      },
      include: [
        {
          model: PenggunaanInventaris,
          include: [Inventaris],
        },
      ],
    });

    if (!laporan) {
      return res.status(404).json({
        message: "Laporan not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved laporan data",
      data: laporan,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getHasilPanenTernakWithGrades = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      komoditasId,
      unitBudidayaId,
      startDate,
      endDate,
    } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Validate pagination parameters
    if (parseInt(page) < 1 || parseInt(limit) < 1) {
      return res.status(400).json({
        status: false,
        message: "Page and limit must be positive numbers",
      });
    }

    if (parseInt(limit) > 100) {
      return res.status(400).json({
        status: false,
        message: "Limit cannot exceed 100 items per page",
      });
    }

    // Build where clause for filtering
    const whereClause = {
      isDeleted: false,
      tipe: "panen",
    };

    // Validate and apply date filters
    if (startDate || endDate) {
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);

          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
              status: false,
              message: "Invalid date format. Please use YYYY-MM-DD format",
            });
          }

          if (start > end) {
            return res.status(400).json({
              status: false,
              message: "Start date must be before or equal to end date",
            });
          }

          whereClause.createdAt = {
            [Op.between]: [start, end],
          };
        } catch (error) {
          return res.status(400).json({
            status: false,
            message: "Error parsing dates. Please use YYYY-MM-DD format",
          });
        }
      } else {
        return res.status(400).json({
          status: false,
          message:
            "Both startDate and endDate are required when filtering by date range",
        });
      }
    }

    // Unit budidaya filter
    if (unitBudidayaId) {
      whereClause.UnitBudidayaId = unitBudidayaId;
    }

    // Komoditas filter (will be applied in Panen include)
    const panenWhere = {};
    if (komoditasId) {
      panenWhere.komoditasId = komoditasId;
    }

    const { count, rows } = await Laporan.findAndCountAll({
      where: whereClause,
      attributes: [
        "id",
        "judul",
        "tipe",
        "gambar",
        "catatan",
        "isDeleted",
        "createdAt",
        "updatedAt",
        "UnitBudidayaId",
        "ObjekBudidayaId",
        "userId",
      ],
      include: [
        {
          model: Panen,
          where: panenWhere,
          required: true,
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["id", "nama", "panenConfig"],
              include: [
                {
                  model: Satuan,
                  attributes: ["nama", "lambang"],
                },
              ],
            },
            {
              model: PanenRincianGrade,
              include: [
                {
                  model: Grade,
                  attributes: ["id", "nama", "deskripsi"],
                },
              ],
              required: false, // Allow harvest records without grades
            },
            {
              model: DetailPanen,
              include: [
                {
                  model: ObjekBudidaya,
                  attributes: ["id", "namaId"],
                },
              ],
              required: false, // Allow harvest records without detail panen
            },
          ],
        },
        {
          model: UnitBudidaya,
          attributes: ["id", "nama", "tipe"],
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "tipe"],
            },
          ],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // Transform data for better frontend consumption
    const transformedData = rows.map((laporan) => {
      const panen = laporan.Panen;
      const grades = panen.PanenRincianGrades || [];
      const detailPanen = panen.DetailPanens || [];
      const komoditas = attachPanenConfig(panen.komoditas);

      // Calculate grade summary
      const gradeSummary = grades.map((grade) => ({
        gradeId: grade.Grade.id,
        gradeNama: grade.Grade.nama,
        gradeDeskripsi: grade.Grade.deskripsi,
        jumlah: grade.jumlah,
        berat: grade.berat,
        persentaseJumlah:
          grade.persentaseJumlah ??
          (grade.jumlah !== null && panen.jumlah > 0
            ? Number(((grade.jumlah / panen.jumlah) * 100).toFixed(2))
            : null),
        persentaseBerat:
          grade.persentaseBerat ??
          (grade.berat !== null && panen.berat > 0
            ? Number(((grade.berat / panen.berat) * 100).toFixed(2))
            : null),
      }));

      // Get harvested animals info
      const harvestedAnimals = detailPanen.map((detail) => ({
        objekBudidayaId: detail.ObjekBudidaya.id,
        namaId: detail.ObjekBudidaya.namaId,
      }));

      return {
        laporanId: laporan.id,
        judul: laporan.judul,
        tanggalLaporan: laporan.createdAt,
        gambar: laporan.gambar,
        catatan: laporan.catatan,
        pelapor: {
          id: laporan.user.id,
          nama: laporan.user.name,
        },
        unitBudidaya: {
          id: laporan.UnitBudidaya.id,
          nama: laporan.UnitBudidaya.nama,
          tipe: laporan.UnitBudidaya.tipe,
          jenisBudidaya: laporan.UnitBudidaya.JenisBudidaya.nama,
        },
        komoditas: {
          id: komoditas.id,
          nama: komoditas.nama,
          satuan: komoditas.Satuan,
          panenConfig: komoditas.panenConfig,
        },
        hasilPanen: {
          jumlahPanen: panen.jumlah,
          beratPanen: panen.berat,
          jumlahHewanDipanen: panen.jumlahHewan ?? harvestedAnimals.length,
        },
        rincianGrade: gradeSummary,
        hewanDipanen: harvestedAnimals,
        totalGradeCount: grades.length,
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved hasil panen ternak data with grades",
      data: transformedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const getAyamTidakBertelur = async (req, res) => {
  try {
    const { unitBudidayaId, days, thresholdPercent, startDate, endDate } = req.query;

    if (!unitBudidayaId) {
      return res.status(400).json({
        status: false,
        message: "unitBudidayaId wajib diisi",
      });
    }

    const context = await getEggProductionDropContext({
      unitBudidayaId,
      days,
      thresholdPercent,
      startDate,
      endDate,
    });

    return res.status(200).json({
      status: true,
      message: "Successfully retrieved chickens that did not lay eggs",
      data: context.nonLayingChickens,
      summary: {
        code: context.code,
        unitBudidayaId: context.unitBudidayaId,
        unitName: context.unitName,
        unitType: context.unitType,
        isIndividualHarvestReady: context.isIndividualHarvestReady,
        period: context.period,
        thresholdPercent: context.thresholdPercent,
        activeChickenCount: context.activeChickenCount,
        layingChickenCount: context.layingChickenCount,
        nonLayingChickenCount: context.nonLayingChickenCount,
        nonLayingPercent: context.nonLayingPercent,
        isIndication: context.isIndication,
        status: context.status,
        message: context.message,
        daily: context.daily,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const getAyamPenurunanProduktivitas = async (req, res) => {
  try {
    const { unitBudidayaId } = req.query;
    const limitLaporan = parseInt(req.query.laporanCount) || 2;

    if (!unitBudidayaId) {
      return res.status(400).json({
        status: false,
        message: "unitBudidayaId wajib diisi",
      });
    }

    const allAyam = await ObjekBudidaya.findAll({
      where: {
        UnitBudidayaId: unitBudidayaId,
        isDeleted: false,
      },
      include: [
        {
          model: UnitBudidaya,
          attributes: ['gambar']
        }
      ]
    });

    // Cari Laporan terakhir
    const lastLaporanPanen = await Laporan.findAll({
      where: {
        UnitBudidayaId: unitBudidayaId,
        tipe: 'panen',
        isDeleted: false,
      },
      order: [['createdAt', 'DESC']],
      limit: limitLaporan,
      attributes: ['id']
    });

    if (lastLaporanPanen.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Belum ada data laporan panen",
        data: [],
      });
    }

    const laporanIds = lastLaporanPanen.map(l => l.id);

    // Ambil detail panen hanya untuk Laporan-laporan terakhir tersebut
    const detailPanenList = await DetailPanen.findAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: Panen,
          required: true,
          where: {
            isDeleted: false,
            LaporanId: {
              [Op.in]: laporanIds
            }
          }
        },
      ],
    });

    // Hitung berapa kali tiap ayam panen di N laporan terakhir
    const panenCountMap = new Map();
    for (const dp of detailPanenList) {
      const objId = dp.ObjekBudidayaId;
      panenCountMap.set(objId, (panenCountMap.get(objId) || 0) + 1);
    }

    // 4. Saring ayam yang jumlah panennya = 0 (absen di semua N laporan panen terakhir)
    let ayamPenurunanProduktivitas = allAyam
      .filter((ayam) => {
        const panenCount = panenCountMap.get(ayam.id) || 0;
        return panenCount === 0;
      })
      .map((ayam) => {
        const ayamJson = ayam.toJSON();
        ayamJson.gambarUnit = ayam.UnitBudidaya ? ayam.UnitBudidaya.gambar : null;
        return ayamJson;
      });

    //Mencari Laporan Ayam Sakit
    laporanSakitAktif = await Laporan.findAll({
      where: {
        objekBudidayaId: {
          [Op.in]: ayamPenurunanProduktivitas.map(a => a.id)
        },
        tipe: 'sakit',
        isDeleted: false,
        [Op.or]: [
          {
            objekBudidayaId: {
              // 1. Ayam yang sakit tapi tidak masuk list
              [Op.in]: ayamPenurunanProduktivitas.map(a => a.id)
            }
          },
          {
            ObjekBudidayaId: null // 2. Ayam sakit massal
          }
        ]
      },
      include: [
        {
          model: Sakit,
          required: true,
        }
      ]
    });



    return res.status(200).json({
      status: true,
      message: "Berhasil mengambil data ayam dengan penurunan produktivitas",
      data: ayamPenurunanProduktivitas,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

module.exports = {
  createLaporanHarianKebun,
  getLastHarianKebunByObjekBudidayaId,
  createLaporanHarianTernak,
  createLaporanSakit,
  createLaporanSakitTanpaDiagnosa,
  createLaporanKematian,
  createLaporanVitamin,
  createLaporanPanen,
  createLaporanPanenSimple,
  createLaporanPanenKebun,
  createLaporanHama,
  createLaporanPenggunaanInventaris,
  getLaporanHarianKebunById,
  getLaporanHarianTernakById,
  getLaporanSakitById,
  getLaporanKematianById,
  getLaporanVitaminById,
  getLaporanPanenById,
  getLaporanPanenKebunById,
  getLaporanHamaById,
  getLaporanPenggunaanInventarisById,
  getJumlahKematian,
  getHasilPanenWithGrades,
  getHasilPanenTernakWithGrades,
  getGradeSummaryByKomoditas,
  getAyamTidakBertelur,
  getAyamPenurunanProduktivitas,
};
