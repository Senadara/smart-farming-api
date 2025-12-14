/**
 * MQTT Service - HiveMQ Connection
 * Menerima data sensor ayam dari broker MQTT dan menyimpan ke database
 */

const mqtt = require("mqtt");

// Import database model
const sequelize = require("../src/model/index");
const AyamSensorData = sequelize.AyamSensorData;

// Konfigurasi HiveMQ
const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || "d93d544664ee45ba901f7646de05c73b.s1.eu.hivemq.cloud",
  port: parseInt(process.env.MQTT_PORT) || 8883,
  username: process.env.MQTT_USERNAME || "Reinaldi49",
  password: process.env.MQTT_PASSWORD || "Reinaldi49",
  topic: process.env.MQTT_TOPIC || "dht22/sensor",
};

// Client MQTT & cache data terakhir
let client = null;
let lastSavedData = null;

/**
 * Format timestamp untuk logging
 */
const getTimestamp = () => {
  return new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * Parse payload MQTT - coba sebagai JSON
 */
const parsePayload = (payload) => {
  try {
    return JSON.parse(payload.toString());
  } catch (e) {
    return null;
  }
};

/**
 * Normalize sensor data before saving to database
 * Conversions:
 * - temperature = raw_value / 10 (°C)
 * - humidity = raw_value / 10 (%)
 * @param {Object} rawData - Raw sensor data from MQTT
 * @returns {Object} - Normalized sensor data
 */
const normalizeSensorData = (rawData) => {
  return {
    temperature: rawData.temperature !== null && rawData.temperature !== undefined 
      ? rawData.temperature / 10 
      : null,
    humidity: rawData.humidity !== null && rawData.humidity !== undefined 
      ? rawData.humidity / 10 
      : null,
  };
};

/**
 * Cek apakah data baru sama dengan data terakhir yang disimpan
 */
const isSameData = (newData) => {
  if (!lastSavedData) return false;
  return (
    newData.temperature === lastSavedData.temperature &&
    newData.humidity === lastSavedData.humidity
  );
};

/**
 * Simpan data ke database jika ada perubahan dan data valid (tidak null)
 * Data dinormalisasi sebelum disimpan (temperature/10, humidity/10)
 */
const saveIfChanged = async (data) => {
  // Validasi data - tolak jika null atau undefined
  if (
    data.temperature === undefined || data.temperature === null ||
    data.humidity === undefined || data.humidity === null
  ) {
    console.log(`[${getTimestamp()}] [MQTT] ⚠️ Data null/undefined, skip save`);
    return false;
  }

  // Normalize data before processing
  const normalizedData = normalizeSensorData(data);

  // Cek apakah sama dengan data terakhir (gunakan data yang sudah dinormalisasi)
  if (isSameData(normalizedData)) {
    console.log(`[${getTimestamp()}] [MQTT] ⏭️ Data sama, skip save`);
    return false;
  }

  try {
    await AyamSensorData.create({
      temperature: normalizedData.temperature,
      humidity: normalizedData.humidity,
    });

    // Update cache dengan data yang sudah dinormalisasi
    lastSavedData = {
      temperature: normalizedData.temperature,
      humidity: normalizedData.humidity,
    };

    console.log(`[${getTimestamp()}] [MQTT] ✅ Saved (normalized): temp=${normalizedData.temperature}°C, hum=${normalizedData.humidity}%`);
    return true;
  } catch (error) {
    console.error(`[${getTimestamp()}] [MQTT] ❌ Save error: ${error.message}`);
    return false;
  }
};

/**
 * Load data terakhir dari database untuk inisialisasi cache
 */
const initLastSavedData = async () => {
  try {
    const latest = await AyamSensorData.findOne({
      where: { isDeleted: false },
      order: [["createdAt", "DESC"]],
    });
    if (latest) {
      lastSavedData = {
        temperature: latest.temperature,
        humidity: latest.humidity,
      };
    }
  } catch (error) {
    console.error(`[MQTT] Error loading last data: ${error.message}`);
  }
};

/**
 * Inisialisasi dan start MQTT client
 */
const startMqttClient = async () => {
  // Load data terakhir dari DB untuk validasi duplikat
  await initLastSavedData();

  const brokerUrl = `mqtts://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;

  console.log(`[${getTimestamp()}] [MQTT] Connecting to ${MQTT_CONFIG.host}...`);

  const options = {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    protocol: "mqtts",
    rejectUnauthorized: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
  };

  client = mqtt.connect(brokerUrl, options);

  // Event: Berhasil terhubung
  client.on("connect", () => {
    console.log(`[${getTimestamp()}] [MQTT] ✅ Connected to HiveMQ`);

    client.subscribe(MQTT_CONFIG.topic, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[${getTimestamp()}] [MQTT] ❌ Subscribe failed: ${err.message}`);
      } else {
        console.log(`[${getTimestamp()}] [MQTT] 📡 Subscribed to: ${MQTT_CONFIG.topic}`);
      }
    });
  });

  // Event: Menerima pesan
  client.on("message", async (topic, payload) => {
    const data = parsePayload(payload);

    if (!data) {
      console.log(`[${getTimestamp()}] [MQTT] ⚠️ Invalid JSON payload`);
      return;
    }

    console.log(`[${getTimestamp()}] [MQTT] 📩 Received: temp=${data.temperature}°C, hum=${data.humidity}%`);
    await saveIfChanged(data);
  });

  // Event: Error
  client.on("error", (err) => {
    console.error(`[${getTimestamp()}] [MQTT] ❌ Error: ${err.message}`);
  });

  // Event: Reconnecting
  client.on("reconnect", () => {
    console.log(`[${getTimestamp()}] [MQTT] 🔄 Reconnecting...`);
  });

  return client;
};

/**
 * Stop MQTT client
 */
const stopMqttClient = () => {
  if (client) {
    client.end(true, () => {
      console.log(`[${getTimestamp()}] [MQTT] 🛑 Disconnected`);
    });
    client = null;
  }
};

/**
 * Get MQTT client instance
 */
const getMqttClient = () => client;

module.exports = {
  startMqttClient,
  stopMqttClient,
  getMqttClient,
};
