const { getLatestSensorData } = require("../../../services/antaresService");
const sequelize = require("../../model/index");
const SensorData = sequelize.SensorData;

/**
 * Get the latest sensor data
 * GET /api/farm/melon/latest
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

/**
 * Get sensor data history with pagination
 * GET /api/farm/melon/history
 */
async function getHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await SensorData.findAndCountAll({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "nitrogen",
        "phosphor",
        "potassium",
        "temperature",
        "humidity",
        "ec",
        "ph",
        "createdAt",
      ],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Sensor data history retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("[SensorController] Error getting sensor history:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve sensor history",
      error: error.message,
    });
  }
}

module.exports = {
  getLatest,
  getHistory,
};

