const { Op } = require("sequelize");
const sequelize = require("../model/index");

const IotDevice = sequelize.IotDevice;
const IotParameter = sequelize.IotParameter;
const IotParameterMapping = sequelize.IotParameterMapping;
const IotSensorData = sequelize.IotSensorData;
const IotDeviceLog = sequelize.IotDeviceLog;

const MQTT_HISTORY_SAVE_INTERVAL_MS = 10 * 60 * 1000;
const VALUE_EPSILON = 0.000001;

function getByPath(payload, path) {
  if (!path) return undefined;
  if (!payload || typeof payload !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(payload, path)) return payload[path];

  return String(path)
    .split(".")
    .reduce((current, segment) => {
      if (current && typeof current === "object") {
        return current[segment];
      }
      return undefined;
    }, payload);
}

function parseAntaresPayload(payload) {
  const con = payload?.["m2m:cin"]?.con;
  if (con === undefined) return payload;

  if (typeof con === "string") {
    try {
      return JSON.parse(con);
    } catch (error) {
      const cleaned = con.replace(/['"]/g, "").trim();
      return Number.isFinite(Number(cleaned)) ? Number(cleaned) : cleaned;
    }
  }

  return con;
}

async function createLog(deviceId, logType, message, transaction) {
  if (!IotDeviceLog || !deviceId) return null;
  return IotDeviceLog.create(
    {
      deviceId,
      logType,
      message,
    },
    { transaction }
  );
}

async function markDeviceOnline(device, timestamp, transaction) {
  const payload = {
    lastSeenAt: timestamp,
    missedCount: 0,
  };

  if (device.status !== "maintenance") {
    payload.status = "active";
  }

  await device.update(payload, { transaction });
}

async function markDeviceMiss(device, reason, transaction) {
  if (!device || device.status === "maintenance") return;

  const missedCount = Number(device.missedCount || 0) + 1;
  const threshold = Math.max(1, Number(device.offlineAfterMisses || 3));

  await device.update(
    {
      missedCount,
      lastMissedAt: new Date(),
      status: missedCount >= threshold ? "inactive" : device.status,
    },
    { transaction }
  );

  await createLog(
    device.id,
    missedCount >= threshold ? "WARNING" : "INFO",
    `${reason} Miss ${missedCount}/${threshold}.`,
    transaction
  );
}

function isMqttSource(source) {
  return String(source || "").trim().toLowerCase().startsWith("mqtt");
}

function timestampMs(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  return Number.isFinite(time) ? time : null;
}

async function shouldPersistReading({
  deviceId,
  parameterId,
  value,
  timestamp,
  source,
  transaction,
}) {
  if (!isMqttSource(source)) {
    return true;
  }

  const latest = await IotSensorData.findOne({
    where: {
      deviceId,
      parameterId,
      [Op.or]: [{ isDeleted: false }, { isDeleted: null }],
    },
    order: [
      ["sensorTimestamp", "DESC"],
      ["createdAt", "DESC"],
    ],
    transaction,
  });

  if (!latest) {
    return true;
  }

  if (Math.abs(Number(latest.value) - value) > VALUE_EPSILON) {
    return true;
  }

  const lastSavedAt = timestampMs(latest.sensorTimestamp || latest.createdAt);
  const currentAt = timestampMs(timestamp) || Date.now();

  if (!lastSavedAt) {
    return true;
  }

  return currentAt - lastSavedAt >= MQTT_HISTORY_SAVE_INTERVAL_MS;
}

async function loadDevice(deviceCode, payload) {
  const include = [
    {
      model: IotParameterMapping,
      as: "parameterMappings",
      include: [{ model: IotParameter, as: "parameter" }],
    },
  ];

  if (deviceCode) {
    return IotDevice.findOne({
      where: { deviceCode },
      include,
    });
  }

  const candidates = await IotDevice.findAll({
    where: { status: { [Op.ne]: "maintenance" } },
    include,
  });

  const matching = candidates.filter((device) =>
    (device.parameterMappings || []).some((mapping) => {
      const value = getByPath(payload, mapping.payloadKey);
      return value !== undefined && value !== null;
    })
  );

  return matching.length === 1 ? matching[0] : null;
}

async function saveIotPayload({ deviceCode, payload, timestamp = new Date(), source = "node-api" }) {
  if (!IotDevice || !IotSensorData || !IotParameterMapping || !IotParameter) {
    return {
      inserted: 0,
      skipped: 0,
      reason: "Model IoT belum tersedia.",
    };
  }

  const normalizedPayload = parseAntaresPayload(payload);
  const device = await loadDevice(deviceCode, normalizedPayload);

  if (!device) {
    return {
      inserted: 0,
      skipped: 0,
      reason: deviceCode
        ? `Device ${deviceCode} tidak ditemukan.`
        : "Device tidak bisa diinfer dari payload. Isi deviceCode atau mapping payloadKey.",
    };
  }

  const transaction = await sequelize.sequelize.transaction();

  try {
    const rows = [];
    let skipped = 0;
    let suppressed = 0;

    for (const mapping of device.parameterMappings || []) {
      const rawValue =
        typeof normalizedPayload === "object"
          ? getByPath(normalizedPayload, mapping.payloadKey)
          : normalizedPayload;
      const value = Number(rawValue);

      if (!Number.isFinite(value)) {
        skipped += 1;
        continue;
      }

      const shouldPersist = await shouldPersistReading({
        deviceId: device.id,
        parameterId: mapping.parameterId,
        value,
        timestamp,
        source,
        transaction,
      });

      if (!shouldPersist) {
        skipped += 1;
        suppressed += 1;
        continue;
      }

      rows.push({
        deviceId: device.id,
        parameterId: mapping.parameterId,
        value,
        sensorTimestamp: timestamp,
      });
    }

    if (rows.length > 0) {
      await IotSensorData.bulkCreate(rows, { transaction });
      await markDeviceOnline(device, timestamp, transaction);
      await createLog(
        device.id,
        "INFO",
        `[${source}] ${rows.length} parameter sensor tercatat.`,
        transaction
      );
    } else if (suppressed > 0) {
      await markDeviceOnline(device, timestamp, transaction);
    } else {
      await markDeviceMiss(
        device,
        `[${source}] Payload diterima tetapi tidak cocok dengan mapping parameter.`,
        transaction
      );
    }

    await transaction.commit();

    return {
      inserted: rows.length,
      skipped,
      suppressed,
      deviceCode: device.deviceCode,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  saveIotPayload,
};
