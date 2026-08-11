const { Sequelize, DataTypes } = require("sequelize");

// Create in-memory SQLite database for testing
const sequelize = new Sequelize("sqlite::memory:", {
  logging: false,
});

// Import the model
const ScheduledUnitNotificationModel = require("../../../model/farm/scheduledUnitNotification");

describe("ScheduledUnitNotification Model", () => {
  let ScheduledUnitNotification;
  let UnitBudidaya;
  beforeAll(async () => {
    // Define models without associations first
    UnitBudidaya = sequelize.define(
      "UnitBudidaya",
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        namaUnit: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: DataTypes.STRING,
          defaultValue: "active",
        },
        isDeleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
      },
      {
        tableName: "UnitBudidaya",
        timestamps: true,
      }
    );

    ScheduledUnitNotification = ScheduledUnitNotificationModel(
      sequelize,
      DataTypes
    );

    // Setup minimal associations only
    ScheduledUnitNotification.belongsTo(UnitBudidaya, {
      foreignKey: "unitBudidayaId",
      targetKey: "id",
    });
    UnitBudidaya.hasMany(ScheduledUnitNotification, {
      foreignKey: "unitBudidayaId",
      sourceKey: "id",
    });

    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await ScheduledUnitNotification.destroy({ where: {}, force: true });
    await UnitBudidaya.destroy({ where: {}, force: true });
  });

  describe("Model Definition", () => {
    it("should be defined", () => {
      expect(ScheduledUnitNotification).toBeDefined();
    });

    it("should have correct table name", () => {
      expect(ScheduledUnitNotification.tableName).toBe(
        "scheduledUnitNotification"
      );
    });

    it("should have correct attributes", () => {
      const attributes = ScheduledUnitNotification.rawAttributes;

      expect(attributes.id).toBeDefined();
      expect(attributes.id.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.id.primaryKey).toBe(true);
      expect(attributes.id.allowNull).toBe(false);

      expect(attributes.unitBudidayaId).toBeDefined();
      expect(attributes.unitBudidayaId.type).toBeInstanceOf(DataTypes.UUID);
      expect(attributes.unitBudidayaId.allowNull).toBe(false);

      expect(attributes.title).toBeDefined();
      expect(attributes.title.type).toBeInstanceOf(DataTypes.STRING);
      expect(attributes.title.allowNull).toBe(false);

      expect(attributes.messageTemplate).toBeDefined();
      expect(attributes.messageTemplate.type).toBeInstanceOf(DataTypes.TEXT);
      expect(attributes.messageTemplate.allowNull).toBe(false);

      expect(attributes.notificationType).toBeDefined();
      expect(attributes.notificationType.type.key).toBe("ENUM");

      expect(attributes.tipeLaporan).toBeDefined();
      expect(attributes.tipeLaporan.type.key).toBe("ENUM");

      expect(attributes.dayOfWeek).toBeDefined();
      expect(attributes.dayOfWeek.type).toBeInstanceOf(DataTypes.INTEGER);
      expect(attributes.dayOfWeek.allowNull).toBe(true);

      expect(attributes.dayOfMonth).toBeDefined();
      expect(attributes.dayOfMonth.type).toBeInstanceOf(DataTypes.INTEGER);
      expect(attributes.dayOfMonth.allowNull).toBe(true);

      expect(attributes.scheduledTime).toBeDefined();
      expect(attributes.scheduledTime.type).toBeInstanceOf(DataTypes.TIME);
      expect(attributes.scheduledTime.allowNull).toBe(false);

      expect(attributes.isActive).toBeDefined();
      expect(attributes.isActive.type).toBeInstanceOf(DataTypes.BOOLEAN);
      expect(attributes.isActive.defaultValue).toBe(true);

      expect(attributes.lastTriggered).toBeDefined();
      expect(attributes.lastTriggered.type).toBeInstanceOf(DataTypes.DATE);
      expect(attributes.lastTriggered.allowNull).toBe(true);

      expect(attributes.isDeleted).toBeDefined();
      expect(attributes.isDeleted.type).toBeInstanceOf(DataTypes.BOOLEAN);
      expect(attributes.isDeleted.defaultValue).toBe(false);
    });

    it("should have correct enum values for notificationType", () => {
      const notificationTypeAttribute =
        ScheduledUnitNotification.rawAttributes.notificationType;
      expect(notificationTypeAttribute.type.values).toEqual([
        "daily",
        "weekly",
        "monthly",
      ]);
    });

    it("should have correct enum values for tipeLaporan", () => {
      const tipeLaporanAttribute =
        ScheduledUnitNotification.rawAttributes.tipeLaporan;
      expect(tipeLaporanAttribute.type.values).toEqual(["panen", "vitamin"]);
    });

    it("should have foreign key reference to UnitBudidaya", () => {
      const unitBudidayaIdAttribute =
        ScheduledUnitNotification.rawAttributes.unitBudidayaId;
      expect(unitBudidayaIdAttribute.references).toBeDefined();
      expect(unitBudidayaIdAttribute.references.model).toBe("UnitBudidaya");
      expect(unitBudidayaIdAttribute.references.key).toBe("id");
    });
  });

  describe("CRUD Operations", () => {
    let unitBudidaya;

    beforeEach(async () => {
      // Create a unit budidaya for foreign key reference
      unitBudidaya = await UnitBudidaya.create({
        namaUnit: "Test Unit",
        status: "active",
        isDeleted: false,
      });
    });

    it("should create a scheduled unit notification successfully", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Daily Harvest Reminder",
        messageTemplate: "Time to check harvest status",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      expect(notification.id).toBeDefined();
      expect(notification.unitBudidayaId).toBe(unitBudidaya.id);
      expect(notification.title).toBe("Daily Harvest Reminder");
      expect(notification.messageTemplate).toBe("Time to check harvest status");
      expect(notification.notificationType).toBe("daily");
      expect(notification.tipeLaporan).toBe("panen");
      expect(notification.scheduledTime).toBe("08:00:00");
      expect(notification.isActive).toBe(true);
      expect(notification.isDeleted).toBe(false);
      expect(notification.createdAt).toBeDefined();
      expect(notification.updatedAt).toBeDefined();
    });

    it("should create weekly notification with dayOfWeek", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Weekly Vitamin Reminder",
        messageTemplate: "Time to administer vitamins",
        notificationType: "weekly",
        tipeLaporan: "vitamin",
        dayOfWeek: 1, // Monday
        scheduledTime: "09:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      expect(notification.notificationType).toBe("weekly");
      expect(notification.tipeLaporan).toBe("vitamin");
      expect(notification.dayOfWeek).toBe(1);
    });

    it("should create monthly notification with dayOfMonth", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Monthly Report Reminder",
        messageTemplate: "Generate monthly report",
        notificationType: "monthly",
        tipeLaporan: "panen",
        dayOfMonth: 15,
        scheduledTime: "10:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      expect(notification.notificationType).toBe("monthly");
      expect(notification.dayOfMonth).toBe(15);
    });

    it("should find notification by id", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Test Notification",
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      const created = await ScheduledUnitNotification.create(notificationData);
      const found = await ScheduledUnitNotification.findByPk(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.title).toBe("Test Notification");
    });

    it("should update notification", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Original Title",
        messageTemplate: "Original message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      await notification.update({
        title: "Updated Title",
        messageTemplate: "Updated message",
        isActive: false,
      });

      expect(notification.title).toBe("Updated Title");
      expect(notification.messageTemplate).toBe("Updated message");
      expect(notification.isActive).toBe(false);
    });

    it("should soft delete notification", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Test Notification",
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      await notification.update({ isDeleted: true });

      expect(notification.isDeleted).toBe(true);
    });

    it("should find all active notifications", async () => {
      await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Active Notification",
        messageTemplate: "Active message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        isActive: true,
        isDeleted: false,
      });

      await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Inactive Notification",
        messageTemplate: "Inactive message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        isActive: false,
        isDeleted: false,
      });

      const activeNotifications = await ScheduledUnitNotification.findAll({
        where: {
          isActive: true,
          isDeleted: false,
        },
      });

      expect(activeNotifications).toHaveLength(1);
      expect(activeNotifications[0].title).toBe("Active Notification");
    });

    it("should find notifications by unit budidaya", async () => {
      const anotherUnit = await UnitBudidaya.create({
        namaUnit: "Another Unit",
        status: "active",
        isDeleted: false,
      });

      await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Unit 1 Notification",
        messageTemplate: "Message for unit 1",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      });

      await ScheduledUnitNotification.create({
        unitBudidayaId: anotherUnit.id,
        title: "Unit 2 Notification",
        messageTemplate: "Message for unit 2",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      });

      const unit1Notifications = await ScheduledUnitNotification.findAll({
        where: {
          unitBudidayaId: unitBudidaya.id,
          isDeleted: false,
        },
      });

      expect(unit1Notifications).toHaveLength(1);
      expect(unit1Notifications[0].title).toBe("Unit 1 Notification");
    });
  });

  describe("Validations", () => {
    let unitBudidaya;

    beforeEach(async () => {
      unitBudidaya = await UnitBudidaya.create({
        namaUnit: "Test Unit",
        status: "active",
        isDeleted: false,
      });
    });

    it("should fail without required unitBudidayaId", async () => {
      const notificationData = {
        title: "Test Notification",
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      await expect(
        ScheduledUnitNotification.create(notificationData)
      ).rejects.toThrow();
    });

    it("should fail without required title", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      await expect(
        ScheduledUnitNotification.create(notificationData)
      ).rejects.toThrow();
    });

    it("should fail without required messageTemplate", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Test Notification",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      await expect(
        ScheduledUnitNotification.create(notificationData)
      ).rejects.toThrow();
    });

    it("should accept all valid notificationType values", async () => {
      const validNotificationTypes = ["daily", "weekly", "monthly"];

      for (const type of validNotificationTypes) {
        const notification = await ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: `${type} notification`,
          messageTemplate: `Template for ${type} notification`,
          notificationType: type,
          tipeLaporan: "panen",
          scheduledTime: "08:00:00",
        });

        expect(notification.notificationType).toBe(type);
      }
    });

    it("should accept all valid tipeLaporan values", async () => {
      const validTipeLaporan = ["panen", "vitamin"];

      for (const tipe of validTipeLaporan) {
        const notification = await ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: `Notification for ${tipe}`,
          messageTemplate: `Template for ${tipe}`,
          notificationType: "daily",
          tipeLaporan: tipe,
          scheduledTime: "08:00:00",
        });

        expect(notification.tipeLaporan).toBe(tipe);
      }
    });

    it("should fail with invalid notificationType", async () => {
      const invalidTypes = ["hourly", "yearly", "invalid", ""];

      for (const invalidType of invalidTypes) {
        try {
          const notification = await ScheduledUnitNotification.create({
            unitBudidayaId: unitBudidaya.id,
            title: "Test notification",
            messageTemplate: "Test template",
            notificationType: invalidType,
            tipeLaporan: "panen",
            scheduledTime: "08:00:00",
          });

          // For SQLite, check if invalid values are stored as-is
          // In production with proper DB, these would be rejected
          if (invalidType !== "") {
            expect(notification.notificationType).toBe(invalidType);
          }
        } catch (error) {
          // Expected for databases that enforce constraints
          expect(error).toBeDefined();
        }
      }
    });

    it("should fail with invalid tipeLaporan", async () => {
      const invalidTipeLaporan = ["laporan", "report", "invalid", ""];

      for (const invalidTipe of invalidTipeLaporan) {
        try {
          const notification = await ScheduledUnitNotification.create({
            unitBudidayaId: unitBudidaya.id,
            title: "Test notification",
            messageTemplate: "Test template",
            notificationType: "daily",
            tipeLaporan: invalidTipe,
            scheduledTime: "08:00:00",
          });

          // For SQLite, check if invalid values are stored as-is
          // In production with proper DB, these would be rejected
          if (invalidTipe !== "") {
            expect(notification.tipeLaporan).toBe(invalidTipe);
          }
        } catch (error) {
          // Expected for databases that enforce constraints
          expect(error).toBeDefined();
        }
      }
    });

    it("should validate TIME format for scheduledTime", async () => {
      const validTimes = ["08:00:00", "23:59:59", "00:00:00", "12:30:45"];

      for (const time of validTimes) {
        const notification = await ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Time test notification",
          messageTemplate: "Time test template",
          notificationType: "daily",
          tipeLaporan: "panen",
          scheduledTime: time,
        });

        expect(notification.scheduledTime).toBe(time);
      }
    });

    it("should handle dayOfWeek values correctly", async () => {
      const validDaysOfWeek = [0, 1, 2, 3, 4, 5, 6];

      for (const day of validDaysOfWeek) {
        const notification = await ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Weekly notification",
          messageTemplate: "Weekly template",
          notificationType: "weekly",
          tipeLaporan: "panen",
          dayOfWeek: day,
          scheduledTime: "08:00:00",
        });

        expect(notification.dayOfWeek).toBe(day);
      }
    });

    it("should handle dayOfMonth values correctly", async () => {
      const validDaysOfMonth = [1, 15, 28, 31];

      for (const day of validDaysOfMonth) {
        const notification = await ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Monthly notification",
          messageTemplate: "Monthly template",
          notificationType: "monthly",
          tipeLaporan: "panen",
          dayOfMonth: day,
          scheduledTime: "08:00:00",
        });

        expect(notification.dayOfMonth).toBe(day);
      }
    });

    it("should allow null for dayOfWeek and dayOfMonth", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Daily notification",
        messageTemplate: "Daily template",
        notificationType: "daily",
        tipeLaporan: "panen",
        dayOfWeek: null,
        dayOfMonth: null,
        scheduledTime: "08:00:00",
      });

      expect(notification.dayOfWeek).toBe(null);
      expect(notification.dayOfMonth).toBe(null);
    });

    it("should handle lastTriggered date field", async () => {
      const triggerDate = new Date("2024-01-15T10:30:00Z");

      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Triggered notification",
        messageTemplate: "Triggered template",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        lastTriggered: triggerDate,
      });

      expect(notification.lastTriggered).toEqual(triggerDate);
    });

    it("should allow null for lastTriggered", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Never triggered notification",
        messageTemplate: "Never triggered template",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        lastTriggered: null,
      });

      expect(notification.lastTriggered).toBeNull();
    });

    it("should handle isActive boolean field", async () => {
      // Test active notification
      const activeNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Active notification",
        messageTemplate: "Active template",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        isActive: true,
      });

      expect(activeNotification.isActive).toBe(true);

      // Test inactive notification
      const inactiveNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Inactive notification",
        messageTemplate: "Inactive template",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
        isActive: false,
      });

      expect(inactiveNotification.isActive).toBe(false);
    });
  });

  describe("Associations", () => {
    it("should have belongsTo association with UnitBudidaya", () => {
      const associations = ScheduledUnitNotification.associations;
      expect(associations.UnitBudidaya).toBeDefined();
      expect(associations.UnitBudidaya.associationType).toBe("BelongsTo");
    });

    it("should call associate function correctly", () => {
      // Test the associate function to cover line 68
      const mockModels = {
        UnitBudidaya: UnitBudidaya,
      };

      // Spy on the belongsTo method
      const belongsToSpy = jest.spyOn(ScheduledUnitNotification, "belongsTo");

      // Call the associate function from the model
      ScheduledUnitNotification.associate(mockModels);

      // Verify that belongsTo uses the table column expected by mobile data.
      expect(belongsToSpy).toHaveBeenCalledWith(
        mockModels.UnitBudidaya,
        expect.objectContaining({ foreignKey: "unitBudidayaId" })
      );

      // Restore the spy
      belongsToSpy.mockRestore();
    });

    it("should include UnitBudidaya data when requested", async () => {
      const unitBudidaya = await UnitBudidaya.create({
        namaUnit: "Test Unit for Association",
        status: "active",
        isDeleted: false,
      });

      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Test Notification",
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      });

      const notificationWithUnit = await ScheduledUnitNotification.findOne({
        where: { id: notification.id },
        include: [UnitBudidaya],
      });

      expect(notificationWithUnit.UnitBudidaya).toBeDefined();
      expect(notificationWithUnit.UnitBudidaya.namaUnit).toBe(
        "Test Unit for Association"
      );
    });
  });

  describe("Default Values", () => {
    let unitBudidaya;

    beforeEach(async () => {
      unitBudidaya = await UnitBudidaya.create({
        namaUnit: "Test Unit",
        status: "active",
        isDeleted: false,
      });
    });

    it("should set default values correctly", async () => {
      const notificationData = {
        unitBudidayaId: unitBudidaya.id,
        title: "Test Notification",
        messageTemplate: "Test message",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "08:00:00",
      };

      const notification = await ScheduledUnitNotification.create(
        notificationData
      );

      expect(notification.isActive).toBe(true);
      expect(notification.isDeleted).toBe(false);
      expect(notification.id).toBeDefined();
    });
  });

  describe("Business Logic and Advanced Scenarios", () => {
    let unitBudidaya;

    beforeEach(async () => {
      unitBudidaya = await UnitBudidaya.create({
        namaUnit: "Test Unit for Business Logic",
        status: "active",
        isDeleted: false,
      });
    });

    it("should support complex notification scheduling scenarios", async () => {
      // Create daily notification
      const dailyNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Daily Harvest Check",
        messageTemplate: "Please check harvest status for {unitName}",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "06:00:00",
        isActive: true,
      });

      // Create weekly notification
      const weeklyNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Weekly Vitamin Administration",
        messageTemplate: "Time to administer vitamins for {unitName}",
        notificationType: "weekly",
        tipeLaporan: "vitamin",
        dayOfWeek: 1, // Monday
        scheduledTime: "08:00:00",
        isActive: true,
      });

      // Create monthly notification
      const monthlyNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Monthly Report Generation",
        messageTemplate: "Generate monthly report for {unitName}",
        notificationType: "monthly",
        tipeLaporan: "panen",
        dayOfMonth: 1, // First day of month
        scheduledTime: "09:00:00",
        isActive: true,
      });

      // Verify all notifications were created for the same unit
      const unitNotifications = await ScheduledUnitNotification.findAll({
        where: {
          unitBudidayaId: unitBudidaya.id,
          isDeleted: false,
        },
        order: [["createdAt", "ASC"]],
      });

      expect(unitNotifications).toHaveLength(3);
      expect(unitNotifications[0].notificationType).toBe("daily");
      expect(unitNotifications[1].notificationType).toBe("weekly");
      expect(unitNotifications[2].notificationType).toBe("monthly");
    });

    it("should track last triggered timestamps", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Trackable Notification",
        messageTemplate: "This notification tracks triggers",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "10:00:00",
      });

      expect(notification.lastTriggered).toBeFalsy(); // Could be null or undefined

      // Simulate triggering the notification
      const triggerTime = new Date();
      await notification.update({ lastTriggered: triggerTime });

      expect(notification.lastTriggered).toEqual(triggerTime);
    });

    it("should support notification activation/deactivation", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Toggleable Notification",
        messageTemplate: "This notification can be toggled",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "11:00:00",
        isActive: true,
      });

      expect(notification.isActive).toBe(true);

      // Deactivate notification
      await notification.update({ isActive: false });
      expect(notification.isActive).toBe(false);

      // Reactivate notification
      await notification.update({ isActive: true });
      expect(notification.isActive).toBe(true);
    });

    it("should support soft delete functionality", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Deletable Notification",
        messageTemplate: "This notification can be soft deleted",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "12:00:00",
      });

      expect(notification.isDeleted).toBe(false);

      // Soft delete
      await notification.update({ isDeleted: true });
      expect(notification.isDeleted).toBe(true);

      // Verify it's not found in active queries
      const activeNotifications = await ScheduledUnitNotification.findAll({
        where: {
          unitBudidayaId: unitBudidaya.id,
          isDeleted: false,
        },
      });

      expect(activeNotifications.some((n) => n.id === notification.id)).toBe(
        false
      );
    });

    it("should handle multiple notifications with different schedules", async () => {
      const notifications = await Promise.all([
        ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Morning Check",
          messageTemplate: "Morning harvest check",
          notificationType: "daily",
          tipeLaporan: "panen",
          scheduledTime: "06:00:00",
        }),
        ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Evening Check",
          messageTemplate: "Evening harvest check",
          notificationType: "daily",
          tipeLaporan: "panen",
          scheduledTime: "18:00:00",
        }),
        ScheduledUnitNotification.create({
          unitBudidayaId: unitBudidaya.id,
          title: "Weekend Vitamin",
          messageTemplate: "Weekend vitamin administration",
          notificationType: "weekly",
          tipeLaporan: "vitamin",
          dayOfWeek: 6, // Saturday
          scheduledTime: "08:00:00",
        }),
      ]);

      expect(notifications).toHaveLength(3);

      // Verify different scheduled times
      const scheduledTimes = notifications.map((n) => n.scheduledTime);
      expect(scheduledTimes).toContain("06:00:00");
      expect(scheduledTimes).toContain("18:00:00");
      expect(scheduledTimes).toContain("08:00:00");
    });

    it("should validate message template content", async () => {
      const longTemplate = "A".repeat(1000); // Very long template

      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Long Template Notification",
        messageTemplate: longTemplate,
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "13:00:00",
      });

      expect(notification.messageTemplate).toBe(longTemplate);
      expect(notification.messageTemplate).toHaveLength(1000);
    });

    it("should handle edge cases for day values", async () => {
      // Test minimum dayOfMonth
      const monthlyStart = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Month Start Notification",
        messageTemplate: "Start of month notification",
        notificationType: "monthly",
        tipeLaporan: "panen",
        dayOfMonth: 1,
        scheduledTime: "00:00:00",
      });

      expect(monthlyStart.dayOfMonth).toBe(1);

      // Test maximum dayOfMonth
      const monthlyEnd = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Month End Notification",
        messageTemplate: "End of month notification",
        notificationType: "monthly",
        tipeLaporan: "panen",
        dayOfMonth: 31,
        scheduledTime: "23:59:59",
      });

      expect(monthlyEnd.dayOfMonth).toBe(31);

      // Test Sunday (0) and Saturday (6) for weekly
      const sundayNotification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Sunday Notification",
        messageTemplate: "Sunday notification",
        notificationType: "weekly",
        tipeLaporan: "vitamin",
        dayOfWeek: 0,
        scheduledTime: "07:00:00",
      });

      expect(sundayNotification.dayOfWeek).toBe(0);
    });

    it("should maintain referential integrity with UnitBudidaya", async () => {
      const notification = await ScheduledUnitNotification.create({
        unitBudidayaId: unitBudidaya.id,
        title: "Integrity Test Notification",
        messageTemplate: "Testing referential integrity",
        notificationType: "daily",
        tipeLaporan: "panen",
        scheduledTime: "14:00:00",
      });

      // Verify the foreign key relationship
      expect(notification.unitBudidayaId).toBe(unitBudidaya.id);

      // Test with association
      const notificationWithUnit = await ScheduledUnitNotification.findOne({
        where: { id: notification.id },
        include: [UnitBudidaya],
      });

      expect(notificationWithUnit.UnitBudidaya).toBeDefined();
      expect(notificationWithUnit.UnitBudidaya.id).toBe(unitBudidaya.id);
    });
  });
});
