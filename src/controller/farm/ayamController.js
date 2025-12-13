const sequelize = require("../../model/index");
const AyamSensorData = sequelize.AyamSensorData;

/**
 * Get the latest ayam sensor data
 * GET /api/ayam/latest
 */
async function getLatest(req, res) {
  try {
    const latestData = await AyamSensorData.findOne({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "temperature", "humidity", "createdAt"],
    });

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: "No ayam sensor data available",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Latest ayam sensor data retrieved successfully",
      data: latestData,
    });
  } catch (error) {
    console.error("[AyamController] Error getting latest sensor data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ayam sensor data",
      error: error.message,
    });
  }
}

/**
 * Get ayam sensor data history with pagination
 * GET /api/ayam/history
 */
async function getHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await AyamSensorData.findAndCountAll({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
      attributes: ["id", "temperature", "humidity", "createdAt"],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      message: "Ayam sensor data history retrieved successfully",
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("[AyamController] Error getting sensor history:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ayam sensor history",
      error: error.message,
    });
  }
}

module.exports = {
  getLatest,
  getHistory,
};
