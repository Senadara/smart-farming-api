const express = require("express");
const {
  sendNotificationToSingleUserById,
  sendNotificationToTarget,
} = require("../../services/notificationService");

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

module.exports = router;
