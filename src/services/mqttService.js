/**
 * MQTT Service - HiveMQ Connection
 * Menerima data sensor ayam dari broker MQTT dan menyimpan ke database
 * 
 * Logic:
 * - Jika data berubah -> simpan
 * - Jika data sama DAN < 30 menit sejak save terakhir -> skip
 * - Jika data sama TAPI >= 30 menit sejak save terakhir -> simpan (force save)
 */

const mqtt = require("mqtt");

// Import database model
const sequelize = require("../model/index");
const AyamSensorData = sequelize.AyamSensorData;

// Konfigurasi HiveMQ
const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || "66e902ef0191400bbe2d33639d2171d8.s1.eu.hivemq.cloud",
  port: parseInt(process.env.MQTT_PORT) || 8883,
  username: process.env.MQTT_USERNAME || "smartfarm",
  password: process.env.MQTT_PASSWORD || "Smartfarm123",
  topic: process.env.MQTT_TOPIC || "dht22/sensor",
};

// Force save interval: 30 menit dalam milliseconds
const FORCE_SAVE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Client MQTT & cache data terakhir
let client = null;
let lastSavedData = null;
let lastSavedTime = null; // Track waktu terakhir data disimpan

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
 * Cek apakah perlu force save (30 menit tanpa save)
 */
const shouldForceSave = () => {
  if (!lastSavedTime) return true; // Belum pernah save, force save
  const now = Date.now();
  const timeSinceLastSave = now - lastSavedTime;
  return timeSinceLastSave >= FORCE_SAVE_INTERVAL_MS;
};

/**
 * Simpan data ke database dengan validasi perubahan dan force save
 */
const saveIfChangedOrForce = async (data) => {
  // Validasi data
  if (data.temperature === undefined || data.humidity === undefined) {
    console.log(`[${getTimestamp()}] [MQTT] ⚠️ Data tidak valid, skip`);
    return false;
  }

  const dataIsSame = isSameData(data);
  const needForceSave = shouldForceSave();

  // Logic: simpan jika data berubah ATAU jika perlu force save
  if (dataIsSame && !needForceSave) {
    const minutesSinceLastSave = lastSavedTime 
      ? Math.floor((Date.now() - lastSavedTime) / 60000) 
      : 0;
    console.log(`[${getTimestamp()}] [MQTT] ⏭️ Data sama, skip save (${minutesSinceLastSave} menit sejak save terakhir, force save pada 30 menit)`);
    return false;
  }

  try {
    await AyamSensorData.create({
      temperature: data.temperature,
      humidity: data.humidity,
    });

    // Update cache
    lastSavedData = {
      temperature: data.temperature,
      humidity: data.humidity,
    };
    lastSavedTime = Date.now();

    const saveReason = dataIsSame ? "FORCE SAVE (30 menit)" : "DATA CHANGED";
    console.log(`[${getTimestamp()}] [MQTT] ✅ Saved [${saveReason}]: temp=${data.temperature}°C, hum=${data.humidity}%`);
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
      // Set lastSavedTime dari database record
      lastSavedTime = new Date(latest.createdAt).getTime();
      console.log(`[MQTT] Loaded last data from DB: temp=${latest.temperature}°C, hum=${latest.humidity}%`);
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
  console.log(`[${getTimestamp()}] [MQTT] Force save interval: 30 minutes`);

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
    await saveIfChangedOrForce(data);
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
