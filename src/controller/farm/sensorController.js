const { getLatestSensorData } = require("../../../services/antaresService");

/**
 * Get the latest sensor data
 * GET /api/sensors/latest
 */
async function getLatest(req, res) {
  try {
    const latestData = await getLatestSensorData();

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: "No sensor data available",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Latest sensor data retrieved successfully",
      data: {
        nitrogen: latestData.nitrogen,
        phosphor: latestData.phosphor,
        potassium: latestData.potassium,
        temperature: latestData.temperature,
        humidity: latestData.humidity,
        ec: latestData.ec,
        ph: latestData.ph,
        createdAt: latestData.createdAt,
      },
    });
  } catch (error) {
    console.error("[SensorController] Error getting latest sensor data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sensor data",
      error: error.message,
    });
  }
}

module.exports = {
  getLatest,
};
