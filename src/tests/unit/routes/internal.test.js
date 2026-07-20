const request = require("supertest");
const express = require("express");

jest.mock("../../../../services/notificationService", () => ({
  sendNotificationToSingleUserById: jest.fn(),
  sendNotificationToTarget: jest.fn(),
}));

jest.mock("../../../services/eggProductionHealthService", () => ({
  getEggProductionDropContext: jest.fn(),
  getIndividualEggProductivityContext: jest.fn(),
  createAutomaticHealthIndication: jest.fn(),
}));

jest.mock("../../../../services/healthIndicationSchedulerService", () => ({
  readHealthSchedulerSetting: jest.fn(),
  runHealthIndicationScheduler: jest.fn(),
}));

const {
  sendNotificationToSingleUserById,
  sendNotificationToTarget,
} = require("../../../../services/notificationService");
const {
  getEggProductionDropContext,
  getIndividualEggProductivityContext,
  createAutomaticHealthIndication,
} = require("../../../services/eggProductionHealthService");
const {
  readHealthSchedulerSetting,
  runHealthIndicationScheduler,
} = require("../../../../services/healthIndicationSchedulerService");
const internalRouter = require("../../../routes/internal");

const app = express();
app.use(express.json());
app.use("/internal", internalRouter);

describe("Internal notification routes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      SPK_INTERNAL_NOTIFICATION_TOKEN: "internal-secret",
      INTERNAL_API_TOKEN: "",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("rejects requests with an invalid internal token", async () => {
    const response = await request(app)
      .post("/internal/notifications/mobile")
      .set("X-Internal-Token", "wrong-token")
      .send({
        target: { userId: "user-1" },
        title: "Test",
        body: "Body",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(sendNotificationToTarget).not.toHaveBeenCalled();
  });

  it("validates required mobile notification fields", async () => {
    const response = await request(app)
      .post("/internal/notifications/mobile")
      .set("X-Internal-Token", "internal-secret")
      .send({
        title: "Missing target",
        body: "Body",
      });

    expect(response.statusCode).toBe(422);
    expect(response.body.message).toBe("target, title, and body are required");
    expect(sendNotificationToTarget).not.toHaveBeenCalled();
  });

  it("sends a generic notification to a single user", async () => {
    sendNotificationToTarget.mockResolvedValue({
      success: true,
      messageId: "message-1",
    });

    const response = await request(app)
      .post("/internal/notifications/mobile")
      .set("X-Internal-Token", "internal-secret")
      .send({
        target: { userId: "user-1" },
        title: "Peringatan",
        body: "Kandang perlu dicek",
        data: { type: "SPK_ENVIRONMENT_ALERT" },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(sendNotificationToTarget).toHaveBeenCalledWith(
      { userId: "user-1" },
      "Peringatan",
      "Kandang perlu dicek",
      {
        type: "SPK_ENVIRONMENT_ALERT",
        source: "laravel",
      }
    );
  });

  it("sends a generic notification to a role target", async () => {
    sendNotificationToTarget.mockResolvedValue({
      success: true,
      successCount: 2,
      failureCount: 0,
    });

    const response = await request(app)
      .post("/internal/notifications/mobile")
      .set("X-Internal-Token", "internal-secret")
      .send({
        role: "pjawab",
        title: "Pengingat",
        body: "Cek laporan harian",
      });

    expect(response.statusCode).toBe(200);
    expect(sendNotificationToTarget).toHaveBeenCalledWith(
      { role: "pjawab" },
      "Pengingat",
      "Cek laporan harian",
      { source: "laravel" }
    );
  });

  it("keeps the SPK alert endpoint compatible", async () => {
    sendNotificationToSingleUserById.mockResolvedValue({
      success: true,
      messageId: "message-spk",
    });

    const response = await request(app)
      .post("/internal/notifications/spk-alert")
      .set("X-Internal-Token", "internal-secret")
      .send({
        userId: "user-1",
        title: "SPK Alert",
        body: "Kondisi waspada",
        data: { severity: "warning" },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(sendNotificationToSingleUserById).toHaveBeenCalledWith(
      "user-1",
      "SPK Alert",
      "Kondisi waspada",
      {
        severity: "warning",
        source: "laravel-spk",
        action: "OPEN_BACKOFFICE_URL",
      }
    );
  });

  it("returns egg production drop context for Laravel", async () => {
    getEggProductionDropContext.mockResolvedValue({
      unitBudidayaId: "unit-1",
      nonLayingPercent: 40,
      isIndication: true,
    });

    const response = await request(app)
      .get("/internal/spk/egg-production-drop")
      .query({
        unitBudidayaId: "unit-1",
        days: "7",
        thresholdPercent: "40",
      })
      .set("X-Internal-Token", "internal-secret");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      unitBudidayaId: "unit-1",
      nonLayingPercent: 40,
      isIndication: true,
    });
    expect(getEggProductionDropContext).toHaveBeenCalledWith({
      unitBudidayaId: "unit-1",
      days: "7",
      thresholdPercent: "40",
      startDate: undefined,
      endDate: undefined,
    });
  });

  it("returns individual egg productivity context for Laravel", async () => {
    getIndividualEggProductivityContext.mockResolvedValue({
      unitBudidayaId: "unit-1",
      activeChickenCount: 10,
      indicationChickenCount: 4,
      rows: [],
    });

    const response = await request(app)
      .get("/internal/spk/individual-egg-productivity")
      .query({
        unitBudidayaId: "unit-1",
        days: "7",
        thresholdPercent: "40",
        sort: "drop",
        direction: "desc",
      })
      .set("X-Internal-Token", "internal-secret");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      unitBudidayaId: "unit-1",
      activeChickenCount: 10,
      indicationChickenCount: 4,
      rows: [],
    });
    expect(getIndividualEggProductivityContext).toHaveBeenCalledWith({
      unitBudidayaId: "unit-1",
      days: "7",
      thresholdPercent: "40",
      startDate: undefined,
      endDate: undefined,
      sort: "drop",
      sortBy: undefined,
      direction: "desc",
    });
  });

  it("creates an automatic health indication report from Laravel", async () => {
    createAutomaticHealthIndication.mockResolvedValue({
      created: true,
      report: {
        laporanId: "laporan-1",
        sakitId: "sakit-1",
      },
    });

    const response = await request(app)
      .post("/internal/spk/health-indications")
      .set("X-Internal-Token", "internal-secret")
      .send({
        unitBudidayaId: "unit-1",
        days: 7,
        thresholdPercent: 40,
        userId: "user-1",
        source: "laravel-spk",
        targetRole: "petugas",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(createAutomaticHealthIndication).toHaveBeenCalledWith({
      unitBudidayaId: "unit-1",
      days: 7,
      thresholdPercent: 40,
      startDate: undefined,
      endDate: undefined,
      analysisMode: undefined,
      sort: undefined,
      sortBy: undefined,
      direction: undefined,
      userId: "user-1",
      source: "laravel-spk",
      notify: true,
      targetRole: "petugas",
      force: false,
    });
  });

  it("returns health scheduler status for Laravel", async () => {
    readHealthSchedulerSetting.mockResolvedValue({
      isEnabled: true,
      scheduleTimes: ["07:00", "12:30"],
      days: 7,
      thresholdPercent: 40,
      targetRole: "petugas",
    });

    const response = await request(app)
      .get("/internal/spk/health-scheduler")
      .set("X-Internal-Token", "internal-secret");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.scheduleTimes).toEqual(["07:00", "12:30"]);
    expect(readHealthSchedulerSetting).toHaveBeenCalled();
  });

  it("runs the health scheduler manually for Laravel", async () => {
    runHealthIndicationScheduler.mockResolvedValue({
      ran: true,
      summary: {
        processedUnitCount: 2,
        createdReportCount: 4,
        affectedObjectCount: 4,
      },
    });

    const response = await request(app)
      .post("/internal/spk/health-scheduler/run")
      .set("X-Internal-Token", "internal-secret")
      .send({ source: "laravel-health-scheduler-manual" });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.summary.createdReportCount).toBe(4);
    expect(runHealthIndicationScheduler).toHaveBeenCalledWith({
      manual: true,
      source: "laravel-health-scheduler-manual",
    });
  });
});
