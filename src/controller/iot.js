const { saveIotPayload } = require("../services/iotPayloadService");

async function receiveWebhook(req, res) {
  try {
    const result = await saveIotPayload({
      deviceCode: req.params.deviceCode,
      payload: req.body,
      timestamp: req.body?.sensorTimestamp ? new Date(req.body.sensorTimestamp) : new Date(),
      source: "node-webhook",
    });

    if (result.reason) {
      return res.status(404).json({
        status: false,
        message: result.reason,
        data: result,
      });
    }

    return res.status(201).json({
      status: true,
      message: "Data IoT diterima.",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

module.exports = {
  receiveWebhook,
};
