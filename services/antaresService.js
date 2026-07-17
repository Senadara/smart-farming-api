const axios = require("axios");
const moment = require("moment");
const { saveIotPayload } = require("../src/services/iotPayloadService");

const ANTARES_BASE_URL =
  process.env.ANTARES_BASE_URL || "https://platform.antares.id:8443";
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

const FORCE_SAVE_INTERVAL_MS = 10 * 60 * 1000;

let lastSavedTime = null;
let lastSavedData = null;

function parseSensorValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const cleanValue = String(value).replace(/['"]/g, "").trim();
  const parsed = Number.parseFloat(cleanValue);

  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeSensorData(rawData) {
  return {
    nitrogen: rawData.nitrogen,
    phosphor: rawData.phosphor,
    potassium: rawData.potassium,
    temperature: rawData.temperature !== null ? rawData.temperature / 10 : null,
    humidity: rawData.humidity !== null ? rawData.humidity / 10 : null,
    ec: rawData.ec !== null ? rawData.ec / 10 : null,
    ph: rawData.ph !== null ? rawData.ph / 100 : null,
  };
}

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

    const rawValue = response.data?.["m2m:cin"]?.con;
    const parsedValue = parseSensorValue(rawValue);

    console.log(`[Antares] ${sensorName}: raw="${rawValue}" -> parsed=${parsedValue}`);

    return { name: sensorName, value: parsedValue };
  } catch (error) {
    console.error(`[Antares] Error fetching ${sensorName}:`, error.message || error);
    return { name: sensorName, value: null };
  }
}

async function fetchAllSensorData() {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Fetching sensor data...`);

  const results = await Promise.all(
    Object.entries(getAntaresEndpoints()).map(([sensorName, url]) =>
      fetchSingleSensor(sensorName, url)
    )
  );

  return results.reduce((payload, result) => {
    payload[result.name] = result.value;
    return payload;
  }, {});
}

function isSameData(newData, existingData) {
  if (!existingData) return false;

  return ["nitrogen", "phosphor", "potassium", "temperature", "humidity", "ec", "ph"].every(
    (key) => newData[key] === existingData[key]
  );
}

function shouldForceSave() {
  if (!lastSavedTime) return true;
  return Date.now() - lastSavedTime >= FORCE_SAVE_INTERVAL_MS;
}

async function initLastSavedTime() {
  lastSavedTime = null;
  lastSavedData = null;
}

async function saveSensorDataIfChanged(sensorData) {
  try {
    const normalizedData = normalizeSensorData(sensorData);
    const dataIsSame = isSameData(normalizedData, lastSavedData);
    const needForceSave = shouldForceSave();

    if (dataIsSame && !needForceSave) {
      const minutesSinceLastSave = lastSavedTime
        ? Math.floor((Date.now() - lastSavedTime) / 60000)
        : 0;
      console.log(
        `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Data sama, skip save (${minutesSinceLastSave} menit sejak save terakhir).`
      );
      return false;
    }

    const result = await saveIotPayload({
      deviceCode: process.env.ANTARES_DEVICE_CODE || null,
      payload: normalizedData,
      timestamp: new Date(),
      source: "antares",
    });

    if (result.inserted <= 0) {
      console.log(
        `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] No IoT rows saved: ${result.reason || "mapping not matched"}`
      );
      return false;
    }

    lastSavedTime = Date.now();
    lastSavedData = normalizedData;

    const saveReason = dataIsSame ? "FORCE SAVE" : "DATA CHANGED";
    console.log(
      `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Saved to iot_sensor_data [${saveReason}], inserted=${result.inserted}.`
    );
    return true;
  } catch (error) {
    console.error(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Error saving sensor data:`, error);
    return false;
  }
}

function hasNullValues(sensorData) {
  return ["nitrogen", "phosphor", "potassium", "temperature", "humidity", "ec", "ph"].some(
    (key) => sensorData[key] === null || sensorData[key] === undefined
  );
}

async function fetchAndSaveSensorData(retryCount = 0) {
  const MAX_RETRIES = 3;

  try {
    const sensorData = await fetchAllSensorData();

    if (hasNullValues(sensorData)) {
      if (retryCount < MAX_RETRIES) {
        console.log(
          `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Data contains null values, retrying in 10 seconds (${retryCount + 1}/${MAX_RETRIES}).`
        );
        setTimeout(() => fetchAndSaveSensorData(retryCount + 1), 10000);
        return;
      }

      console.log(
        `[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Max retries reached, skipping save.`
      );
      return;
    }

    await saveSensorDataIfChanged(sensorData);
  } catch (error) {
    console.error(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] [Antares] Scheduler error:`, error);
  }
}

async function getLatestSensorData() {
  return lastSavedData
    ? {
        ...lastSavedData,
        createdAt: lastSavedTime ? new Date(lastSavedTime) : null,
      }
    : null;
}

module.exports = {
  fetchAndSaveSensorData,
  getLatestSensorData,
  parseSensorValue,
  fetchAllSensorData,
  saveSensorDataIfChanged,
  initLastSavedTime,
};
