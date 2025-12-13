const axios = require("axios");
const moment = require("moment");
const sequelize = require("../src/model/index");
const SensorData = sequelize.SensorData;

// Antares API Configuration
const ANTARES_BASE_URL = process.env.ANTARES_BASE_URL || "https://platform.antares.id:8443";
const ANTARES_APP_NAME = process.env.ANTARES_APP_NAME || "interest";
const getAntaresEndpoints = () => ({
  nitrogen: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/Nitrogen/la`,
  phosphor: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/phospor/la`,
  potassium: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/pota/la`,
  temperature: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/temp/la`,
  humidity: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/humidity/la`,
  ec: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/EC/la`,
  ph: `${ANTARES_BASE_URL}/~/antares-cse/antares-id/${ANTARES_APP_NAME}/ph/la`,
});

/**
 * Parse sensor value from Antares response
 * Handles values like "'2'" -> 2 (removes single quotes and converts to number)
 * @param {string} value - Raw value from Antares con field
 * @returns {number|null} - Parsed number or null if invalid
 */
function parseSensorValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  // Convert to string and remove single/double quotes
  let cleanValue = String(value).replace(/['"]/g, "").trim();

  // Convert to float
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Fetch single sensor data from Antares endpoint
 * @param {string} sensorName - Name of the sensor
 * @param {string} url - Antares endpoint URL
 * @returns {Promise<{name: string, value: number|null}>}
 */
async function fetchSingleSensor(sensorName, url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "X-M2M-Origin": process.env.ANTARES_ACCESS_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    });

    // Parse oneM2M format: data['m2m:cin']['con']
    const rawValue = response.data?.["m2m:cin"]?.con;
    const parsedValue = parseSensorValue(rawValue);

    console.log(
      `[Antares] ${sensorName}: raw="${rawValue}" -> parsed=${parsedValue}`
    );

    return { name: sensorName, value: parsedValue };
  } catch (error) {
    console.error(
      `[Antares] Error fetching ${sensorName}:`,
      error.message || error
    );
    return { name: sensorName, value: null };
  }
}

/**
 * Fetch all sensor data from Antares in parallel
 * @returns {Promise<Object>} - Object with all sensor values
 */
async function fetchAllSensorData() {
  console.log(
    `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Fetching sensor data...`
  );

  // Create array of fetch promises
  const fetchPromises = Object.entries(getAntaresEndpoints()).map(
    ([sensorName, url]) => fetchSingleSensor(sensorName, url)
  );

  // Execute all fetches in parallel
  const results = await Promise.all(fetchPromises);

  // Convert array of results to object
  const sensorData = {};
  for (const result of results) {
    sensorData[result.name] = result.value;
  }

  return sensorData;
}

/**
 * Compare two sensor data objects to check if values are the same
 * @param {Object} newData - New sensor data from Antares
 * @param {Object} existingData - Existing data from database
 * @returns {boolean} - True if data is the same
 */
function isSameData(newData, existingData) {
  if (!existingData) return false;

  const sensorKeys = [
    "nitrogen",
    "phosphor",
    "potassium",
    "temperature",
    "humidity",
    "ec",
    "ph",
  ];

  for (const key of sensorKeys) {
    if (newData[key] !== existingData[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Save sensor data to database if values have changed
 * @param {Object} sensorData - Sensor data to save
 * @returns {Promise<boolean>} - True if data was saved, false if skipped
 */
async function saveSensorDataIfChanged(sensorData) {
  try {
    // Get the latest record from database
    const latestRecord = await SensorData.findOne({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
    });

    // Compare with new data
    if (isSameData(sensorData, latestRecord)) {
      console.log(
        `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] No change detected, skipping insert`
      );
      return false;
    }

    // Insert new record
    await SensorData.create({
      nitrogen: sensorData.nitrogen,
      phosphor: sensorData.phosphor,
      potassium: sensorData.potassium,
      temperature: sensorData.temperature,
      humidity: sensorData.humidity,
      ec: sensorData.ec,
      ph: sensorData.ph,
    });

    console.log(
      `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] New sensor data saved`
    );
    return true;
  } catch (error) {
    console.error(
      `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Error saving sensor data:`,
      error
    );
    return false;
  }
}

/**
 * Check if sensor data contains any null values
 * @param {Object} sensorData - Sensor data to check
 * @returns {boolean} - True if any value is null
 */
function hasNullValues(sensorData) {
  const keys = ["nitrogen", "phosphor", "potassium", "temperature", "humidity", "ec", "ph"];
  return keys.some(key => sensorData[key] === null || sensorData[key] === undefined);
}

/**
 * Main function to fetch and save sensor data
 * Called by the scheduler
 * If data contains null values, retry after 10 seconds
 */
async function fetchAndSaveSensorData(retryCount = 0) {
  const MAX_RETRIES = 3;
  
  try {
    const sensorData = await fetchAllSensorData();
    
    // Validasi: jika ada null, retry setelah 10 detik
    if (hasNullValues(sensorData)) {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] ⚠️ Data contains null values, retrying in 10 seconds... (attempt ${retryCount + 1}/${MAX_RETRIES})`
        );
        setTimeout(() => fetchAndSaveSensorData(retryCount + 1), 10000);
        return;
      } else {
        console.log(
          `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] ❌ Max retries reached, skipping save (data still contains null)`
        );
        return;
      }
    }
    
    await saveSensorDataIfChanged(sensorData);
  } catch (error) {
    console.error(
      `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Scheduler error:`,
      error
    );
  }
}

/**
 * Get the latest sensor data from database
 * @returns {Promise<Object|null>} - Latest sensor data or null
 */
async function getLatestSensorData() {
  const latestRecord = await SensorData.findOne({
    where: { isDeleted: false },
    order: [["createdAt", "DESC"]],
    attributes: [
      "nitrogen",
      "phosphor",
      "potassium",
      "temperature",
      "humidity",
      "ec",
      "ph",
      "createdAt",
    ],
  });

  return latestRecord;
}

module.exports = {
  fetchAndSaveSensorData,
  getLatestSensorData,
  parseSensorValue,
  fetchAllSensorData,
  saveSensorDataIfChanged,
};
