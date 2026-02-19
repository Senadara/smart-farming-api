const { QueryTypes, Op, fn, col, where } = require("sequelize");
const sequelize = require("../../model/index");
const { getPaginationOptions } = require("../../utils/paginationUtils");
const komoditas = require("../../model/farm/komoditas");
const model = require("../../model/index");
// const { required } = require("yargs");

const db = sequelize.sequelize;

// Models
const Laporan = sequelize.Laporan;
const User = sequelize.User;
const UnitBudidaya = sequelize.UnitBudidaya;
const HarianTernak = sequelize.HarianTernak;
const Sakit = sequelize.Sakit;
const Kematian = sequelize.Kematian;

const JenisBudidaya = sequelize.JenisBudidaya;
const ObjekBudidaya = sequelize.ObjekBudidaya;
const DetailPanen = sequelize.DetailPanen;
const HarianKebun = sequelize.HarianKebun;
const Vitamin = sequelize.Vitamin;
const Grade = sequelize.Grade;
const PanenRincianGrade = sequelize.PanenRincianGrade;
const PanenKebun = sequelize.PanenKebun;
const Panen = sequelize.Panen;
const Satuan = sequelize.Satuan;
// const JenisHama = sequelize.JenisHama;
// const Hama = sequelize.Hama;
// const KategoriInventaris = sequelize.KategoriInventaris;
const Inventaris = sequelize.Inventaris;
// const PenggunaanInventaris = sequelize.PenggunaanInventaris;
const Komoditas = sequelize.Komoditas;

// --- CONSTANTS ---
const MAX_PLANTS_TO_LIST_IN_SUMMARY = 3;

const REPORT_TYPES = {
  HARIAN: "harian",
  VITAMIN: "vitamin",
  SAKIT: "sakit",
  KEMATIAN: "kematian",
  PANEN_KEBUN: "panen",
  PANEN_TERNAK: "panen",
};

const GROUP_BY_OPTIONS = {
  DAY: "day",
  MONTH: "month",
  YEAR: "year",
};

const NUTRIENT_TYPES = {
  PUPUK: "pupuk",
  VITAMIN: "vitamin",
  VAKSIN: "vaksin",
  DISINFEKTAN: "disinfektan",
};

function getPlantListSummary(plantNameList) {
  const count = plantNameList.length;
  if (count === 0) return "";
  if (count > MAX_PLANTS_TO_LIST_IN_SUMMARY) {
    return `${plantNameList
      .slice(0, MAX_PLANTS_TO_LIST_IN_SUMMARY)
      .join(", ")}, dan ${count - MAX_PLANTS_TO_LIST_IN_SUMMARY} lainnya`;
  }
  return plantNameList.join(", ");
}

/**
 * Validates common request parameters for statistics and prepares date formatting.
 */
function validateAndGetDateColumnFormat(req, res) {
  const jenisBudidayaId = req.params.id;
  const { startDate, endDate, groupBy } = req.query;

  if (!jenisBudidayaId) {
    res
      .status(400)
      .json({ message: "Path parameter 'id' (jenisBudidayaId) is required." });
    return null;
  }
  if (!startDate || !endDate || !groupBy) {
    res.status(400).json({
      message: "startDate, endDate, and groupBy query parameters are required.",
    });
    return null;
  }

  let dateColumnFormat;
  switch (groupBy) {
    case GROUP_BY_OPTIONS.DAY:
      dateColumnFormat = fn("DATE", col("Laporan.createdAt"));
      break;
    case GROUP_BY_OPTIONS.MONTH:
      dateColumnFormat = fn(
        "DATE_FORMAT",
        col("Laporan.createdAt"),
        "%Y-%m-01"
      );
      break;
    case GROUP_BY_OPTIONS.YEAR:
      dateColumnFormat = fn(
        "DATE_FORMAT",
        col("Laporan.createdAt"),
        "%Y-01-01"
      );
      break;
    default:
      res.status(400).json({
        message: "Invalid groupBy value. Use 'day', 'month', or 'year'.",
      });
      return null;
  }
  return { jenisBudidayaId, startDate, endDate, dateColumnFormat, groupBy };
}

/**
 * Generic helper to fetch aggregated statistics.
 */
async function fetchAggregatedStats({
  req,
  res,
  countedModel, // The Sequelize model whose instances are being counted (e.g., HarianKebun, Vitamin, Laporan)
  countedModelAlias, // Alias for the count in the result (e.g., "jumlahPenyiraman")
  laporanTipe, // The Laporan.tipe associated with this statistic (e.g., REPORT_TYPES.HARIAN)
  countedModelWhere = {}, // Specific conditions for the countedModel (e.g., { penyiraman: true } or { tipe: 'pupuk' })
  successMessagePrefix,
}) {
  try {
    const validationResult = validateAndGetDateColumnFormat(req, res);
    if (!validationResult) return;

    const { jenisBudidayaId, startDate, endDate, dateColumnFormat } =
      validationResult;

    includeChainForLaporan = [
      {
        model: UnitBudidaya,
        attributes: [],
        required: true,
        where: { jenisBudidayaId, isDeleted: false },
      },
    ];

    let attributeToCount;
    if (countedModel && countedModel.name !== Laporan.name) {
      includeChainForLaporan.unshift({
        model: countedModel,
        attributes: [],
        where: { ...countedModelWhere, isDeleted: false },
        required: true,
      });
      attributeToCount = col(`${countedModel.name}.id`);
    } else {
      // Counting Laporan itself
      attributeToCount = col("Laporan.id");
    }

    const statistik = await Laporan.findAll({
      attributes: [
        [dateColumnFormat, "period"],
        [fn("COUNT", attributeToCount), countedModelAlias],
      ],
      include: includeChainForLaporan,
      where: {
        isDeleted: false,
        tipe: laporanTipe,
        ...(countedModel &&
          countedModel.name === Laporan.name &&
          Object.keys(countedModelWhere).length > 0 &&
          countedModelWhere),
        createdAt: {
          [Op.between]: [
            new Date(startDate + "T00:00:00.000Z"),
            new Date(endDate + "T23:59:59.999Z"),
          ],
        },
      },
      group: ["period"],
      order: [["period", "ASC"]],
      raw: true,
    });

    const formattedStatistik = statistik.map((item) => ({
      ...item,
      [countedModelAlias]: parseInt(item[countedModelAlias], 10) || 0,
    }));

    return res.status(200).json({
      message: `${successMessagePrefix} JenisBudidaya ID: ${jenisBudidayaId}`,
      data: formattedStatistik,
    });
  } catch (error) {
    console.error(
      `Error in fetchAggregatedStats for ${countedModelAlias}, JenisBudidaya ID ${req.params.id}:`,
      error
    );
    res.status(500).json({
      message: "Gagal mengambil statistik.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Generic helper to fetch paginated history.
 */
async function fetchPaginatedHistory({
  req,
  res,
  mainModel,
  baseWhereClause = { isDeleted: false },
  attributes, // Attributes for mainModel
  includeItems, // Array of include configurations
  dataFormatter,
  order,
  successMessage,
  page = parseInt(req.query.page, 10) || 1,
  limit = parseInt(req.query.limit, 10) || 5,
}) {
  const offset = (page - 1) * limit;
  const { jenisBudidayaId } = req.params;

  if (!jenisBudidayaId) {
    return res.status(400).json({
      status: false,
      message: "Path parameter 'jenisBudidayaId' is required.",
    });
  }

  try {
    let finalIncludes = [...(includeItems || [])];

    const { count, rows } = await mainModel.findAndCountAll({
      where: baseWhereClause,
      attributes,
      include: finalIncludes,
      order,
      limit,
      offset,
      distinct: true, // Important for counts with includes
    });

    const formattedRows = rows.map(dataFormatter);

    return res.status(200).json({
      status: true,
      message: successMessage,
      data: formattedRows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count,
    });
  } catch (error) {
    console.error(
      `Error in fetchPaginatedHistory for ${mainModel.name}:`,
      error
    );
    res.status(500).json({
      status: false,
      message: `Gagal mengambil riwayat ${mainModel.name.toLowerCase()}.`,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

// --- WORKS ---
const getStatistikLaporanHarian = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: Laporan,
    countedModelAlias: "jumlahLaporan",
    laporanTipe: REPORT_TYPES.HARIAN,
    successMessagePrefix: "Successfully retrieved daily report statistics for",
  });

const getStatistikPakan = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: HarianTernak,
    countedModelAlias: "jumlahPakan",
    laporanTipe: REPORT_TYPES.HARIAN,
    countedModelWhere: { pakan: true },
    successMessagePrefix:
      "Successfully retrieved animal feeding statistics for",
  });

const getStatistikCekKandang = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: HarianTernak,
    countedModelAlias: "jumlahCekKandang",
    laporanTipe: REPORT_TYPES.HARIAN,
    countedModelWhere: { cekKandang: true },
    successMessagePrefix:
      "Successfully retrieved animal shelter check statistics for",
  });

const getRiwayatPelaporanHarianTernak = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: HarianTernak,
    baseWhereClause: { isDeleted: false },
    attributes: ["id", "pakan", "cekKandang", "createdAt", "laporanId"],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
    ],
    dataFormatter: (harianTernak) => ({
      laporanId: harianTernak.Laporan ? harianTernak.Laporan.id : null,
      text: harianTernak.Laporan
        ? harianTernak.Laporan.judul
        : "Laporan Harian Ternak",
      gambar: harianTernak.Laporan ? harianTernak.Laporan.gambar : null,
      person:
        harianTernak.Laporan && harianTernak.Laporan.user
          ? harianTernak.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: harianTernak.Laporan
        ? harianTernak.Laporan.createdAt
        : harianTernak.createdAt,
      time: harianTernak.Laporan
        ? harianTernak.Laporan.createdAt
        : harianTernak.createdAt,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan harian ternak berhasil diambil.",
  });
};

const getRiwayatPelaporanHarianTanaman = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: HarianKebun,
    baseWhereClause: { isDeleted: false },
    attributes: [
      "id",
      "penyiraman",
      "pruning",
      "repotting",
      "tinggiTanaman",
      "kondisiDaun",
      "statusTumbuh",
      "createdAt",
      "laporanId",
    ],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
    ],
    dataFormatter: (harian) => ({
      laporanId: harian.Laporan ? harian.Laporan.id : null,
      text: harian.Laporan ? harian.Laporan.judul : "Laporan Harian Tanaman",
      gambar: harian.Laporan ? harian.Laporan.gambar : null,
      person:
        harian.Laporan && harian.Laporan.user
          ? harian.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: harian.Laporan ? harian.Laporan.createdAt : harian.createdAt,
      time: harian.Laporan ? harian.Laporan.createdAt : harian.createdAt,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan harian tanaman berhasil diambil.",
  });
};

const getStatistikSakit = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: Laporan,
    countedModelAlias: "jumlahSakit",
    laporanTipe: REPORT_TYPES.SAKIT,
    successMessagePrefix: "Successfully retrieved disease statistics for",
  });

const getStatistikPenyakit = async (req, res) => {
  const { jenisBudidayaId } = req.params;
  const { startDate, endDate } = req.query;

  if (!jenisBudidayaId) {
    return res
      .status(400)
      .json({ message: "Path parameter 'jenisBudidayaId' is required." });
  }

  const dateWhereClause = {};
  if (startDate && endDate) {
    dateWhereClause.createdAt = {
      [Op.between]: [
        new Date(startDate + "T00:00:00.000Z"),
        new Date(endDate + "T23:59:59.999Z"),
      ],
    };
  }

  try {
    const statistikPenyakit = await Sakit.findAll({
      attributes: [
        [fn("LOWER", col("Sakit.penyakit")), "penyakit"],
        [fn("COUNT", col("Sakit.id")), "jumlahKasus"],
      ],
      include: [
        {
          model: Laporan,
          attributes: [],
          required: true,
          where: {
            isDeleted: false,
            tipe: REPORT_TYPES.SAKIT,
            ...dateWhereClause,
          },
          include: [
            {
              model: UnitBudidaya,
              attributes: [],
              required: true,
              where: {
                jenisBudidayaId: jenisBudidayaId,
                isDeleted: false,
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
      },
      group: ["Sakit.penyakit"],
      order: [[fn("COUNT", col("Sakit.id")), "DESC"]],
      raw: true,
    });

    return res.status(200).json({
      status: true,
      message: "Statistik penyakit berhasil diambil.",
      data: statistikPenyakit,
    });
  } catch (error) {
    console.error(
      `Error fetching statistik penyakit for JenisBudidaya ID ${jenisBudidayaId}:`,
      error
    );
    res.status(500).json({
      status: false,
      message: "Gagal mengambil statistik penyakit.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getStatistikPenyebabKematian = async (req, res) => {
  const { jenisBudidayaId } = req.params;
  const { startDate, endDate } = req.query;

  if (!jenisBudidayaId) {
    return res
      .status(400)
      .json({ message: "Path parameter 'jenisBudidayaId' is required." });
  }

  const dateWhereClause = {};
  if (startDate && endDate) {
    dateWhereClause.tanggal = {
      [Op.between]: [
        new Date(startDate + "T00:00:00.000Z"),
        new Date(endDate + "T23:59:59.999Z"),
      ],
    };
  }

  try {
    const statistikPenyebabKematian = await Kematian.findAll({
      attributes: [
        [fn("LOWER", col("Kematian.penyebab")), "penyebab"],
        [fn("COUNT", col("Kematian.id")), "jumlahKematian"],
      ],
      include: [
        {
          model: Laporan,
          attributes: [],
          required: true,
          where: {
            isDeleted: false,
            tipe: REPORT_TYPES.KEMATIAN,
          },
          include: [
            {
              model: UnitBudidaya,
              attributes: [],
              required: true,
              where: {
                jenisBudidayaId: jenisBudidayaId,
                isDeleted: false,
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
        ...dateWhereClause,
      },
      group: [fn("LOWER", col("Kematian.penyebab"))],
      order: [[fn("COUNT", col("Kematian.id")), "DESC"]],
      raw: true,
    });

    return res.status(200).json({
      status: true,
      message: "Statistik penyebab kematian berhasil diambil.",
      data: statistikPenyebabKematian,
    });
  } catch (error) {
    console.error(
      `Error fetching statistik penyebab kematian for JenisBudidaya ID ${jenisBudidayaId}:`,
      error
    );
    res.status(500).json({
      status: false,
      message: "Gagal mengambil statistik penyebab kematian.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRiwayatPelaporanSakitPerJenisBudidaya = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: Sakit,
    baseWhereClause: { isDeleted: false },
    attributes: ["id", "penyakit", "createdAt", "laporanId"],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
    ],
    dataFormatter: (sakit) => ({
      laporanId: sakit.Laporan ? sakit.Laporan.id : null,
      text: sakit.Laporan ? sakit.Laporan.judul : "Laporan Sakit Ternak",
      gambar: sakit.Laporan ? sakit.Laporan.gambar : null,
      person:
        sakit.Laporan && sakit.Laporan.user
          ? sakit.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: sakit.Laporan ? sakit.Laporan.createdAt : sakit.createdAt,
      time: sakit.Laporan ? sakit.Laporan.createdAt : sakit.createdAt,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan sakit berhasil diambil.",
  });
};

const getStatistikKematian = async (req, res) => {
  const { id: jenisBudidayaId } = req.params;
  const { startDate, endDate, groupBy } = req.query;

  if (!jenisBudidayaId || !startDate || !endDate || !groupBy) {
    return res.status(400).json({
      message:
        "Path parameter 'id', dan query 'startDate', 'endDate', 'groupBy' dibutuhkan.",
    });
  }

  let dateColumnFormat;
  switch (groupBy) {
    case GROUP_BY_OPTIONS.DAY:
      dateColumnFormat = fn("DATE", col("Kematian.tanggal"));
      break;
    case GROUP_BY_OPTIONS.MONTH:
      dateColumnFormat = fn("DATE_FORMAT", col("Kematian.tanggal"), "%Y-%m-01");
      break;
    case GROUP_BY_OPTIONS.YEAR:
      dateColumnFormat = fn("DATE_FORMAT", col("Kematian.tanggal"), "%Y-01-01");
      break;
    default:
      return res.status(400).json({
        message:
          "Nilai groupBy tidak valid. Gunakan 'day', 'month', atau 'year'.",
      });
  }

  try {
    const statistik = await Kematian.findAll({
      attributes: [
        [dateColumnFormat, "period"],
        [fn("COUNT", col("Kematian.id")), "jumlahKematian"],
      ],
      include: [
        {
          model: Laporan,
          attributes: [],
          required: true,
          where: { tipe: REPORT_TYPES.KEMATIAN, isDeleted: false },
          include: [
            {
              model: ObjekBudidaya,
              attributes: [],
              required: true,
              include: [
                {
                  model: UnitBudidaya,
                  attributes: [],
                  required: true,
                  where: { jenisBudidayaId, isDeleted: false },
                },
              ],
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
        tanggal: {
          [Op.between]: [
            new Date(startDate + "T00:00:00.000Z"),
            new Date(endDate + "T23:59:59.999Z"),
          ],
        },
      },
      group: ["period"],
      order: [["period", "ASC"]],
      raw: true,
    });

    const formattedStatistik = statistik.map((item) => ({
      ...item,
      jumlahKematian: parseInt(item.jumlahKematian, 10) || 0,
    }));

    return res.status(200).json({
      status: true,
      message: "Statistik kematian berhasil diambil.",
      data: formattedStatistik,
    });
  } catch (error) {
    console.error(`Error fetching statistik kematian:`, error);
    res.status(500).json({
      status: false,
      message: "Gagal mengambil statistik kematian.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRiwayatPelaporanKematianPerJenisBudidaya = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: Kematian,
    baseWhereClause: { isDeleted: false },
    attributes: ["id", "penyebab", "tanggal", "laporanId"],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
    ],
    dataFormatter: (kematian) => ({
      laporanId: kematian.Laporan ? kematian.Laporan.id : null,
      text: kematian.Laporan
        ? kematian.Laporan.judul
        : "Laporan Kematian Ternak",
      gambar: kematian.Laporan ? kematian.Laporan.gambar : null,
      person:
        kematian.Laporan && kematian.Laporan.user
          ? kematian.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: kematian.tanggal ? kematian.tanggal : kematian.Laporan?.createdAt,
      time: kematian.tanggal ? kematian.tanggal : kematian.Laporan?.createdAt,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan kematian berhasil diambil.",
  });
};

const getStatistikPemberianNutrisi = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: Vitamin,
    countedModelAlias: "jumlahKejadianPemberianPupuk",
    laporanTipe: REPORT_TYPES.VITAMIN,
    countedModelWhere: { tipe: NUTRIENT_TYPES.PUPUK },
    successMessagePrefix:
      "Successfully retrieved nutrient (fertilizer) application statistics for",
  });

const getRiwayatPemberianNutrisiPerJenisBudidaya = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const tipeNutrisiFilter = req.query.tipeNutrisi;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 3;

  const whereDetailPemberian = { isDeleted: false };
  if (tipeNutrisiFilter) {
    whereDetailPemberian.tipe = { [Op.in]: tipeNutrisiFilter.split(",") };
  }

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: Vitamin, // Main model adalah Vitamin
    baseWhereClause: whereDetailPemberian,
    attributes: [
      "id",
      "jumlah",
      "tipe",
      "createdAt",
      "laporanId",
      "inventarisId",
    ],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
      {
        model: Inventaris,
        as: "inventaris",
        attributes: ["nama", "gambar"],
        required: true, // Atau false jika bisa null
        where: { isDeleted: false },
        include: [
          { model: Satuan, attributes: ["lambang", "nama"], required: false },
        ],
      },
    ],
    dataFormatter: (dp) => ({
      laporanId: dp.Laporan ? dp.Laporan.id : null,
      name: `${dp.inventaris ? dp.inventaris.nama : "Item Tidak Dikenal"} - ${
        dp.jumlah || ""
      } ${
        dp.inventaris && dp.inventaris.Satuan
          ? dp.inventaris.Satuan.lambang
          : ""
      }`.trim(),
      category: dp.tipe
        ? dp.tipe.charAt(0).toUpperCase() + dp.tipe.slice(1)
        : "Nutrisi",
      gambar: dp.Laporan
        ? dp.Laporan.gambar
        : dp.inventaris
        ? dp.inventaris.gambar
        : null,
      person:
        dp.Laporan && dp.Laporan.user
          ? dp.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: dp.Laporan ? dp.Laporan.createdAt : dp.createdAt,
      time: dp.Laporan ? dp.Laporan.createdAt : dp.createdAt,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pemberian nutrisi berhasil diambil.",
  });
};

const getStatistikDisinfektan = (req, res) => {
  fetchAggregatedStats({
    req,
    res,
    countedModel: Vitamin,
    countedModelAlias: "jumlahPemberianDisinfektan",
    laporanTipe: REPORT_TYPES.VITAMIN,
    countedModelWhere: {
      tipe: { [Op.in]: [NUTRIENT_TYPES.DISINFEKTAN] },
    },
    successMessagePrefix:
      "Successfully retrieved disinfektan application statistics for",
  });
};

const getStatistikVitamin = (req, res) => {
  fetchAggregatedStats({
    req,
    res,
    countedModel: Vitamin,
    countedModelAlias: "jumlahPemberianVitamin",
    laporanTipe: REPORT_TYPES.VITAMIN,
    countedModelWhere: {
      tipe: { [Op.in]: [NUTRIENT_TYPES.VITAMIN] },
    },
    successMessagePrefix:
      "Successfully retrieved vitamin application statistics for",
  });
};

const getStatistikVaksin = (req, res) => {
  fetchAggregatedStats({
    req,
    res,
    countedModel: Vitamin,
    countedModelAlias: "jumlahPemberianVaksin",
    laporanTipe: REPORT_TYPES.VITAMIN,
    countedModelWhere: {
      tipe: { [Op.in]: [NUTRIENT_TYPES.VAKSIN] },
    },
    successMessagePrefix:
      "Successfully retrieved vaksin application statistics for",
  });
};

const getStatistikHarianJenisBudidaya = async (req, res) => {
  try {
    const jenisBudidayaId = req.params.id;

    const jenisBudidaya = await JenisBudidaya.findOne({
      where: { id: jenisBudidayaId, isDeleted: false },
    });

    if (!jenisBudidaya) {
      return res
        .status(404)
        .json({ message: "Jenis Budidaya tidak ditemukan." });
    }

    const unitBudidayaList = await UnitBudidaya.findAll({
      where: { jenisBudidayaId: jenisBudidayaId, isDeleted: false },
      include: [
        { model: ObjekBudidaya, where: { isDeleted: false }, required: false },
      ],
    });

    if (!unitBudidayaList || unitBudidayaList.length === 0) {
      return res.status(404).json({
        message:
          "Tidak ada Unit Budidaya yang ditemukan untuk Jenis Budidaya ini.",
        data: {
          totalTanaman: 0,
          tanamanSehat: 0,
          perluPerhatian: 0,
          kritis: 0,
          persentaseSehat: 0,
          persentasePerluPerhatian: 0,
          persentaseKritis: 0,
          rekomendasi: "Tidak ada unit budidaya terdaftar.",
          detailTanaman: [],
          grafikTinggiTanaman: {
            labels: [],
            datasets: [{ label: "Tinggi Tanaman", data: [] }],
          },
          grafikKesehatan: {
            labels: ["Sehat", "Perlu Perhatian", "Kritis"],
            datasets: [{ data: [0, 0, 0] }],
          },
        },
      });
    }

    const semuaObjekBudidayaInstances = unitBudidayaList.reduce((acc, unit) => {
      if (unit.ObjekBudidayas && unit.ObjekBudidayas.length > 0) {
        acc.push(...unit.ObjekBudidayas);
      }
      return acc;
    }, []);

    const semuaObjekBudidayaIds = semuaObjekBudidayaInstances.map(
      (obj) => obj.id
    );
    const totalTanaman = semuaObjekBudidayaInstances.length;

    if (totalTanaman === 0) {
      return res.status(200).json({
        message:
          "Tidak ada tanaman (objek budidaya) yang terdaftar untuk dianalisis.",
        data: {
          totalTanaman: 0,
          tanamanSehat: 0,
          perluPerhatian: 0,
          kritis: 0,
          persentaseSehat: 0,
          persentasePerluPerhatian: 0,
          persentaseKritis: 0,
          rekomendasi: "Tidak ada objek budidaya terdaftar.",
          detailTanaman: [],
          grafikTinggiTanaman: {
            labels: [],
            datasets: [{ label: "Tinggi Tanaman", data: [] }],
          },
          grafikKesehatan: {
            labels: ["Sehat", "Perlu Perhatian", "Kritis"],
            datasets: [{ data: [0, 0, 0] }],
          },
        },
      });
    }

    // Gunakan Sequelize ORM dengan nama field yang benar: ObjekBudidayaId
    const laporanDenganDetailHarian = await Laporan.findAll({
      attributes: [
        ["id", "laporanId"],
        "ObjekBudidayaId", // Nama field yang benar di database
        "createdAt",
      ],
      include: [
        {
          model: HarianKebun,
          attributes: [
            "kondisiDaun",
            "tinggiTanaman",
            "statusTumbuh",
            "penyiraman",
            "pruning",
            "repotting",
          ],
          required: true,
          where: { isDeleted: false },
        },
      ],
      where: {
        ObjekBudidayaId: { [Op.in]: semuaObjekBudidayaIds }, // Nama field yang benar
        isDeleted: false,
        tipe: "harian",
      },
      order: [
        ["ObjekBudidayaId", "ASC"], // Nama field yang benar
        ["createdAt", "DESC"],
      ],
      raw: false, // Gunakan ORM objects
    });

    const latestStatusDataMap = new Map();
    const reportCountMap = new Map();

    for (const laporanInstance of laporanDenganDetailHarian) {
      // Dengan Sequelize ORM dan nama field yang benar
      const objekId = laporanInstance.ObjekBudidayaId;
      const harianKebunData = laporanInstance.HarianKebun;

      if (!objekId || !harianKebunData) {
        continue;
      }

      reportCountMap.set(objekId, (reportCountMap.get(objekId) || 0) + 1);

      if (!latestStatusDataMap.has(objekId)) {
        // Karena sudah diurutkan DESC by createdAt, data pertama adalah yang terbaru
        const detailHarian = {
          kondisiDaun: harianKebunData.kondisiDaun,
          tinggiTanaman: harianKebunData.tinggiTanaman,
          statusTumbuh: harianKebunData.statusTumbuh,
          penyiraman: harianKebunData.penyiraman,
          pruning: harianKebunData.pruning,
          repotting: harianKebunData.repotting,
        };

        latestStatusDataMap.set(objekId, detailHarian);
      }
    }

    let tanamanSehat = 0;
    let perluPerhatian = 0;
    let kritis = 0;
    const detailTanamanList = [];
    const tanamanKritisList = [];
    const tanamanPerluPerhatianDenganDataList = [];
    const tanamanPerluPerhatianTanpaDataList = [];
    const grafikTinggiData = {
      labels: [],
      datasets: [
        {
          label: "Tinggi Tanaman (cm)",
          data: [],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
        },
      ],
    };

    for (const objekInstance of semuaObjekBudidayaInstances) {
      const objekId = objekInstance.id;
      const namaTanaman = objekInstance.namaId || "Nama Tidak Diketahui";
      const harianKebunUntukStatus = latestStatusDataMap.get(objekId);
      const jumlahLaporan = reportCountMap.get(objekId) || 0;

      let skorMasalah = jumlahLaporan; // Default score, can be adjusted
      let kondisiDaunDisplay = "Tidak Ada Data";
      let statusKlasifikasi = "Tidak Ada Data";
      let alasanStatusKlasifikasi = "";
      let tinggiTanamanDisplay = null;

      if (harianKebunUntukStatus) {
        const {
          kondisiDaun,
          tinggiTanaman,
          statusTumbuh,
          penyiraman,
          pruning,
          repotting,
        } = harianKebunUntukStatus;

        tinggiTanamanDisplay = tinggiTanaman;
        if (tinggiTanaman !== null && tinggiTanaman !== undefined) {
          grafikTinggiData.labels.push(namaTanaman);
          grafikTinggiData.datasets[0].data.push(parseFloat(tinggiTanaman));
        }

        kondisiDaunDisplay = kondisiDaun || "Tidak Diketahui";
        let alasanDetailParts = [];
        let tempSkorKondisi; // 0: Sehat, 1-2: Perlu Perhatian, 3: Kritis

        // Normalize kondisi daun - trim whitespace and convert to lowercase
        const normalizedKondisiDaun = kondisiDaun
          ? kondisiDaun.trim().toLowerCase()
          : "";

        // Klasifikasi berdasarkan kondisi daun
        if (normalizedKondisiDaun === "sehat") {
          tempSkorKondisi = 0;
          alasanDetailParts.push(`Kondisi daun: '${kondisiDaun}'`);
        } else if (
          ["kering", "layu", "keriting", "rusak"].includes(
            normalizedKondisiDaun
          )
        ) {
          tempSkorKondisi = 3; // Kritis
          alasanDetailParts.push(`Kondisi daun: '${kondisiDaun}'`);
          if (
            (String(pruning) === "1" || pruning === true) &&
            normalizedKondisiDaun === "rusak"
          ) {
            alasanDetailParts.push("(kemungkinan akibat aktivitas pruning)");
          }
        } else if (["kuning", "bercak"].includes(normalizedKondisiDaun)) {
          tempSkorKondisi = 2; // Perlu Perhatian
          alasanDetailParts.push(`Kondisi daun: '${kondisiDaun}'`);
        } else {
          // Kondisi daun lain atau tidak terdefinisi spesifik
          tempSkorKondisi = 1; // Default ke Perlu Perhatian jika ada data tapi tidak 'sehat'
          alasanDetailParts.push(
            `Kondisi daun: '${kondisiDaunDisplay}' (memerlukan observasi lebih lanjut)`
          );
        }

        if (typeof tinggiTanaman !== "undefined" && tinggiTanaman !== null) {
          alasanDetailParts.push(`Tinggi tanaman: ${tinggiTanaman} cm`);
        }
        if (
          statusTumbuh &&
          typeof statusTumbuh === "string" &&
          statusTumbuh.trim() !== ""
        ) {
          alasanDetailParts.push(`Status tumbuh: '${statusTumbuh}'`);
        }

        let kegiatanList = [];
        if (String(penyiraman) === "1" || penyiraman === true)
          kegiatanList.push("penyiraman");
        if (String(pruning) === "1" || pruning === true)
          kegiatanList.push("pruning");
        if (String(repotting) === "1" || repotting === true)
          kegiatanList.push("repotting");

        if (kegiatanList.length > 0) {
          alasanDetailParts.push(
            `Kegiatan tercatat: ${kegiatanList.join(", ")}`
          );
        } else {
          alasanDetailParts.push(
            "Tidak ada kegiatan spesifik (penyiraman/pruning/repotting) tercatat."
          );
        }

        alasanStatusKlasifikasi = alasanDetailParts
          .join(". ")
          .replace(/\.\.+/g, ".")
          .trim();
        if (alasanStatusKlasifikasi && !alasanStatusKlasifikasi.endsWith("."))
          alasanStatusKlasifikasi += ".";

        if (tempSkorKondisi === 0) {
          statusKlasifikasi = "Sehat";
          tanamanSehat++;
        } else if (tempSkorKondisi >= 1 && tempSkorKondisi <= 2) {
          statusKlasifikasi = "Perlu Perhatian";
          perluPerhatian++;
          tanamanPerluPerhatianDenganDataList.push(namaTanaman);
        } else {
          // tempSkorKondisi >= 3
          statusKlasifikasi = "Kritis";
          kritis++;
          tanamanKritisList.push(namaTanaman);
        }
      } else {
        // Tidak ada data HarianKebun terbaru
        kondisiDaunDisplay = "Tidak Ada Data";
        statusKlasifikasi = "Perlu Perhatian"; // Default jika tidak ada laporan
        perluPerhatian++;
        alasanStatusKlasifikasi =
          "Tidak ada data laporan harian terbaru untuk evaluasi.";
        tanamanPerluPerhatianTanpaDataList.push(namaTanaman);
        skorMasalah = jumlahLaporan === 0 ? 1 : jumlahLaporan; // Minimal skor 1 jika tak ada laporan
      }

      detailTanamanList.push({
        id: objekId,
        namaId: namaTanaman,
        skorMasalah,
        kondisiDaun: kondisiDaunDisplay,
        statusKlasifikasi,
        alasanStatusKlasifikasi,
        tinggiTanaman: tinggiTanamanDisplay,
      });
    }

    const persentaseSehat =
      totalTanaman > 0 ? (tanamanSehat / totalTanaman) * 100 : 0;
    const persentasePerluPerhatian =
      totalTanaman > 0 ? (perluPerhatian / totalTanaman) * 100 : 0;
    const persentaseKritis =
      totalTanaman > 0 ? (kritis / totalTanaman) * 100 : 0;

    let rekomendasi = "Semua tanaman dalam kondisi baik.";
    let criticalMessage = "";
    let attentionMessage = "";

    if (kritis > 0) {
      criticalMessage = `Ada ${kritis} tanaman dalam kondisi kritis: ${getPlantListSummary(
        tanamanKritisList
      )}. Segera periksa dan tangani.`;
    }
    if (perluPerhatian > 0) {
      let perluPerhatianDetailsCombined = [];
      if (tanamanPerluPerhatianDenganDataList.length > 0) {
        perluPerhatianDetailsCombined.push(
          `${
            tanamanPerluPerhatianDenganDataList.length
          } tanaman berdasarkan laporan terakhir (${getPlantListSummary(
            tanamanPerluPerhatianDenganDataList
          )})`
        );
      }
      if (tanamanPerluPerhatianTanpaDataList.length > 0) {
        perluPerhatianDetailsCombined.push(
          `${
            tanamanPerluPerhatianTanpaDataList.length
          } tanaman karena tidak ada data laporan terbaru (${getPlantListSummary(
            tanamanPerluPerhatianTanpaDataList
          )})`
        );
      }
      if (perluPerhatianDetailsCombined.length > 0) {
        const detailText = perluPerhatianDetailsCombined.join("; dan ");
        attentionMessage = `Selain itu, ${perluPerhatian} tanaman juga memerlukan perhatian (${detailText}).`;
      }
    }

    if (criticalMessage && attentionMessage)
      rekomendasi = `${criticalMessage} ${attentionMessage}`;
    else if (criticalMessage) rekomendasi = criticalMessage;
    else if (attentionMessage)
      rekomendasi = attentionMessage.replace("Selain itu, ", "Terdapat ");
    // Jika hanya attention
    else if (tanamanSehat === totalTanaman && totalTanaman > 0)
      rekomendasi = "Semua tanaman dalam kondisi baik.";
    else if (totalTanaman === 0)
      rekomendasi = "Tidak ada tanaman untuk dievaluasi.";

    return res.status(200).json({
      message: "Statistik harian berhasil diambil.",
      data: {
        totalTanaman,
        tanamanSehat,
        perluPerhatian,
        kritis,
        persentaseSehat: parseFloat(persentaseSehat.toFixed(2)),
        persentasePerluPerhatian: parseFloat(
          persentasePerluPerhatian.toFixed(2)
        ),
        persentaseKritis: parseFloat(persentaseKritis.toFixed(2)),
        rekomendasi,
        detailTanaman: detailTanamanList.sort(
          (a, b) => b.skorMasalah - a.skorMasalah
        ), // Sort by problem score
        grafikTinggiTanaman: grafikTinggiData,
        grafikKesehatan: {
          labels: ["Sehat", "Perlu Perhatian", "Kritis"],
          datasets: [
            {
              data: [tanamanSehat, perluPerhatian, kritis],
              backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error("Error fetching statistik harian:", error);
    res.status(500).json({
      message: "Gagal mengambil statistik harian.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getStatistikPenyiraman = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: HarianKebun,
    countedModelAlias: "jumlahPenyiraman",
    laporanTipe: REPORT_TYPES.HARIAN,
    countedModelWhere: { penyiraman: true },
    successMessagePrefix:
      "Successfully retrieved plant watering statistics for",
  });

const getStatistikPruning = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: HarianKebun,
    countedModelAlias: "jumlahPruning",
    laporanTipe: REPORT_TYPES.HARIAN,
    countedModelWhere: { pruning: true },
    successMessagePrefix: "Successfully retrieved plant pruning statistics for",
  });

const getStatistikRepotting = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: HarianKebun,
    countedModelAlias: "jumlahRepotting",
    laporanTipe: REPORT_TYPES.HARIAN,
    countedModelWhere: { repotting: true },
    successMessagePrefix:
      "Successfully retrieved plant repotting statistics for",
  });

const getStatistikPanenTernak = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: Laporan,
    countedModelAlias: "jumlahLaporanPanenTernak",
    laporanTipe: REPORT_TYPES.PANEN_TERNAK,
    successMessagePrefix:
      "Successfully retrieved animal harvest report statistics for",
  });

const getStatistikPanenTanaman = (req, res) =>
  fetchAggregatedStats({
    req,
    res,
    countedModel: Laporan,
    countedModelAlias: "jumlahLaporanPanenTanaman",
    laporanTipe: REPORT_TYPES.PANEN_KEBUN,
    successMessagePrefix:
      "Successfully retrieved plant harvest report statistics for",
  });

const getStatistikJumlahPanenTernak = async (req, res) => {
  const { jenisBudidayaId } = req.params;
  const { startDate, endDate } = req.query;

  if (!jenisBudidayaId) {
    return res
      .status(400)
      .json({ message: "Path parameter 'jenisBudidayaId' is required." });
  }

  const dateWhereClause = {};
  if (startDate && endDate) {
    dateWhereClause.createdAt = {
      [Op.between]: [
        new Date(startDate + "T00:00:00.000Z"),
        new Date(endDate + "T23:59:59.999Z"),
      ],
    };
  }

  try {
    const statistikPanen = await Panen.findAll({
      attributes: [
        [col("komoditas.nama"), "namaKomoditas"],
        [col("komoditas->Satuan.lambang"), "lambangSatuan"],
        [fn("SUM", col("Panen.jumlah")), "totalPanen"],
      ],
      include: [
        {
          model: Komoditas,
          as: "komoditas",
          attributes: [],
          required: true,
          include: [{ model: Satuan, attributes: [], required: false }],
        },
        {
          model: Laporan,
          attributes: [],
          required: true,
          where: {
            isDeleted: false,
            tipe: REPORT_TYPES.PANEN_TERNAK,
            ...dateWhereClause,
          },
          include: [
            {
              model: UnitBudidaya,
              attributes: [],
              required: true,
              where: {
                jenisBudidayaId: jenisBudidayaId,
                isDeleted: false,
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
      },
      group: ["komoditas.id"],
      raw: true,
    });

    const formattedStatistik = statistikPanen.map((item) => ({
      ...item,
      totalPanen: parseFloat(item.totalPanen) || 0,
    }));

    return res.status(200).json({
      status: true,
      message: `Statistik jumlah panen untuk JenisBudidaya ID: ${jenisBudidayaId} berhasil diambil.`,
      data: formattedStatistik,
    });
  } catch (error) {
    console.error(
      `Error fetching statistik panen for JenisBudidaya ID ${jenisBudidayaId}:`,
      error
    );
    res.status(500).json({
      status: false,
      message: "Gagal mengambil statistik jumlah panen.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getStatistikJumlahPanenTanaman = async (req, res) => {
  const { jenisBudidayaId } = req.params;
  const { startDate, endDate } = req.query;

  if (!jenisBudidayaId) {
    return res
      .status(400)
      .json({ message: "Path parameter 'jenisBudidayaId' is required." });
  }

  const dateWhereClause = {};
  if (startDate && endDate) {
    dateWhereClause.createdAt = {
      [Op.between]: [
        new Date(startDate + "T00:00:00.000Z"),
        new Date(endDate + "T23:59:59.999Z"),
      ],
    };
  }

  try {
    const statistikPanen = await PanenKebun.findAll({
      attributes: [
        [col("komoditas.nama"), "namaKomoditas"],
        [col("komoditas->Satuan.lambang"), "lambangSatuan"],
        [fn("SUM", col("PanenKebun.realisasiPanen")), "totalPanen"],
      ],
      include: [
        {
          model: Komoditas,
          as: "komoditas",
          attributes: [],
          required: true,
          include: [{ model: Satuan, attributes: [], required: false }],
        },
        {
          model: Laporan,
          attributes: [],
          required: true,
          where: {
            isDeleted: false,
            tipe: REPORT_TYPES.PANEN_KEBUN,
            ...dateWhereClause,
          },
          include: [
            {
              model: UnitBudidaya,
              attributes: [],
              required: true,
              where: {
                jenisBudidayaId: jenisBudidayaId,
                isDeleted: false,
              },
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
      },
      group: ["komoditas.id"],
      raw: true,
    });

    const formattedStatistik = statistikPanen.map((item) => ({
      ...item,
      totalPanen: parseFloat(item.totalPanen) || 0,
    }));

    return res.status(200).json({
      status: true,
      message: `Statistik jumlah panen untuk JenisBudidaya ID: ${jenisBudidayaId} berhasil diambil.`,
      data: formattedStatistik,
    });
  } catch (error) {
    console.error(
      `Error fetching statistik panen for JenisBudidaya ID ${jenisBudidayaId}:`,
      error
    );
    res.status(500).json({
      status: false,
      message: "Gagal mengambil statistik jumlah panen.",
      detail:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getRiwayatPelaporanPanenTernak = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: Panen,
    baseWhereClause: { isDeleted: false },
    attributes: ["id", "jumlah"],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
      {
        model: Komoditas,
        as: "komoditas",
        attributes: ["id", "nama"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: Satuan, attributes: ["lambang", "nama"], required: false },
        ],
      },
    ],
    dataFormatter: (panen) => ({
      laporanId: panen.Laporan ? panen.Laporan.id : null,
      text: panen.Laporan ? panen.Laporan.judul : "Laporan panen Ternak",
      komoditas: panen.komoditas
        ? `${panen.komoditas.nama} - ${panen.jumlah || ""} ${
            panen.komoditas.Satuan ? panen.komoditas.Satuan.lambang : ""
          }`.trim()
        : "Komoditas Tidak Diketahui",
      gambar: panen.Laporan ? panen.Laporan.gambar : null,
      person:
        panen.Laporan && panen.Laporan.user
          ? panen.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: panen.Laporan ? panen.Laporan.createdAt : panen.tanggal,
      time: panen.Laporan ? panen.Laporan.createdAt : panen.tanggal,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan panen berhasil diambil.",
  });
};

const getRiwayatPelaporanPanenTanaman = (req, res) => {
  const { jenisBudidayaId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;

  return fetchPaginatedHistory({
    req,
    res,
    page,
    limit,
    mainModel: PanenKebun,
    baseWhereClause: { isDeleted: false },
    attributes: ["id", "realisasiPanen"],
    includeItems: [
      {
        model: Laporan,
        attributes: ["id", "judul", "gambar", "createdAt", "objekBudidayaId"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: User, as: "user", attributes: ["name"], required: false },
          {
            model: UnitBudidaya,
            attributes: [],
            required: true,
            where: { jenisBudidayaId, isDeleted: false },
          },
        ],
      },
      {
        model: Komoditas,
        as: "komoditas",
        attributes: ["id", "nama"],
        required: true,
        where: { isDeleted: false },
        include: [
          { model: Satuan, attributes: ["lambang", "nama"], required: false },
        ],
      },
    ],
    dataFormatter: (panen) => ({
      laporanId: panen.Laporan ? panen.Laporan.id : null,
      text: panen.Laporan ? panen.Laporan.judul : "Laporan panen Tanaman",
      komoditas: panen.komoditas
        ? `${panen.komoditas.nama} - ${panen.jumlah || ""} ${
            panen.komoditas.Satuan ? panen.komoditas.Satuan.lambang : ""
          }`.trim()
        : "Komoditas Tidak Diketahui",
      gambar: panen.Laporan ? panen.Laporan.gambar : null,
      person:
        panen.Laporan && panen.Laporan.user
          ? panen.Laporan.user.name
          : "Petugas Tidak Diketahui",
      date: panen.Laporan ? panen.Laporan.createdAt : panen.tanggal,
      time: panen.Laporan ? panen.Laporan.createdAt : panen.tanggal,
    }),
    order: [[{ model: Laporan, as: "Laporan" }, "createdAt", "DESC"]],
    successMessage: "Riwayat pelaporan panen berhasil diambil.",
  });
};

/**
 * Get harvest statistics with grade breakdown by jenis budidaya for charts
 */
const getStatistikPanenGradeByJenisBudidaya = async (req, res) => {
  try {
    const { id: jenisBudidayaId } = req.params;
    const { startDate, endDate } = req.query;

    if (!jenisBudidayaId) {
      return res.status(400).json({
        status: false,
        message: "Jenis budidaya ID diperlukan",
      });
    }

    // Validate that jenis budidaya exists
    const jenisBudidaya = await JenisBudidaya.findOne({
      where: { id: jenisBudidayaId, isDeleted: false },
    });

    if (!jenisBudidaya) {
      return res.status(404).json({
        status: false,
        message: "Jenis budidaya tidak ditemukan",
      });
    }

    // Build where clause for date filtering on Laporan
    const laporanWhereClause = {
      isDeleted: false,
      tipe: "panen",
    };

    // Apply date filters if provided
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

        laporanWhereClause.createdAt = {
          [Op.between]: [start, end],
        };
      } catch (error) {
        return res.status(400).json({
          status: false,
          message: "Error parsing dates. Please use YYYY-MM-DD format",
        });
      }
    }

    // Get all harvest records for the jenis budidaya using Sequelize ORM
    const laporanPanen = await Laporan.findAll({
      where: laporanWhereClause,
      include: [
        {
          model: UnitBudidaya,
          where: { jenisBudidayaId, isDeleted: false },
          required: true,
        },
        {
          model: PanenKebun,
          required: true,
          where: { isDeleted: false },
          include: [
            {
              model: Komoditas,
              as: "komoditas",
              attributes: ["id", "nama"],
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
              where: { isDeleted: false },
            },
          ],
        },
      ],
    });

    if (laporanPanen.length === 0) {
      return res.status(200).json({
        status: true,
        message: "Data statistik panen grade berhasil diambil",
        data: {
          chartData: [],
          summary: {
            totalHarvest: 0,
            totalGradeTypes: 0,
            totalCommodityTypes: 0,
            gradeLabels: [],
            commodityLabels: [],
          },
          rawData: [],
        },
      });
    }

    // Aggregate grade data
    const gradeAggregation = {};
    const commoditySet = new Set();
    let totalHarvestAmount = 0;
    let totalHarvestCount = 0;

    laporanPanen.forEach((laporan) => {
      const panenKebun = laporan.PanenKebun;
      // Convert to double and handle null/undefined values
      const realisasiPanen = parseFloat(panenKebun.realisasiPanen) || 0.0;
      totalHarvestAmount += realisasiPanen;
      totalHarvestCount++;

      // Add commodity to set
      if (panenKebun.komoditas) {
        commoditySet.add(panenKebun.komoditas.nama);
      }

      // Process grade data
      panenKebun.PanenRincianGrades.forEach((rincian) => {
        const gradeId = rincian.Grade.id;
        const gradeName = rincian.Grade.nama;
        const gradeDesc = rincian.Grade.deskripsi;
        // Convert to double and handle null/undefined values
        const amount = parseFloat(rincian.jumlah) || 0.0;

        if (!gradeAggregation[gradeId]) {
          gradeAggregation[gradeId] = {
            gradeId: gradeId,
            gradeNama: gradeName,
            gradeDeskripsi: gradeDesc,
            totalJumlah: 0.0,
            harvestCount: 0,
            commodity: panenKebun.komoditas?.nama || "",
            unit: panenKebun.komoditas?.Satuan?.lambang || "",
          };
        }

        gradeAggregation[gradeId].totalJumlah += amount;
        gradeAggregation[gradeId].harvestCount++;
      });
    });

    // Convert aggregation to chart data format with proper double handling
    const chartData = Object.values(gradeAggregation).map((grade) => ({
      label: grade.gradeNama,
      value: parseFloat(grade.totalJumlah.toFixed(2)), // Ensure 2 decimal precision
      commodity: grade.commodity,
      unit: grade.unit,
    }));

    // Sort by total amount descending
    chartData.sort((a, b) => b.value - a.value);

    // Generate summary data with proper number formatting
    const gradeLabels = chartData.map((item) => item.label);
    const commodityLabels = Array.from(commoditySet);
    const totalGradeTypes = gradeLabels.length;
    const totalCommodityTypes = commodityLabels.length;

    // Format rawData with proper double precision
    const formattedRawData = Object.values(gradeAggregation).map((grade) => ({
      ...grade,
      totalJumlah: parseFloat(grade.totalJumlah.toFixed(2)),
      averagePerHarvest:
        grade.harvestCount > 0
          ? parseFloat((grade.totalJumlah / grade.harvestCount).toFixed(2))
          : 0.0,
    }));

    return res.status(200).json({
      status: true,
      message: "Data statistik panen grade berhasil diambil",
      data: {
        chartData,
        summary: {
          totalHarvest: parseFloat(totalHarvestAmount.toFixed(2)),
          totalGradeTypes,
          totalCommodityTypes,
          gradeLabels,
          commodityLabels,
        },
        rawData: formattedRawData,
      },
    });
  } catch (error) {
    console.error("Error in getStatistikPanenGradeByJenisBudidaya:", error);
    return res.status(500).json({
      status: false,
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

// Function to get objekBudidaya that haven't been harvested for X days
const getObjekBudidayaBelumPanen = async (req, res) => {
  try {
    const { jenisBudidayaId } = req.params;

    if (!jenisBudidayaId) {
      return res.status(400).json({
        message: "Path parameter 'jenisBudidayaId' is required.",
      });
    }

    const jenisBudidaya = await JenisBudidaya.findOne({
      where: { id: jenisBudidayaId, isDeleted: false },
    });

    const harvestIntervalDays = jenisBudidaya.periodePanen;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - harvestIntervalDays);

    const objekBudidaya = await ObjekBudidaya.findAll({
      where: {
        isDeleted: false,
        "$DetailPanen.id$": null,
      },
      order: [
        [db.fn("length", db.col("namaId")), "ASC"],
        ["namaId", "ASC"],
      ],
      include: [
        {
          model: UnitBudidaya,
          required: true,
          attributes: ["id", "nama"],
          where: {
            jenisBudidayaId: jenisBudidayaId,
            isDeleted: false,
          },
        },
        {
          model: DetailPanen,
          as: "DetailPanen",
          attributes: ["id"],
          required: false,
          where: {
            isDeleted: false,
            createdAt: {
              [Op.gte]: cutoffDate,
            },
          },
        },
      ],
    });

    // return res.status(200).json({
    //   length: objekBudidaya.length,
    //   data: objekBudidaya,
    // });

    return res.status(200).json({
      message: `Successfully retrieved objects that need harvesting for ${jenisBudidaya.nama}.`,
      data: {
        cutoffDate: cutoffDate,
        totalObjects: objekBudidaya.length,
        objects: objekBudidaya.map((obj) => ({
          id: obj.id,
          namaId: obj.namaId,
          unitBudidaya: {
            id: obj.UnitBudidaya.id,
            nama: obj.UnitBudidaya.nama,
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error in getObjekBudidayaBelumPanen:", error);
    return res.status(500).json({
      message: "An error occurred while fetching objects that need harvesting.",
      error: error.message,
    });
  }
};

module.exports = {
  getStatistikLaporanHarian,
  getRiwayatPemberianNutrisiPerJenisBudidaya,
  getStatistikSakit,
  getRiwayatPelaporanSakitPerJenisBudidaya,
  getStatistikPenyakit,

  getStatistikPenyebabKematian,
  getStatistikKematian,
  getRiwayatPelaporanKematianPerJenisBudidaya,

  //Perkebunan
  getStatistikHarianJenisBudidaya,
  getStatistikPenyiraman,
  getStatistikPruning,
  getStatistikRepotting,
  getStatistikDisinfektan,
  getStatistikPanenTanaman,
  getStatistikJumlahPanenTanaman,
  getRiwayatPelaporanPanenTanaman,
  getRiwayatPelaporanHarianTanaman,
  getStatistikPanenGradeByJenisBudidaya,

  getStatistikPemberianNutrisi,

  //Peternakan
  getStatistikPakan,
  getStatistikCekKandang,
  getRiwayatPelaporanHarianTernak,
  getStatistikVitamin,
  getStatistikVaksin,

  getStatistikPanenTernak,
  getStatistikJumlahPanenTernak,
  getRiwayatPelaporanPanenTernak,

  // Objek Budidaya Belum Panen
  getObjekBudidayaBelumPanen,
};
