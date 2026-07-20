const { Op } = require("sequelize");
const { randomUUID } = require("crypto");
const { sendNotificationToTarget } = require("../../services/notificationService");
const db = require("../model/index");

const {
  sequelize,
  Sequelize,
  UnitBudidaya,
  ObjekBudidaya,
  Laporan,
  Sakit,
  DaftarGejala,
  LaporanGejala,
  PenyakitGejala,
  StatusLogPenyakitAyam,
  HealthIndication,
  HealthIndicationObject,
  User,
} = db;

const QueryTypes = Sequelize.QueryTypes;
const DEFAULT_DAYS = 7;
const DEFAULT_THRESHOLD_PERCENT = 40;
const PRODUCTION_DROP_SYMPTOM = "Penurunan produksi telur >= 40% selama 7 hari";
const INDIVIDUAL_PRODUCTIVITY_DROP_SYMPTOM = "Penurunan produktivitas bertelur individu >= 40% dibanding periode sebelumnya";
const PRODUCTION_DROP_DISEASE = "Indikasi Gangguan Produktivitas Telur";
const INDICATION_CODE = "egg_production_drop_40_percent_7_days";
const INDIVIDUAL_PRODUCTIVITY_DROP_CODE = "individual_egg_productivity_drop_40_percent";

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePercent(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : fallback;
}

function dateRange({ days = DEFAULT_DAYS, startDate = null, endDate = null } = {}) {
  const normalizedDays = parsePositiveInteger(days, DEFAULT_DAYS);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const start = startDate ? new Date(startDate) : new Date(end);
  if (!startDate) {
    start.setDate(end.getDate() - normalizedDays + 1);
  }
  start.setHours(0, 0, 0, 0);

  return { start, end, days: normalizedDays };
}

function previousDateRange(currentRange) {
  const previousEnd = new Date(currentRange.start);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - currentRange.days + 1);
  previousStart.setHours(0, 0, 0, 0);

  return {
    start: previousStart,
    end: previousEnd,
    days: currentRange.days,
  };
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function round(value, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round((Number(value) || 0) * multiplier) / multiplier;
}

async function getUnit(unitBudidayaId) {
  return UnitBudidaya.findOne({
    where: { id: unitBudidayaId, isDeleted: false },
    attributes: ["id", "nama", "tipe", "jumlah"],
  });
}

async function getActiveChickens(unitBudidayaId) {
  return ObjekBudidaya.findAll({
    where: {
      UnitBudidayaId: unitBudidayaId,
      isDeleted: false,
    },
    attributes: ["id", "namaId"],
    order: [["namaId", "ASC"]],
  });
}

async function getHarvestedChickenRows(unitBudidayaId, start, end) {
  return sequelize.query(
    `
      SELECT DISTINCT dp.objekBudidayaId
      FROM detailPanen dp
      INNER JOIN panen p ON p.id = dp.panenId AND p.isDeleted = 0
      INNER JOIN laporan l ON l.id = p.laporanId AND l.isDeleted = 0
      WHERE dp.isDeleted = 0
        AND l.tipe = 'panen'
        AND l.unitBudidayaId = :unitBudidayaId
        AND l.createdAt BETWEEN :start AND :end
        AND dp.objekBudidayaId IS NOT NULL
    `,
    {
      replacements: { unitBudidayaId, start, end },
      type: QueryTypes.SELECT,
    }
  );
}

async function getDailyHarvestRows(unitBudidayaId, start, end) {
  return sequelize.query(
    `
      SELECT
        DATE(l.createdAt) AS tanggal,
        COUNT(DISTINCT dp.objekBudidayaId) AS ayamBertelur
      FROM detailPanen dp
      INNER JOIN panen p ON p.id = dp.panenId AND p.isDeleted = 0
      INNER JOIN laporan l ON l.id = p.laporanId AND l.isDeleted = 0
      WHERE dp.isDeleted = 0
        AND l.tipe = 'panen'
        AND l.unitBudidayaId = :unitBudidayaId
        AND l.createdAt BETWEEN :start AND :end
        AND dp.objekBudidayaId IS NOT NULL
      GROUP BY DATE(l.createdAt)
      ORDER BY tanggal ASC
    `,
    {
      replacements: { unitBudidayaId, start, end },
      type: QueryTypes.SELECT,
    }
  );
}

async function getIndividualLayingDayRows(unitBudidayaId, start, end) {
  return sequelize.query(
    `
      SELECT
        dp.objekBudidayaId,
        COUNT(DISTINCT DATE(l.createdAt)) AS layingDays
      FROM detailPanen dp
      INNER JOIN panen p ON p.id = dp.panenId AND p.isDeleted = 0
      INNER JOIN laporan l ON l.id = p.laporanId AND l.isDeleted = 0
      WHERE dp.isDeleted = 0
        AND l.tipe = 'panen'
        AND l.unitBudidayaId = :unitBudidayaId
        AND l.createdAt BETWEEN :start AND :end
        AND dp.objekBudidayaId IS NOT NULL
      GROUP BY dp.objekBudidayaId
    `,
    {
      replacements: { unitBudidayaId, start, end },
      type: QueryTypes.SELECT,
    }
  );
}

function sortIndividualRows(rows, sortBy = "drop", direction = "desc") {
  const normalizedDirection = String(direction).toLowerCase() === "asc" ? "asc" : "desc";
  const multiplier = normalizedDirection === "asc" ? 1 : -1;

  const valueFor = (row) => {
    switch (sortBy) {
      case "name":
      case "nama":
        return row.namaId || "";
      case "current":
      case "current_percent":
      case "productivity":
        return row.current.layingPercent;
      case "previous":
      case "previous_percent":
        return row.previous.layingPercent;
      case "non_laying":
        return row.current.nonLayingDays;
      case "drop_points":
        return row.dropPoints;
      case "drop":
      case "drop_percent":
      default:
        return row.dropPercent;
    }
  };

  return [...rows].sort((a, b) => {
    const av = valueFor(a);
    const bv = valueFor(b);

    if (typeof av === "string" || typeof bv === "string") {
      return String(av).localeCompare(String(bv)) * multiplier;
    }

    if (av === bv) {
      return String(a.namaId || "").localeCompare(String(b.namaId || ""));
    }

    return av > bv ? multiplier : -multiplier;
  });
}

async function getEggProductionDropContext(options = {}) {
  const unitBudidayaId = options.unitBudidayaId;
  const thresholdPercent = parsePercent(
    options.thresholdPercent,
    DEFAULT_THRESHOLD_PERCENT
  );
  const { start, end, days } = dateRange(options);

  if (!unitBudidayaId) {
    const error = new Error("unitBudidayaId wajib diisi");
    error.statusCode = 422;
    throw error;
  }

  const unit = await getUnit(unitBudidayaId);
  if (!unit) {
    const error = new Error("Unit budidaya tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const activeChickens = await getActiveChickens(unitBudidayaId);
  const harvestedRows = await getHarvestedChickenRows(unitBudidayaId, start, end);
  const activeIds = new Set(activeChickens.map((ayam) => ayam.id));
  const layingIds = new Set(
    harvestedRows
      .map((row) => row.objekBudidayaId)
      .filter((id) => activeIds.has(id))
  );

  const nonLayingChickens = activeChickens
    .filter((ayam) => !layingIds.has(ayam.id))
    .map((ayam) => ({
      id: ayam.id,
      namaId: ayam.namaId,
    }));

  const activeCount = activeChickens.length;
  const layingCount = layingIds.size;
  const nonLayingCount = nonLayingChickens.length;
  const nonLayingPercent = activeCount > 0
    ? (nonLayingCount / activeCount) * 100
    : 0;

  const dailyRows = await getDailyHarvestRows(unitBudidayaId, start, end);
  const daily = dailyRows.map((row) => {
    const dailyLaying = Number(row.ayamBertelur || 0);
    const dailyNonLaying = Math.max(activeCount - dailyLaying, 0);

    return {
      tanggal: row.tanggal,
      ayamBertelur: dailyLaying,
      ayamTidakBertelur: dailyNonLaying,
      tidakBertelurPercent: activeCount > 0
        ? round((dailyNonLaying / activeCount) * 100, 2)
        : 0,
    };
  });

  const isIndividualHarvestReady = String(unit.tipe || "").toLowerCase() === "individu";
  const isIndication = activeCount > 0 && nonLayingPercent >= thresholdPercent;

  return {
    code: INDICATION_CODE,
    symptomName: PRODUCTION_DROP_SYMPTOM,
    analysisMode: "non_laying_period",
    unitBudidayaId: unit.id,
    unitName: unit.nama,
    unitType: unit.tipe,
    isIndividualHarvestReady,
    period: {
      start: formatDate(start),
      end: formatDate(end),
      days,
    },
    thresholdPercent,
    activeChickenCount: activeCount,
    layingChickenCount: layingCount,
    nonLayingChickenCount: nonLayingCount,
    nonLayingPercent: round(nonLayingPercent, 2),
    isIndication,
    status: isIndication ? "warning" : "normal",
    message: isIndication
      ? `Estimasi ${round(nonLayingPercent, 1)}% ayam tidak bertelur selama ${days} hari. Perlu pemeriksaan kesehatan.`
      : `Belum melewati ambang ${thresholdPercent}% ayam tidak bertelur selama ${days} hari.`,
    nonLayingChickens,
    daily,
  };
}

async function getIndividualEggProductivityContext(options = {}) {
  const unitBudidayaId = options.unitBudidayaId;
  const thresholdPercent = parsePercent(
    options.thresholdPercent,
    DEFAULT_THRESHOLD_PERCENT
  );
  const currentRange = dateRange(options);
  const previousRange = previousDateRange(currentRange);
  const sortBy = options.sortBy || options.sort || "drop";
  const direction = options.direction || "desc";

  if (!unitBudidayaId) {
    const error = new Error("unitBudidayaId wajib diisi");
    error.statusCode = 422;
    throw error;
  }

  const unit = await getUnit(unitBudidayaId);
  if (!unit) {
    const error = new Error("Unit budidaya tidak ditemukan");
    error.statusCode = 404;
    throw error;
  }

  const activeChickens = await getActiveChickens(unitBudidayaId);
  const activeIds = new Set(activeChickens.map((ayam) => ayam.id));
  const currentRows = await getIndividualLayingDayRows(
    unitBudidayaId,
    currentRange.start,
    currentRange.end
  );
  const previousRows = await getIndividualLayingDayRows(
    unitBudidayaId,
    previousRange.start,
    previousRange.end
  );

  const currentMap = new Map(
    currentRows
      .filter((row) => activeIds.has(row.objekBudidayaId))
      .map((row) => [row.objekBudidayaId, Number(row.layingDays || 0)])
  );
  const previousMap = new Map(
    previousRows
      .filter((row) => activeIds.has(row.objekBudidayaId))
      .map((row) => [row.objekBudidayaId, Number(row.layingDays || 0)])
  );

  const rows = activeChickens.map((ayam) => {
    const currentLayingDays = Math.min(
      Number(currentMap.get(ayam.id) || 0),
      currentRange.days
    );
    const previousLayingDays = Math.min(
      Number(previousMap.get(ayam.id) || 0),
      previousRange.days
    );
    const currentPercent = currentRange.days > 0
      ? (currentLayingDays / currentRange.days) * 100
      : 0;
    const previousPercent = previousRange.days > 0
      ? (previousLayingDays / previousRange.days) * 100
      : 0;
    const dropPoints = Math.max(previousPercent - currentPercent, 0);
    const dropPercent = previousPercent > 0
      ? (dropPoints / previousPercent) * 100
      : 0;
    const isDropIndication = previousPercent > 0 && dropPercent >= thresholdPercent;

    return {
      id: ayam.id,
      namaId: ayam.namaId,
      current: {
        layingDays: currentLayingDays,
        nonLayingDays: Math.max(currentRange.days - currentLayingDays, 0),
        layingPercent: round(currentPercent, 2),
        hdpPercent: round(currentPercent, 2),
      },
      previous: {
        layingDays: previousLayingDays,
        nonLayingDays: Math.max(previousRange.days - previousLayingDays, 0),
        layingPercent: round(previousPercent, 2),
        hdpPercent: round(previousPercent, 2),
      },
      dropPoints: round(dropPoints, 2),
      dropPercent: round(dropPercent, 2),
      isDropIndication,
      status: isDropIndication
        ? "warning"
        : (currentLayingDays === 0 ? "attention" : "normal"),
    };
  });

  const sortedRows = sortIndividualRows(rows, sortBy, direction);
  const indicationChickens = sortedRows
    .filter((row) => row.isDropIndication)
    .map((row) => ({
      id: row.id,
      namaId: row.namaId,
      currentLayingPercent: row.current.layingPercent,
      previousLayingPercent: row.previous.layingPercent,
      dropPercent: row.dropPercent,
      dropPoints: row.dropPoints,
    }));

  const activeCount = activeChickens.length;
  const indicationCount = indicationChickens.length;
  const indicationPercent = activeCount > 0
    ? (indicationCount / activeCount) * 100
    : 0;
  const avgCurrent = activeCount > 0
    ? rows.reduce((sum, row) => sum + row.current.layingPercent, 0) / activeCount
    : 0;
  const avgPrevious = activeCount > 0
    ? rows.reduce((sum, row) => sum + row.previous.layingPercent, 0) / activeCount
    : 0;
  const avgDrop = avgPrevious > 0 && avgCurrent < avgPrevious
    ? ((avgPrevious - avgCurrent) / avgPrevious) * 100
    : 0;
  const isIndividualHarvestReady = String(unit.tipe || "").toLowerCase() === "individu";
  const isIndication = isIndividualHarvestReady && indicationCount > 0;

  return {
    code: INDIVIDUAL_PRODUCTIVITY_DROP_CODE,
    symptomName: INDIVIDUAL_PRODUCTIVITY_DROP_SYMPTOM,
    analysisMode: "individual_productivity_drop",
    unitBudidayaId: unit.id,
    unitName: unit.nama,
    unitType: unit.tipe,
    isIndividualHarvestReady,
    currentPeriod: {
      start: formatDate(currentRange.start),
      end: formatDate(currentRange.end),
      days: currentRange.days,
    },
    previousPeriod: {
      start: formatDate(previousRange.start),
      end: formatDate(previousRange.end),
      days: previousRange.days,
    },
    period: {
      start: formatDate(currentRange.start),
      end: formatDate(currentRange.end),
      days: currentRange.days,
    },
    thresholdPercent,
    activeChickenCount: activeCount,
    indicationChickenCount: indicationCount,
    indicationChickenPercent: round(indicationPercent, 2),
    nonLayingChickenCount: indicationCount,
    nonLayingPercent: round(indicationPercent, 2),
    averageCurrentLayingPercent: round(avgCurrent, 2),
    averagePreviousLayingPercent: round(avgPrevious, 2),
    averageCurrentHdpPercent: round(avgCurrent, 2),
    averagePreviousHdpPercent: round(avgPrevious, 2),
    averageDropPercent: round(avgDrop, 2),
    isIndication,
    status: isIndication ? "warning" : "normal",
    message: isIndication
      ? `${indicationCount} ayam mengalami penurunan produktivitas bertelur minimal ${thresholdPercent}% dibanding periode sebelumnya.`
      : `Belum ada ayam dengan penurunan produktivitas bertelur minimal ${thresholdPercent}% dibanding periode sebelumnya.`,
    indicationChickens,
    nonLayingChickens: indicationChickens,
    rows: sortedRows,
    sort: {
      by: sortBy,
      direction: String(direction).toLowerCase() === "asc" ? "asc" : "desc",
    },
  };
}

async function findFallbackUserId(transaction) {
  const user = await User.findOne({
    where: {
      role: {
        [Op.in]: ["pjawab", "admin", "owner"],
      },
    },
    attributes: ["id"],
    transaction,
  });

  return user?.id ?? null;
}

async function gejalaSchema(transaction) {
  return sequelize.getQueryInterface().describeTable("gejala", { transaction });
}

async function describeTableIfExists(tableName, transaction) {
  try {
    return await sequelize.getQueryInterface().describeTable(tableName, { transaction });
  } catch (error) {
    const code = error?.original?.code || error?.parent?.code;

    if (
      code === "ER_NO_SUCH_TABLE" ||
      String(error?.message || "").includes(`No description found for "${tableName}" table`)
    ) {
      return null;
    }

    throw error;
  }
}

function timestampColumns(schema) {
  const now = new Date();
  const columns = {};

  if (schema.createdAt) {
    columns.createdAt = now;
  }

  if (schema.updatedAt) {
    columns.updatedAt = now;
  }

  return columns;
}

async function findGejalaByColumn(column, name, transaction) {
  const rows = await sequelize.query(
    `SELECT id FROM gejala WHERE ${column} = :name LIMIT 1`,
    {
      replacements: { name },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return rows[0] || null;
}

async function ensureProductionDropSymptom(transaction, symptomName = PRODUCTION_DROP_SYMPTOM) {
  const schema = await gejalaSchema(transaction);
  const labelColumn = schema.nama_gejala ? "nama_gejala" : (schema.gejala1 ? "gejala1" : null);

  if (!labelColumn) {
    const error = new Error("Schema tabel gejala tidak dikenali. Kolom nama_gejala/gejala1 tidak tersedia.");
    error.statusCode = 500;
    throw error;
  }

  const existing = await findGejalaByColumn(labelColumn, symptomName, transaction);

  if (existing) {
    const updates = {};

    if (schema.gambar) {
      updates.gambar = "system://spk/egg-production-drop";
    }

    if (schema.deletedAt) {
      updates.deletedAt = null;
    }

    if (schema.updatedAt) {
      updates.updatedAt = new Date();
    }

    if (Object.keys(updates).length > 0) {
      await sequelize.getQueryInterface().bulkUpdate(
        "gejala",
        updates,
        { id: existing.id },
        { transaction }
      );
    }

    return { id: existing.id };
  }

  const id = randomUUID();
  const payload = {
    id,
    [labelColumn]: symptomName,
    ...timestampColumns(schema),
  };

  if (schema.gambar) {
    payload.gambar = "system://spk/egg-production-drop";
  }

  if (schema.deletedAt) {
    payload.deletedAt = null;
  }

  await sequelize.getQueryInterface().bulkInsert(
    "gejala",
    [payload],
    { transaction }
  );

  return { id };
}

async function ensureProductionDropDisease(gejala, transaction) {
  const schema = await sequelize.getQueryInterface().describeTable(
    "penyakit_ayam",
    { transaction }
  );
  const selectColumns = schema.deletedAt ? "id, deletedAt" : "id";
  const rows = await sequelize.query(
    `SELECT ${selectColumns} FROM penyakit_ayam WHERE nama_penyakit = :name LIMIT 1`,
    {
      replacements: { name: PRODUCTION_DROP_DISEASE },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  let disease = rows[0] || null;

  if (!disease) {
    disease = { id: randomUUID() };
    const payload = {
      id: disease.id,
      nama_penyakit: PRODUCTION_DROP_DISEASE,
      ...timestampColumns(schema),
    };

    if (schema.deletedAt) {
      payload.deletedAt = null;
    }

    await sequelize.getQueryInterface().bulkInsert(
      "penyakit_ayam",
      [payload],
      { transaction }
    );
  } else if (schema.deletedAt && disease.deletedAt) {
    const updates = { deletedAt: null };

    if (schema.updatedAt) {
      updates.updatedAt = new Date();
    }

    await sequelize.getQueryInterface().bulkUpdate(
      "penyakit_ayam",
      updates,
      { id: disease.id },
      { transaction }
    );
  }

  const relation = await PenyakitGejala.findOne({
    where: {
      penyakit_id: disease.id,
      gejala_id: gejala.id,
    },
    transaction,
  });

  if (!relation) {
    await PenyakitGejala.create(
      {
        penyakit_id: disease.id,
        gejala_id: gejala.id,
        cf_weight: 0.7,
        disease_frequency: 1,
        total_disease: 1,
        metode: "system",
        cf_updated_at: new Date(),
      },
      { transaction }
    );
  }

  return disease;
}

async function ensureDiseaseSymptomReportRelation(disease, gejala, transaction) {
  const schema = await describeTableIfExists("laporan_gejala", transaction);

  if (!schema) {
    return null;
  }

  const rows = await sequelize.query(
    `
      SELECT id
      FROM laporan_gejala
      WHERE penyakit_ayam_id = :penyakitId
        AND gejala_id = :gejalaId
      LIMIT 1
    `,
    {
      replacements: {
        penyakitId: disease.id,
        gejalaId: gejala.id,
      },
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  if (rows[0]) {
    return rows[0];
  }

  const payload = {
    id: randomUUID(),
    penyakit_ayam_id: disease.id,
    gejala_id: gejala.id,
    ...timestampColumns(schema),
  };

  await sequelize.getQueryInterface().bulkInsert(
    "laporan_gejala",
    [payload],
    { transaction }
  );

  return { id: payload.id };
}

async function findExistingAutomaticReport(context) {
  const code = context.code || INDICATION_CODE;

  return Laporan.findOne({
    where: {
      tipe: "sakit",
      UnitBudidayaId: context.unitBudidayaId,
      isDeleted: false,
      catatan: {
        [Op.like]: `%${code}%`,
      },
      createdAt: {
        [Op.between]: [
          new Date(`${context.period.start}T00:00:00.000Z`),
          new Date(`${context.period.end}T23:59:59.999Z`),
        ],
      },
    },
    include: [{ model: Sakit, required: false }],
    order: [["createdAt", "DESC"]],
  });
}

function buildReportNote(context, source = "laravel-spk", chicken = null) {
  const parts = [
    `source=${source}`,
    `code=${context.code || INDICATION_CODE}`,
    `mode=${context.analysisMode || 'non_laying_period'}`,
    `periode=${context.period.start}..${context.period.end}`,
    `ayam_aktif=${context.activeChickenCount}`,
    `ayam_tidak_bertelur=${context.nonLayingChickenCount}`,
    `persentase=${context.nonLayingPercent}%`,
    `threshold=${context.thresholdPercent}%`,
  ];

  if (chicken?.id) {
    parts.push(`objek_budidaya_id=${chicken.id}`);
  }

  if (chicken?.namaId) {
    parts.push(`objek_budidaya=${chicken.namaId}`);
  }

  if (chicken?.dropPercent !== undefined) {
    parts.push(`penurunan=${chicken.dropPercent}%`);
  }

  if (chicken?.currentLayingPercent !== undefined) {
    parts.push(`produktivitas_sekarang=${chicken.currentLayingPercent}%`);
  }

  if (chicken?.previousLayingPercent !== undefined) {
    parts.push(`produktivitas_sebelumnya=${chicken.previousLayingPercent}%`);
  }

  return parts.join("; ");
}

function notificationBody(context) {
  if (context.analysisMode === "individual_productivity_drop") {
    return `${context.unitName}: ${context.indicationChickenCount || 0} ayam mengalami penurunan produktivitas bertelur minimal ${context.thresholdPercent}% dibanding periode sebelumnya. Lakukan checklist kesehatan.`;
  }

  return `${context.unitName}: ${context.nonLayingPercent}% ayam tidak bertelur selama ${context.period.days} hari. Lakukan checklist pemeriksaan kesehatan.`;
}

function affectedChickensFromContext(context) {
  const source = Array.isArray(context.indicationChickens) && context.indicationChickens.length > 0
    ? context.indicationChickens
    : Array.isArray(context.nonLayingChickens) && context.nonLayingChickens.length > 0
      ? context.nonLayingChickens
      : [];
  const rowMap = new Map(
    Array.isArray(context.rows)
      ? context.rows.map((row) => [row.id, row])
      : []
  );

  return source
    .filter((chicken) => chicken?.id)
    .map((chicken) => {
      const row = rowMap.get(chicken.id) || {};

      return {
        id: chicken.id,
        namaId: chicken.namaId,
        currentLayingPercent: chicken.currentLayingPercent ?? row.current?.layingPercent ?? null,
        previousLayingPercent: chicken.previousLayingPercent ?? row.previous?.layingPercent ?? null,
        currentLayingDays: row.current?.layingDays ?? null,
        previousLayingDays: row.previous?.layingDays ?? null,
        dropPercent: chicken.dropPercent ?? row.dropPercent ?? null,
        dropPoints: chicken.dropPoints ?? row.dropPoints ?? null,
      };
    });
}

async function findExistingHealthIndicationAlert(context) {
  if (!HealthIndication) {
    return null;
  }

  return HealthIndication.findOne({
    where: {
      unitBudidayaId: context.unitBudidayaId,
      indicationCode: context.code || INDICATION_CODE,
      analysisMode: context.analysisMode || "individual_productivity_drop",
      periodStart: context.period?.start || null,
      periodEnd: context.period?.end || null,
      isDeleted: false,
      status: {
        [Op.in]: ["pending", "checked"],
      },
    },
    include: HealthIndicationObject
      ? [{
        model: HealthIndicationObject,
        as: "objects",
        where: { isDeleted: false },
        required: false,
      }]
      : [],
    order: [["createdAt", "DESC"]],
  });
}

function buildHealthIndicationTitle(context) {
  if (context.analysisMode === "individual_productivity_drop") {
    return "Indikasi Penurunan Produktivitas Telur";
  }

  return "Indikasi Ayam Tidak Bertelur";
}

function serializeHealthIndicationAlert(indication, objects = []) {
  if (!indication) {
    return null;
  }

  return {
    id: indication.id,
    unitBudidayaId: indication.unitBudidayaId,
    source: indication.source,
    indicationCode: indication.indicationCode,
    analysisMode: indication.analysisMode,
    title: indication.title,
    message: indication.message,
    severity: indication.severity,
    status: indication.status,
    period: {
      start: indication.periodStart,
      end: indication.periodEnd,
      days: indication.periodDays,
    },
    thresholdPercent: indication.thresholdPercent !== null
      ? Number(indication.thresholdPercent)
      : null,
    affectedObjectCount: indication.affectedObjectCount,
    detectedAt: indication.detectedAt,
    checkedAt: indication.checkedAt,
    objects: objects.map((item) => ({
      id: item.id,
      objekBudidayaId: item.objekBudidayaId,
      namaId: item.namaId,
      dropPercent: item.dropPercent != null ? Number(item.dropPercent) : null,
      dropPoints: item.dropPoints != null ? Number(item.dropPoints) : null,
      currentLayingPercent: item.currentLayingPercent != null
        ? Number(item.currentLayingPercent)
        : null,
      previousLayingPercent: item.previousLayingPercent != null
        ? Number(item.previousLayingPercent)
        : null,
      currentLayingDays: item.currentLayingDays,
      previousLayingDays: item.previousLayingDays,
      status: item.status,
    })),
  };
}

async function createHealthIndicationAlert(options = {}) {
  const context = options.context || (
    options.analysisMode === "individual_productivity_drop"
      ? await getIndividualEggProductivityContext(options)
      : await getEggProductionDropContext(options)
  );
  const force = options.force === true;
  const affectedChickens = affectedChickensFromContext(context);

  if ((!context.isIndication || affectedChickens.length === 0) && !force) {
    return {
      created: false,
      skipped: true,
      reason: "BELOW_THRESHOLD",
      context,
    };
  }

  const existing = await findExistingHealthIndicationAlert(context);
  if (existing && !force) {
    return {
      created: false,
      skipped: true,
      reason: "DUPLICATE_PERIOD",
      context,
      indication: serializeHealthIndicationAlert(existing, existing.objects || []),
    };
  }

  if (!HealthIndication || !HealthIndicationObject) {
    const error = new Error("Model health indication belum tersedia. Jalankan migration terbaru terlebih dahulu.");
    error.statusCode = 500;
    throw error;
  }

  const transaction = await sequelize.transaction();
  let indication;
  let createdObjects = [];

  try {
    const now = new Date();
    indication = await HealthIndication.create(
      {
        unitBudidayaId: context.unitBudidayaId,
        source: options.source || "spk-web",
        indicationCode: context.code || INDICATION_CODE,
        analysisMode: context.analysisMode || "individual_productivity_drop",
        title: buildHealthIndicationTitle(context),
        message: context.message || notificationBody(context),
        severity: context.status === "critical" ? "critical" : "warning",
        status: "pending",
        periodStart: context.period?.start || null,
        periodEnd: context.period?.end || null,
        periodDays: context.period?.days || null,
        thresholdPercent: context.thresholdPercent ?? null,
        affectedObjectCount: affectedChickens.length,
        context,
        detectedAt: now,
      },
      { transaction }
    );

    createdObjects = await HealthIndicationObject.bulkCreate(
      affectedChickens.map((chicken) => ({
        healthIndicationId: indication.id,
        objekBudidayaId: chicken.id,
        namaId: chicken.namaId,
        dropPercent: chicken.dropPercent,
        dropPoints: chicken.dropPoints,
        currentLayingPercent: chicken.currentLayingPercent,
        previousLayingPercent: chicken.previousLayingPercent,
        currentLayingDays: chicken.currentLayingDays,
        previousLayingDays: chicken.previousLayingDays,
        status: "pending",
      })),
      { transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  let notification = null;
  if (options.notify !== false) {
    notification = await sendNotificationToTarget(
      { role: options.targetRole || "petugas" },
      "Indikasi Kesehatan Ayam",
      notificationBody(context),
      {
        type: "HEALTH_INDICATION",
        action: "OPEN_HEALTH_CHECKLIST",
        source: options.source || "spk-web",
        indicationId: indication.id,
        indicationCode: context.code || INDICATION_CODE,
        analysisMode: context.analysisMode || "individual_productivity_drop",
        unitBudidayaId: context.unitBudidayaId,
        affectedObjectCount: affectedChickens.length,
        affectedObjectIds: affectedChickens.map((chicken) => chicken.id).slice(0, 20).join(","),
        severity: "warning",
      }
    );

    await indication.update({ notificationResult: notification });
  }

  return {
    created: true,
    skipped: false,
    context,
    indication: serializeHealthIndicationAlert(indication, createdObjects),
    notification,
  };
}

async function createAutomaticHealthIndication(options = {}) {
  const context = options.context || (
    options.analysisMode === "individual_productivity_drop"
      ? await getIndividualEggProductivityContext(options)
      : await getEggProductionDropContext(options)
  );
  const force = options.force === true;

  if (!context.isIndication && !force) {
    return {
      created: false,
      skipped: true,
      reason: "BELOW_THRESHOLD",
      context,
    };
  }

  const existing = await findExistingAutomaticReport(context);
  if (existing && !force) {
    return {
      created: false,
      skipped: true,
      reason: "DUPLICATE_PERIOD",
      context,
      report: {
        laporanId: existing.id,
        sakitId: existing.Sakit?.id ?? null,
      },
    };
  }

  const transaction = await sequelize.transaction();
  const affectedChickens = Array.isArray(context.indicationChickens) && context.indicationChickens.length > 0
    ? context.indicationChickens
    : Array.isArray(context.nonLayingChickens) && context.nonLayingChickens.length > 0
      ? context.nonLayingChickens
    : [{ id: null, namaId: null }];

  const createdReports = [];
  const createdSakit = [];
  const createdDaftarGejala = [];

  try {
    const userId = options.userId || await findFallbackUserId(transaction);
    if (!userId) {
      const error = new Error("Tidak ada user penanggung jawab/admin untuk pemilik laporan otomatis.");
      error.statusCode = 422;
      throw error;
    }

    const gejala = await ensureProductionDropSymptom(
      transaction,
      context.symptomName || PRODUCTION_DROP_SYMPTOM
    );
    const disease = await ensureProductionDropDisease(gejala, transaction);
    await ensureDiseaseSymptomReportRelation(disease, gejala, transaction);
    const statusLogSchema = await describeTableIfExists(
      "status_log_penyakit_ayam",
      transaction
    );

    for (const chicken of affectedChickens) {
      const laporan = await Laporan.create(
        {
          judul: chicken?.namaId
            ? `Indikasi Kesehatan - ${chicken.namaId}`
            : `Indikasi Kesehatan - ${context.unitName}`,
          tipe: "sakit",
          userId,
          UnitBudidayaId: context.unitBudidayaId,
          ObjekBudidayaId: chicken?.id ?? null,
          gambar: null,
          catatan: buildReportNote(context, options.source, chicken),
        },
        { transaction }
      );

      const sakit = await Sakit.create(
        {
          LaporanId: laporan.id,
          diagnosisPenyakit: disease.id,
          status: "Belum Ditangani",
        },
        { transaction }
      );

      const daftarGejala = await DaftarGejala.create(
        {
          sakitId: sakit.id,
          gejalaId: gejala.id,
          catatan: context.message,
        },
        { transaction }
      );

      if (StatusLogPenyakitAyam && statusLogSchema) {
        await StatusLogPenyakitAyam.create(
          {
            laporan_sakit_id: sakit.id,
            status: "Belum Ditangani",
            catatan: "Dibuat otomatis dari indikasi penurunan produksi telur.",
            updated_by: userId,
          },
          { transaction }
        );
      }

      createdReports.push(laporan);
      createdSakit.push(sakit);
      createdDaftarGejala.push(daftarGejala);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const primaryReport = createdReports[0] || null;
  const primarySakit = createdSakit[0] || null;
  const primaryDaftarGejala = createdDaftarGejala[0] || null;
  const affectedObjectIds = affectedChickens
    .map((chicken) => chicken.id)
    .filter(Boolean);

  let notification = null;
  if (options.notify !== false) {
    notification = await sendNotificationToTarget(
      { role: options.targetRole || "petugas" },
      "Indikasi Kesehatan Ayam",
      notificationBody(context),
        {
        type: "HEALTH_INDICATION",
        source: options.source || "laravel-spk",
        indicationCode: context.code || INDICATION_CODE,
        analysisMode: context.analysisMode || "non_laying_period",
        unitBudidayaId: context.unitBudidayaId,
        laporanId: primaryReport?.id,
        sakitId: primarySakit?.id,
        affectedObjectCount: affectedObjectIds.length,
        affectedObjectIds: affectedObjectIds.slice(0, 20).join(","),
        severity: "warning",
      }
    );
  }

  return {
    created: true,
    skipped: false,
    context,
    report: {
      laporanId: primaryReport?.id ?? null,
      sakitId: primarySakit?.id ?? null,
      daftarGejalaId: primaryDaftarGejala?.id ?? null,
      laporanIds: createdReports.map((item) => item.id),
      sakitIds: createdSakit.map((item) => item.id),
      daftarGejalaIds: createdDaftarGejala.map((item) => item.id),
      affectedObjectCount: affectedObjectIds.length,
      affectedObjects: affectedChickens.map((chicken) => ({
        id: chicken.id,
        namaId: chicken.namaId,
      })),
    },
    notification,
  };
}

module.exports = {
  DEFAULT_DAYS,
  DEFAULT_THRESHOLD_PERCENT,
  INDICATION_CODE,
  INDIVIDUAL_PRODUCTIVITY_DROP_CODE,
  PRODUCTION_DROP_SYMPTOM,
  INDIVIDUAL_PRODUCTIVITY_DROP_SYMPTOM,
  getEggProductionDropContext,
  getIndividualEggProductivityContext,
  createHealthIndicationAlert,
  createAutomaticHealthIndication,
};
