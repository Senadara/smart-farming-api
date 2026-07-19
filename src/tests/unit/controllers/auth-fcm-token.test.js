const request = require("supertest");
const express = require("express");

jest.mock("../../../model/index", () => ({
  User: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
  Toko: {
    findOne: jest.fn(),
  },
  sequelize: {
    transaction: jest.fn(() => ({
      commit: jest.fn(),
      rollback: jest.fn(),
    })),
  },
}));

jest.mock("../../../config/otpWhatsapp", () => ({
  sendOTP: jest.fn(),
}));

jest.mock("../../../config/sendMail", () => ({
  sendMail: jest.fn(),
  sendResetPasswordMail: jest.fn(),
}));

jest.mock("../../../validation/dataValidation", () => ({
  dataValid: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

jest.mock("../../../config/jwt", () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock("../../../config/redis", () => ({
  client: {
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock("../../../config/otp", () => ({
  generateOTP: jest.fn(),
}));

jest.mock("../../../config/bcrypt", () => ({
  encrypt: jest.fn(),
}));

jest.mock("passport", () => ({
  authenticate: jest.fn(),
}));

const sequelize = require("../../../model/index");
const { dataValid } = require("../../../validation/dataValidation");
const { compare } = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../../config/jwt");
const authController = require("../../../controller/auth");

const app = express();
app.use(express.json());
app.post("/auth/login", authController.login);
app.put(
  "/auth/fcmToken",
  (req, res, next) => {
    req.user = { id: "user-123", role: "pjawab" };
    next();
  },
  authController.updateFcmToken
);
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

describe("Auth FCM token lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("stores a fresh FCM token during login when mobile sends it", async () => {
    const user = {
      id: "user-123",
      name: "Penanggung Jawab",
      email: "pjawab@example.com",
      phone: "08123456789",
      role: "pjawab",
      avatarUrl: "avatar.jpg",
      password: "$2b$hash",
      isActive: true,
      isDeleted: false,
      fcmToken: null,
      save: jest.fn(),
    };

    dataValid.mockResolvedValue({
      message: [],
      data: {
        email: "pjawab@example.com",
        password: "password123",
      },
    });
    sequelize.User.findOne.mockResolvedValue(user);
    sequelize.Toko.findOne.mockResolvedValue({ UserId: "owner-1" });
    sequelize.User.update.mockResolvedValue([0]);
    compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue("access-token");
    generateRefreshToken.mockReturnValue("refresh-token");

    const response = await request(app).post("/auth/login").send({
      email: "pjawab@example.com",
      password: "password123",
      fcmToken: "  login_fcm_token  ",
    });

    expect(response.statusCode).toBe(200);
    expect(user.fcmToken).toBe("login_fcm_token");
    expect(user.save).toHaveBeenCalled();
    expect(response.body.data.hasFcmToken).toBe(true);
  });

  it("rejects an empty FCM token update", async () => {
    const response = await request(app).put("/auth/fcmToken").send({
      fcmToken: "   ",
    });

    expect(response.statusCode).toBe(422);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe("FCM token is required");
    expect(sequelize.User.findOne).not.toHaveBeenCalled();
  });

  it("stores a trimmed FCM token from the authenticated update endpoint", async () => {
    const user = {
      id: "user-123",
      fcmToken: "old-token",
      save: jest.fn(),
    };

    sequelize.User.findOne.mockResolvedValue(user);
    sequelize.User.update.mockResolvedValue([0]);

    const response = await request(app).put("/auth/fcmToken").send({
      fcmToken: "  refreshed_fcm_token  ",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.data).toEqual({
      userId: "user-123",
      hasFcmToken: true,
    });
    expect(user.fcmToken).toBe("refreshed_fcm_token");
    expect(user.save).toHaveBeenCalled();
  });
});
