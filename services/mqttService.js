/**
 * MQTT Service - HiveMQ Connection
 * Menerima data sensor dari broker MQTT dan meneruskannya ke service IoT.
 */

const mqtt = require("mqtt");

const { saveIotPayload } = require("../src/services/iotPayloadService");

const MQTT_CONFIG = {
  host: process.env.MQTT_HOST || "d93d544664ee45ba901f7646de05c73b.s1.eu.hivemq.cloud",
  port: parseInt(process.env.MQTT_PORT, 10) || 8883,
  username: process.env.MQTT_USERNAME || "Reinaldi49",
  password: process.env.MQTT_PASSWORD || "Reinaldi49",
  topic: process.env.MQTT_TOPIC || "dht22/sensor",
};

let client = null;

const getTimestamp = () =>
  new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const parsePayload = (payload) => {
  try {
    return JSON.parse(payload.toString());
  } catch (error) {
    return null;
  }
};

const normalizeSensorData = (rawData) => ({
  temperature:
    rawData.temperature !== null && rawData.temperature !== undefined
      ? rawData.temperature / 10
      : null,
  humidity:
    rawData.humidity !== null && rawData.humidity !== undefined
      ? rawData.humidity / 10
      : null,
});

const saveMqttPayload = async (data) => {
  if (
    data.temperature === undefined ||
    data.temperature === null ||
    data.humidity === undefined ||
    data.humidity === null
  ) {
    console.log(`[${getTimestamp()}] [MQTT] Data null/undefined, skip save`);
    return false;
  }

  const normalizedData = normalizeSensorData(data);

  try {
    const result = await saveIotPayload({
      deviceCode: process.env.MQTT_DEVICE_CODE || null,
      payload: normalizedData,
      timestamp: new Date(),
      source: "mqtt",
    });

    if (result.inserted <= 0) {
      if (result.suppressed > 0) {
        console.log(
          `[${getTimestamp()}] [MQTT] Data sama dan belum 10 menit, tidak disimpan ulang.`
        );
        return false;
      }

      console.log(
        `[${getTimestamp()}] [MQTT] No IoT rows saved: ${
          result.reason || "mapping not matched"
        }`
      );
      return false;
    }

    console.log(
      `[${getTimestamp()}] [MQTT] Saved: temp=${normalizedData.temperature}, hum=${normalizedData.humidity}`
    );
    return true;
  } catch (error) {
    console.error(`[${getTimestamp()}] [MQTT] Save error: ${error.message}`);
    return false;
  }
};

const startMqttClient = async () => {
  const brokerUrl = `mqtts://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;

  console.log(`[${getTimestamp()}] [MQTT] Connecting to ${MQTT_CONFIG.host}...`);
  console.log(`[${getTimestamp()}] [MQTT] History save rule: changed value or every 10 minutes`);

  client = mqtt.connect(brokerUrl, {
    username: MQTT_CONFIG.username,
    password: MQTT_CONFIG.password,
    protocol: "mqtts",
    rejectUnauthorized: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    keepalive: 60,
  });

  client.on("connect", () => {
    console.log(`[${getTimestamp()}] [MQTT] Connected to HiveMQ`);

    client.subscribe(MQTT_CONFIG.topic, { qos: 1 }, (err) => {
      if (err) {
        console.error(`[${getTimestamp()}] [MQTT] Subscribe failed: ${err.message}`);
      } else {
        console.log(`[${getTimestamp()}] [MQTT] Subscribed to: ${MQTT_CONFIG.topic}`);
      }
    });
  });

  client.on("message", async (topic, payload) => {
    const data = parsePayload(payload);

    if (!data) {
      console.log(`[${getTimestamp()}] [MQTT] Invalid JSON payload`);
      return;
    }

    console.log(
      `[${getTimestamp()}] [MQTT] Received topic=${topic}: temp=${data.temperature}, hum=${data.humidity}`
    );
    await saveMqttPayload(data);
  });

  client.on("error", (err) => {
    console.error(`[${getTimestamp()}] [MQTT] Error: ${err.message}`);
  });

  client.on("reconnect", () => {
    console.log(`[${getTimestamp()}] [MQTT] Reconnecting...`);
  });

  return client;
};

const stopMqttClient = () => {
  if (client) {
    client.end(true, () => {
      console.log(`[${getTimestamp()}] [MQTT] Disconnected`);
    });
    client = null;
  }
};

const getMqttClient = () => client;

module.exports = {
  startMqttClient,
  stopMqttClient,
  getMqttClient,
};
