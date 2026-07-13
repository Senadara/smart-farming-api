const sequelize = require("../model/index");

const DailyReportMetric = sequelize.DailyReportMetric;

function normalizeMetricCode(code) {
  if (!code) return null;
  const normalized = String(code).trim().toLowerCase();
  return /^[a-z0-9_]+$/.test(normalized) ? normalized : null;
}

function normalizeMetric(metric) {
  if (!metric) return null;

  const metricCode = normalizeMetricCode(
    metric.metric_code || metric.metricCode || metric.code || metric.name
  );
  const rawValue = metric.value ?? metric.nilai ?? metric.amount;
  const value = Number(rawValue);

  if (!metricCode || !Number.isFinite(value)) {
    return null;
  }

  return {
    metric_code: metricCode,
    value,
    unit: metric.unit || metric.satuan || null,
    metadata: metric.metadata || metric.meta || null,
  };
}

function normalizeMetrics(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.map(normalizeMetric).filter(Boolean);
  }

  if (typeof input === "object") {
    return Object.entries(input)
      .map(([code, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return normalizeMetric({ code, ...value });
        }

        return normalizeMetric({ code, value });
      })
      .filter(Boolean);
  }

  return [];
}

function mergeMetrics(...metricGroups) {
  const byCode = new Map();

  for (const group of metricGroups) {
    for (const metric of normalizeMetrics(group)) {
      byCode.set(metric.metric_code, metric);
    }
  }

  return Array.from(byCode.values());
}

async function saveDailyReportMetrics(laporanId, metrics, transaction) {
  if (!DailyReportMetric || !laporanId) {
    return [];
  }

  const normalizedMetrics = normalizeMetrics(metrics).map((metric) => ({
    ...metric,
    laporan_id: laporanId,
  }));

  if (normalizedMetrics.length === 0) {
    return [];
  }

  await DailyReportMetric.destroy({
    where: { laporan_id: laporanId },
    transaction,
  });

  return DailyReportMetric.bulkCreate(normalizedMetrics, { transaction });
}

module.exports = {
  mergeMetrics,
  normalizeMetrics,
  saveDailyReportMetrics,
};
