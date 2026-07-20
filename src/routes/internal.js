const express = require("express");
const {
  sendNotificationToSingleUserById,
  sendNotificationToTarget,
} = require("../../services/notificationService");
const {
  getEggProductionDropContext,
  getIndividualEggProductivityContext,
  createHealthIndicationAlert,
  createAutomaticHealthIndication,
} = require("../services/eggProductionHealthService");
const {
  readHealthSchedulerSetting,
  runHealthIndicationScheduler,
} = require("../../services/healthIndicationSchedulerService");

const router = express.Router();

function validateInternalToken(req, res, next) {
  const expectedToken =
    process.env.SPK_INTERNAL_NOTIFICATION_TOKEN || process.env.INTERNAL_API_TOKEN;

  if (!expectedToken) {
    return next();
  }

  const providedToken = req.headers["x-internal-token"];
  if (providedToken !== expectedToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized internal notification request",
    });
  }

  next();
}

function normalizeNotificationTarget(body = {}) {
  if (body.target && typeof body.target === "object") {
    return body.target;
  }

  if (body.userId) {
    return { userId: body.userId };
  }

  if (body.role) {
    return { role: body.role };
  }

  if (body.all === true) {
    return { all: true };
  }

  return null;
}

function notificationResponseStatus(result) {
  return result?.success ? 200 : 202;
}

router.post("/notifications/mobile", validateInternalToken, async (req, res) => {
  try {
    const { title, body, data = {} } = req.body || {};
    const target = normalizeNotificationTarget(req.body);

    if (!target || !title || !body) {
      return res.status(422).json({
        success: false,
        message: "target, title, and body are required",
      });
    }

    const result = await sendNotificationToTarget(target, title, body, {
      ...data,
      source: data.source || "laravel",
    });

    return res.status(notificationResponseStatus(result)).json({
      success: Boolean(result.success),
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send mobile notification",
      error: error.message,
    });
  }
});

router.post("/notifications/spk-alert", validateInternalToken, async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body || {};

    if (!userId || !title || !body) {
      return res.status(422).json({
        success: false,
        message: "userId, title, and body are required",
      });
    }

    const result = await sendNotificationToSingleUserById(
      userId,
      title,
      body,
      {
        ...data,
        source: data.source || "laravel-spk",
        action: data.action || "OPEN_BACKOFFICE_URL",
      }
    );

    return res.status(notificationResponseStatus(result)).json({
      success: Boolean(result.success),
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to send SPK alert notification",
      error: error.message,
    });
  }
});

router.get("/spk/egg-production-drop", validateInternalToken, async (req, res) => {
  try {
    const context = await getEggProductionDropContext({
      unitBudidayaId: req.query.unitBudidayaId,
      days: req.query.days,
      thresholdPercent: req.query.thresholdPercent,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    return res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/spk/individual-egg-productivity", validateInternalToken, async (req, res) => {
  try {
    const context = await getIndividualEggProductivityContext({
      unitBudidayaId: req.query.unitBudidayaId,
      days: req.query.days,
      thresholdPercent: req.query.thresholdPercent,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sort: req.query.sort,
      sortBy: req.query.sortBy,
      direction: req.query.direction,
    });

    return res.status(200).json({
      success: true,
      data: context,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/spk/health-indications", validateInternalToken, async (req, res) => {
  try {
    const result = await createAutomaticHealthIndication({
      unitBudidayaId: req.body.unitBudidayaId,
      days: req.body.days,
      thresholdPercent: req.body.thresholdPercent,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      analysisMode: req.body.analysisMode,
      sort: req.body.sort,
      sortBy: req.body.sortBy,
      direction: req.body.direction,
      userId: req.body.userId,
      source: req.body.source || "laravel-spk",
      notify: req.body.notify !== false,
      targetRole: req.body.targetRole || "petugas",
      force: req.body.force === true,
    });

    return res.status(result.created ? 201 : 200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/spk/health-indication-alerts", validateInternalToken, async (req, res) => {
  try {
    const result = await createHealthIndicationAlert({
      unitBudidayaId: req.body.unitBudidayaId,
      days: req.body.days,
      thresholdPercent: req.body.thresholdPercent,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      analysisMode: req.body.analysisMode,
      sort: req.body.sort,
      sortBy: req.body.sortBy,
      direction: req.body.direction,
      source: req.body.source || "laravel-spk",
      notify: req.body.notify !== false,
      targetRole: req.body.targetRole || "petugas",
      force: req.body.force === true,
    });

    return res.status(result.created ? 201 : 200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/spk/health-scheduler", validateInternalToken, async (req, res) => {
  try {
    const setting = await readHealthSchedulerSetting();

    return res.status(200).json({
      success: true,
      data: setting,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

router.post("/spk/health-scheduler/run", validateInternalToken, async (req, res) => {
  try {
    const result = await runHealthIndicationScheduler({
      manual: true,
      source: req.body?.source || "laravel-health-scheduler-manual",
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
