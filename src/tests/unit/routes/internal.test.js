const request = require("supertest");
const express = require("express");

jest.mock("../../../../services/notificationService", () => ({
  sendNotificationToSingleUserById: jest.fn(),
  sendNotificationToTarget: jest.fn(),
}));

const {
  sendNotificationToSingleUserById,
  sendNotificationToTarget,
} = require("../../../../services/notificationService");
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
});
