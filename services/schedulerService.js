const cron = require("node-cron");
const moment = require("moment");
const { Op, where } = require("sequelize");
const sequelize = require("../src/model/index");
const GlobalNotificationSetting = sequelize.GlobalNotificationSetting;
const ScheduledUnitNotification = sequelize.ScheduledUnitNotification;
const UnitBudidaya = sequelize.UnitBudidaya;
const { sendNotificationToUser } = require("./notificationService");
const { fetchAndSaveSensorData, initLastSavedTime } = require("./antaresService");
const Pesanan = sequelize.Pesanan;
const PesananDetail = sequelize.PesananDetail;
const Produk = sequelize.Produk;
const Komoditas = sequelize.Komoditas;
const MidtransOrder = sequelize.MidtransOrder;

async function checkAndSendScheduledNotifications() {
  const now = moment();
  console.log(
    `[${now.format("YYYY-MM-DD HH:mm:ss Z")}] Scheduler: Running checks...`
  );

  try {
    const globalSetting = await GlobalNotificationSetting.findAll({
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    for (const setting of globalSetting) {
      let send = false;
      const title = setting.title;
      const message = setting.messageTemplate;
      const targetRole = setting.targetRole;
      const lastTriggered = setting.lastTriggered
        ? moment(setting.lastTriggered)
        : null;

      if (setting.notificationType == "repeat") {
        const recurringTimeParts = setting.scheduledTime.split(":").map(Number);

        if (
          now.hours() === recurringTimeParts[0] &&
          now.minutes() === recurringTimeParts[1]
        ) {
          if (lastTriggered) {
            if (!lastTriggered.isSame(now, "day")) {
              send = true;
            }
          } else {
            send = true;
          }
        }
      } else if (setting.notificationType === "once") {
        if (!lastTriggered) {
          const onceDate = moment(setting.scheduledDate);
          const onceTime = moment(setting.scheduledTime, "HH:mm");

          if (onceDate.isSameOrBefore(now) && onceTime.isSameOrBefore(now)) {
            send = true;
          }
        }
      }

      if (send) {
        console.log(
          `[GLOBAL][${now.format(
            "HH:mm"
          )}] Sending: "${title}" to role ${targetRole}`
        );
        await sendNotificationToUser(targetRole, title, message, {
          notificationType: "GLOBAL",
          settingId: setting.id,
        });
        await setting.update({ lastTriggered: now.toDate(), isActive: false });
      }
    }
  } catch (error) {
    console.error(
      `[${moment().format()}] Scheduler Error (GlobalNotificationSetting):`,
      error
    );
  }

  try {
    const unitSchedules = await ScheduledUnitNotification.findAll({
      include: [
        {
          model: UnitBudidaya,
          attributes: ["id", "nama"],
        },
      ],
      where: {
        isActive: true,
        isDeleted: false,
      },
    });

    for (const schedule of unitSchedules) {
      let shouldSendUnitSchedule = false;

      const scheduledTimeParts = schedule.scheduledTime.split(":").map(Number);

      const lastUnitTriggered = schedule.lastTriggered
        ? moment(schedule.lastTriggered)
        : null;

      if (
        now.hours() === scheduledTimeParts[0] &&
        now.minutes() === scheduledTimeParts[1]
      ) {
        let frequencyMatch = false;
        if (schedule.notificationType === "daily") {
          frequencyMatch = true;
        } else if (schedule.notificationType === "weekly") {
          if (now.day() === schedule.dayOfWeek) {
            frequencyMatch = true;
          }
        } else if (schedule.notificationType === "monthly") {
          if (now.date() === schedule.dayOfMonth) {
            frequencyMatch = true;
          }
        }

        if (frequencyMatch) {
          if (lastUnitTriggered) {
            if (!lastUnitTriggered.isSame(now, "day")) {
              shouldSendUnitSchedule = true;
            }
          } else {
            shouldSendUnitSchedule = true;
          }
        }
      }

      if (shouldSendUnitSchedule) {
        const title = schedule.title;
        const message = schedule.messageTemplate;

        console.log(
          `[UNIT][${now.format("HH:mm")}] Sending: "${title}" to PETUGAS`
        );
        await sendNotificationToUser("petugas", title, message, {
          notificationType: "UNIT_SCHEDULE",
          unitBudidayaId: schedule.UnitBudidaya.id,
          scheduleId: schedule.id,
        });

        await schedule.update({ lastTriggered: now.toDate() });
      }
    }
  } catch (error) {
    console.error(
      `[${moment().format()}] Scheduler Error (ScheduledUnitReport):`,
      error
    );
  }
}
async function expireUnpaidOrders() {
  const cutoff = moment().subtract(1, "hours").toDate();
  try {
    const orders = await Pesanan.findAll({
      where: {
        status: "menunggu",
        createdAt: { [Op.lt]: cutoff },
        isDeleted: false,
      },
      include: [
        { model: PesananDetail, include: [Produk] },
        { model: MidtransOrder, attributes: ["transaction_status"] },
      ],
    });

    for (const order of orders) {
      if (!order.MidtransOrder || order.MidtransOrder.transaction_status === "pending") {
        const t = await sequelize.sequelize.transaction();
        const komoditas = await Komoditas.findOne({
          where: { produkId: order.PesananDetails[0].Produk.id, isDeleted: false },
        });
        try {
          await order.update({ status: "expired" }, { transaction: t });
          for (const detail of order.PesananDetails) {
            const prod = detail.Produk;
            if (prod && typeof prod.stok === "number") {
              await Produk.update(
                { stok: prod.stok + detail.jumlah },
                { where: { id: prod.id }, transaction: t }
              );
              if (komoditas) {
                await Komoditas.update(
                  { jumlah: komoditas.jumlah + detail.jumlah },
                  { where: { produkId: prod.id }, transaction: t }
                );
              }
            }
          }
          await t.commit();
        } catch (err) {
          await t.rollback();
          console.error(
            `[${moment().format()}] Scheduler Error (expireUnpaidOrders transaction):`,
            err
          );
        }
      }
    }
  } catch (err) {
    console.error(
      `[${moment().format()}] Scheduler Error (expireUnpaidOrders fetch):`,
      err
    );
  }
}

function startScheduler() {
  cron.schedule("* * * * *", checkAndSendScheduledNotifications, {
    scheduled: true,
  });
  cron.schedule("* * * * *", expireUnpaidOrders, { scheduled: true });
  
  // Antares sensor data fetching - every 5 minutes
  cron.schedule("*/5 * * * *", fetchAndSaveSensorData, { scheduled: true });
  
  console.log(
    `Notification scheduler started. Running every minute. App Timezone: Asia/Jakarta. Current Time for Scheduler: ${moment().format(
      "YYYY-MM-DD HH:mm:ss Z"
    )}`
  );
  console.log(`Sensor scheduler started. Running every 5 minutes.`);
  
  checkAndSendScheduledNotifications();
  // Opsional: jalankan sekali saat start untuk testing
  
  // Initialize last saved time, then fetch sensor data on startup
  initLastSavedTime().then(() => {
    fetchAndSaveSensorData();
  });
}

module.exports = {
  startScheduler,
};
