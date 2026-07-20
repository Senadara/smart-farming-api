const moment = require("moment");
const db = require("../src/model/index");
const {
  createHealthIndicationAlert,
} = require("../src/services/eggProductionHealthService");
const { sendNotificationToTarget } = require("./notificationService");

const { sequelize, Sequelize, UnitBudidaya } = db;
const QueryTypes = Sequelize.QueryTypes;

const SETTINGS_TABLE = "spk_health_scheduler_settings";
const DEFAULT_SETTING_ID = "9f0b1800-0000-4000-8000-000000000601";
const DEFAULT_SCHEDULE_TIMES = ["07:00"];
const DEFAULT_DAYS = 7;
const DEFAULT_THRESHOLD_PERCENT = 40;
const DEFAULT_TARGET_ROLE = "petugas";

let schedulerRunning = false;

function normalizeTime(value) {
  const match = String(value || "").trim().match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);

  if (!match) {
    return null;
  }

  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]}`;
}

function parseScheduleTimes(value) {
  let items = value;

  if (typeof value === "string") {
    const text = value.trim();

    if (text.startsWith("[")) {
      try {
        items = JSON.parse(text);
      } catch (error) {
        items = text;
      }
    }

    if (typeof items === "string") {
      items = items.split(/[\s,;]+/);
    }
  }

  if (!Array.isArray(items)) {
    items = [];
  }

  const normalized = items
    .map(normalizeTime)
    .filter(Boolean);

  return [...new Set(normalized)].sort();
}

function parseBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "true";
}

function parseInteger(value, fallback, allowed = null) {
  const parsed = Number(value);
  const normalized = Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;

  return allowed && !allowed.includes(normalized) ? fallback : normalized;
}

function parsePercent(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 100
    ? parsed
    : fallback;
}

function normalizeSetting(row, available = true) {
  const scheduleTimes = parseScheduleTimes(row?.schedule_times);

  return {
    available,
    id: row?.id || DEFAULT_SETTING_ID,
    isEnabled: parseBoolean(row?.is_enabled),
    scheduleTimes: scheduleTimes.length > 0 ? scheduleTimes : DEFAULT_SCHEDULE_TIMES,
    days: parseInteger(row?.days, DEFAULT_DAYS, [7, 14, 30]),
    thresholdPercent: parsePercent(row?.threshold_percent, DEFAULT_THRESHOLD_PERCENT),
    targetRole: row?.target_role || DEFAULT_TARGET_ROLE,
    lastRunAt: row?.last_run_at || null,
    lastRunKey: row?.last_run_key || null,
    lastStatus: row?.last_status || null,
    lastSummary: parseLastSummary(row?.last_summary),
  };
}

function parseLastSummary(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

async function tableExists(tableName) {
  try {
    await sequelize.getQueryInterface().describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

async function ensureDefaultSetting() {
  if (!(await tableExists(SETTINGS_TABLE))) {
    return null;
  }

  const rows = await sequelize.query(
    `SELECT * FROM ${SETTINGS_TABLE} ORDER BY createdAt ASC LIMIT 1`,
    { type: QueryTypes.SELECT }
  );

  if (rows[0]) {
    return rows[0];
  }

  const now = new Date();
  await sequelize.getQueryInterface().bulkInsert(SETTINGS_TABLE, [{
    id: DEFAULT_SETTING_ID,
    is_enabled: false,
    schedule_times: JSON.stringify(DEFAULT_SCHEDULE_TIMES),
    days: DEFAULT_DAYS,
    threshold_percent: DEFAULT_THRESHOLD_PERCENT,
    target_role: DEFAULT_TARGET_ROLE,
    last_run_at: null,
    last_run_key: null,
    last_status: null,
    last_summary: null,
    configured_by: null,
    createdAt: now,
    updatedAt: now,
  }]);

  return {
    id: DEFAULT_SETTING_ID,
    is_enabled: false,
    schedule_times: JSON.stringify(DEFAULT_SCHEDULE_TIMES),
    days: DEFAULT_DAYS,
    threshold_percent: DEFAULT_THRESHOLD_PERCENT,
    target_role: DEFAULT_TARGET_ROLE,
    last_run_at: null,
    last_run_key: null,
    last_status: null,
    last_summary: null,
  };
}

async function readHealthSchedulerSetting() {
  const row = await ensureDefaultSetting();

  if (!row) {
    return normalizeSetting({
      is_enabled: false,
      schedule_times: DEFAULT_SCHEDULE_TIMES,
      days: DEFAULT_DAYS,
      threshold_percent: DEFAULT_THRESHOLD_PERCENT,
      target_role: DEFAULT_TARGET_ROLE,
    }, false);
  }

  return normalizeSetting(row);
}

function schedulerShouldRun(setting, now) {
  if (!setting.available) {
    return { shouldRun: false, reason: "TABLE_MISSING" };
  }

  if (!setting.isEnabled) {
    return { shouldRun: false, reason: "DISABLED" };
  }

  const currentTime = now.format("HH:mm");

  if (!setting.scheduleTimes.includes(currentTime)) {
    return { shouldRun: false, reason: "TIME_NOT_MATCH" };
  }

  const runKey = `${now.format("YYYY-MM-DD")} ${currentTime}`;

  if (setting.lastRunKey === runKey) {
    return { shouldRun: false, reason: "ALREADY_RAN_THIS_MINUTE", runKey };
  }

  return { shouldRun: true, runKey };
}

async function updateSchedulerRunState(setting, patch) {
  if (!setting.available) {
    return;
  }

  await sequelize.getQueryInterface().bulkUpdate(
    SETTINGS_TABLE,
    {
      last_run_at: patch.lastRunAt,
      last_run_key: patch.lastRunKey,
      last_status: patch.lastStatus,
      last_summary: JSON.stringify(patch.lastSummary),
      updatedAt: new Date(),
    },
    { id: setting.id }
  );
}

async function getIndividualUnits() {
  return UnitBudidaya.findAll({
    where: {
      tipe: "individu",
      status: true,
      isDeleted: false,
    },
    attributes: ["id", "nama", "tipe"],
    order: [["nama", "ASC"]],
  });
}

async function sendDuplicateReminderNotification(result, setting, options = {}) {
  const context = result?.context;
  const indicationCount = Number(context?.indicationChickenCount || 0);

  if (result?.reason !== "DUPLICATE_PERIOD" || indicationCount <= 0) {
    return null;
  }

  return sendNotificationToTarget(
    { role: setting.targetRole },
    "Indikasi Kesehatan Ayam",
    `${context.unitName}: ${indicationCount} ayam masih memiliki indikasi penurunan HDP. Buka daftar indikasi untuk menjalankan checklist.`,
    {
      type: "HEALTH_INDICATION",
      action: "OPEN_HEALTH_CHECKLIST",
      source: options.source || "laravel-health-scheduler-manual-reminder",
      indicationId: result?.indication?.id || null,
      indicationCode: context.code,
      analysisMode: context.analysisMode || "individual_productivity_drop",
      unitBudidayaId: context.unitBudidayaId,
      affectedObjectCount: indicationCount,
      severity: "warning",
      duplicatePeriod: true,
    }
  );
}

async function runHealthIndicationScheduler(options = {}) {
  const now = options.now ? moment(options.now) : moment();
  const manual = options.manual === true;
  const setting = options.setting || await readHealthSchedulerSetting();
  const scheduleCheck = manual
    ? { shouldRun: true, runKey: `manual ${now.format("YYYY-MM-DD HH:mm:ss")}` }
    : schedulerShouldRun(setting, now);

  if (!scheduleCheck.shouldRun) {
    return {
      ran: false,
      reason: scheduleCheck.reason,
      setting,
    };
  }

  if (schedulerRunning) {
    return {
      ran: false,
      reason: "RUNNING",
      setting,
    };
  }

  schedulerRunning = true;

  const summary = {
    manual,
    startedAt: now.toISOString(),
    finishedAt: null,
    processedUnitCount: 0,
    createdReportCount: 0,
    createdIndicationCount: 0,
    affectedObjectCount: 0,
    reminderNotificationCount: 0,
    skippedCount: 0,
    errorCount: 0,
    units: [],
  };

  try {
    const units = await getIndividualUnits();
    summary.processedUnitCount = units.length;

    for (const unit of units) {
      try {
        const result = await createHealthIndicationAlert({
          unitBudidayaId: unit.id,
          days: setting.days,
          thresholdPercent: setting.thresholdPercent,
          analysisMode: "individual_productivity_drop",
          source: options.source || (manual
            ? "node-health-indication-scheduler-manual"
            : "node-health-indication-scheduler"),
          notify: true,
          targetRole: setting.targetRole,
        });

        const affectedCount = Number(result?.indication?.affectedObjectCount || 0);
        const created = result?.created === true;

        if (created) {
          summary.createdIndicationCount += 1;
          summary.createdReportCount += 1;
          summary.affectedObjectCount += affectedCount;
        } else {
          summary.skippedCount += 1;
        }

        let reminderNotification = null;
        if (manual && options.notifyDuplicate !== false && !created) {
          reminderNotification = await sendDuplicateReminderNotification(
            result,
            setting,
            options
          );

          if (reminderNotification?.success) {
            summary.reminderNotificationCount += Number(
              reminderNotification.successCount || 1
            );
          }
        }

        summary.units.push({
          unitBudidayaId: unit.id,
          unitName: unit.nama,
          created,
          reason: result?.reason || null,
          indicationId: result?.indication?.id || null,
          affectedObjectCount: affectedCount,
          indicationChickenCount: result?.context?.indicationChickenCount || 0,
          reminderNotificationSent: Boolean(reminderNotification?.success),
          reminderNotification,
          message: result?.context?.message || null,
        });
      } catch (error) {
        summary.errorCount += 1;
        summary.units.push({
          unitBudidayaId: unit.id,
          unitName: unit.nama,
          created: false,
          error: error.message,
        });
      }
    }

    summary.finishedAt = moment().toISOString();
    await updateSchedulerRunState(setting, {
      lastRunAt: now.toDate(),
      lastRunKey: scheduleCheck.runKey,
      lastStatus: summary.errorCount > 0 ? "partial" : "success",
      lastSummary: summary,
    });

    return {
      ran: true,
      setting,
      summary,
    };
  } finally {
    schedulerRunning = false;
  }
}

async function checkHealthIndicationScheduler() {
  try {
    const result = await runHealthIndicationScheduler();

    if (result.ran) {
      console.log(
        `[HEALTH-SPK][${moment().format("HH:mm")}] Scheduler processed ${result.summary.processedUnitCount} individual units, created ${result.summary.createdIndicationCount || result.summary.createdReportCount} indications.`
      );
    }

    return result;
  } catch (error) {
    console.error(
      `[${moment().format()}] Scheduler Error (HealthIndication):`,
      error
    );

    return {
      ran: false,
      reason: "ERROR",
      error: error.message,
    };
  }
}

module.exports = {
  DEFAULT_SETTING_ID,
  SETTINGS_TABLE,
  parseScheduleTimes,
  readHealthSchedulerSetting,
  runHealthIndicationScheduler,
  checkHealthIndicationScheduler,
};
