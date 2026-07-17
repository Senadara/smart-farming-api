const mqtt = require("mqtt");
const { saveIotPayload } = require("./iotPayloadService");

const MQTT_CONFIG = {
  host:
    process.env.MQTT_HOST ||
    "66e902ef0191400bbe2d33639d2171d8.s1.eu.hivemq.cloud",
  port: parseInt(process.env.MQTT_PORT) || 8883,
  username: process.env.MQTT_USERNAME || "smartfarm",
  password: process.env.MQTT_PASSWORD || "Smartfarm123",
  topic: process.env.MQTT_TOPIC || "dht22/sensor",
};

const FORCE_SAVE_INTERVAL_MS = 30 * 60 * 1000;

let client = null;
let lastSavedData = null;
let lastSavedTime = null;

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

const isSameData = (newData) => {
  if (!lastSavedData) return false;
  return (
    newData.temperature === lastSavedData.temperature &&
    newData.humidity === lastSavedData.humidity
  );
};

const shouldForceSave = () => {
  if (!lastSavedTime) return true;
  return Date.now() - lastSavedTime >= FORCE_SAVE_INTERVAL_MS;
};

const saveIfChangedOrForce = async (data) => {
  if (data.temperature === undefined || data.humidity === undefined) {
    console.log(`[${getTimestamp()}] [MQTT] Data tidak valid, skip`);
    return false;
  }

  const dataIsSame = isSameData(data);
  const needForceSave = shouldForceSave();

  if (dataIsSame && !needForceSave) {
    const minutesSinceLastSave = lastSavedTime
      ? Math.floor((Date.now() - lastSavedTime) / 60000)
      : 0;
    console.log(
      `[${getTimestamp()}] [MQTT] Data sama, skip save (${minutesSinceLastSave} menit sejak save terakhir).`
    );
    return false;
  }

  try {
    const result = await saveIotPayload({
      deviceCode: process.env.MQTT_DEVICE_CODE || null,
      payload: data,
      timestamp: new Date(),
      source: "mqtt",
    });

    if (result.inserted <= 0) {
      console.log(
        `[${getTimestamp()}] [MQTT] No IoT rows saved: ${result.reason || "mapping not matched"}`
      );
      return false;
    }

    lastSavedData = {
      temperature: data.temperature,
      humidity: data.humidity,
    };
    lastSavedTime = Date.now();

    const saveReason = dataIsSame ? "FORCE SAVE" : "DATA CHANGED";
    console.log(
      `[${getTimestamp()}] [MQTT] Saved [${saveReason}]: temp=${data.temperature}, hum=${data.humidity}`
    );
    return true;
  } catch (error) {
    console.error(`[${getTimestamp()}] [MQTT] Save error: ${error.message}`);
    return false;
  }
};

const initLastSavedData = async () => {
  lastSavedData = null;
  lastSavedTime = null;
};

const startMqttClient = async () => {
  await initLastSavedData();

  const brokerUrl = `mqtts://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}`;

  console.log(`[${getTimestamp()}] [MQTT] Connecting to ${MQTT_CONFIG.host}...`);
  console.log(`[${getTimestamp()}] [MQTT] Force save interval: 30 minutes`);

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
      `[${getTimestamp()}] [MQTT] Received: temp=${data.temperature}, hum=${data.humidity}`
    );
    await saveIfChangedOrForce(data);
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
