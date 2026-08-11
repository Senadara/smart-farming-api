jest.mock("../../../model/index", () => ({
  IotDevice: {
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
  IotParameter: {},
  IotParameterMapping: {},
  IotSensorData: {
    findOne: jest.fn(),
    bulkCreate: jest.fn(),
  },
  IotDeviceLog: {
    create: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(),
  },
}));

const db = require("../../../model/index");
const { saveIotPayload } = require("../../../services/iotPayloadService");

describe("iotPayloadService MQTT history rule", () => {
  let transaction;
  let device;

  beforeEach(() => {
    jest.clearAllMocks();

    transaction = {
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    };

    device = {
      id: "device-1",
      deviceCode: "kandang-a-01",
      status: "active",
      parameterMappings: [
        {
          parameterId: "param-temp",
          payloadKey: "temperature",
        },
      ],
      update: jest.fn().mockResolvedValue(),
    };

    db.sequelize.transaction.mockResolvedValue(transaction);
    db.IotDevice.findOne.mockResolvedValue(device);
    db.IotSensorData.bulkCreate.mockResolvedValue([]);
    db.IotDeviceLog.create.mockResolvedValue({});
  });

  it("does not insert unchanged MQTT data before 10 minutes", async () => {
    db.IotSensorData.findOne.mockResolvedValue({
      value: 26,
      sensorTimestamp: new Date("2026-07-26T10:00:00.000Z"),
    });

    const result = await saveIotPayload({
      deviceCode: "kandang-a-01",
      payload: { temperature: 26 },
      timestamp: new Date("2026-07-26T10:09:59.000Z"),
      source: "mqtt",
    });

    expect(result.inserted).toBe(0);
    expect(result.suppressed).toBe(1);
    expect(result.skipped).toBe(1);
    expect(db.IotSensorData.bulkCreate).not.toHaveBeenCalled();
    expect(device.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        missedCount: 0,
      }),
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("inserts unchanged MQTT data again after 10 minutes", async () => {
    db.IotSensorData.findOne.mockResolvedValue({
      value: 26,
      sensorTimestamp: new Date("2026-07-26T10:00:00.000Z"),
    });

    const result = await saveIotPayload({
      deviceCode: "kandang-a-01",
      payload: { temperature: 26 },
      timestamp: new Date("2026-07-26T10:10:00.000Z"),
      source: "mqtt",
    });

    expect(result.inserted).toBe(1);
    expect(result.suppressed).toBe(0);
    expect(db.IotSensorData.bulkCreate).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          deviceId: "device-1",
          parameterId: "param-temp",
          value: 26,
        }),
      ],
      { transaction }
    );
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("inserts changed MQTT data before 10 minutes", async () => {
    db.IotSensorData.findOne.mockResolvedValue({
      value: 26,
      sensorTimestamp: new Date("2026-07-26T10:00:00.000Z"),
    });

    const result = await saveIotPayload({
      deviceCode: "kandang-a-01",
      payload: { temperature: 27 },
      timestamp: new Date("2026-07-26T10:02:00.000Z"),
      source: "mqtt",
    });

    expect(result.inserted).toBe(1);
    expect(result.suppressed).toBe(0);
    expect(db.IotSensorData.bulkCreate).toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalled();
  });

  it("keeps non-MQTT ingestion unchanged", async () => {
    const result = await saveIotPayload({
      deviceCode: "kandang-a-01",
      payload: { temperature: 26 },
      timestamp: new Date("2026-07-26T10:02:00.000Z"),
      source: "webhook",
    });

    expect(result.inserted).toBe(1);
    expect(db.IotSensorData.findOne).not.toHaveBeenCalled();
    expect(db.IotSensorData.bulkCreate).toHaveBeenCalled();
    expect(transaction.commit).toHaveBeenCalled();
  });
});
