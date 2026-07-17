const { where } = require("sequelize");
const sequelize = require("../../model/index");
const db = sequelize.sequelize;
const JenisBudidaya = sequelize.JenisBudidaya;
const UnitBudidaya = sequelize.UnitBudidaya;
const ObjekBudidaya = sequelize.ObjekBudidaya;
const ScheduledUnitNotification = sequelize.ScheduledUnitNotification;
const Logs = sequelize.Logs;
const Op = sequelize.Sequelize.Op;

const normalizeUmurMinggu = (payload, { defaultMissing = false } = {}) => {
  if (!Object.prototype.hasOwnProperty.call(payload, "umurMinggu")) {
    if (defaultMissing) {
      payload.umurMinggu = 0;
    }

    return null;
  }

  if (payload.umurMinggu === null || payload.umurMinggu === "") {
    payload.umurMinggu = 0;
    return null;
  }

  const value = Number(payload.umurMinggu);
  if (!Number.isInteger(value) || value < 0) {
    return "umurMinggu must be an integer greater than or equal to 0";
  }

  payload.umurMinggu = value;
  return null;
};

const getAllUnitBudidaya = async (req, res) => {
  try {
    const data = await UnitBudidaya.findAll({
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    if (data.length === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved all unit budidaya data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getUnitBudidayaById = async (req, res) => {
  try {
    const data = await UnitBudidaya.findOne({
      include: [
        {
          model: JenisBudidaya,
          required: true,
        },
      ],
      where: {
        id: req.params.id,
        isDeleted: false,
      },
    });

    const dataObjekBudidaya = await ObjekBudidaya.findAll({
      include: [
        {
          model: UnitBudidaya,
          attributes: ["id"],
          required: true,
          include: [
            {
              model: JenisBudidaya,
              attributes: ["nama", "gambar"],
              required: true,
            },
          ],
        },
      ],
      where: {
        UnitBudidayaId: req.params.id,
        isDeleted: false,
      },
      order: [
        [db.fn("length", db.col("namaId")), "ASC"],
        ["namaId", "ASC"],
      ],
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved unit budidaya data",
      data: {
        unitBudidaya: data,
        objekBudidaya: dataObjekBudidaya,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getUnitBudidayaByName = async (req, res) => {
  try {
    const { nama, tipe } = req.params;

    const data = await UnitBudidaya.findAll({
      include: [
        {
          model: JenisBudidaya,
          where: {
            tipe: tipe,
          },
        },
      ],
      where: {
        nama: {
          [Op.like]: `%${nama}%`,
        },
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    return res.status(200).json({
      message: "Successfully retrieved unit budidaya data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getUnitBudidayaByJenisBudidaya = async (req, res) => {
  try {
    const { jenisBudidayaId } = req.params;
    const data = await UnitBudidaya.findAll({
      include: [
        {
          model: JenisBudidaya,
          where: {
            id: jenisBudidayaId,
          },
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });
    if (data.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }
    return res.status(200).json({
      message: "Successfully retrieved unit budidaya data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createUnitBudidaya = async (req, res) => {
  const t = await db.transaction();

  try {
    const payload = { ...req.body };
    const validationError = normalizeUmurMinggu(payload, { defaultMissing: true });

    if (validationError) {
      await t.rollback();
      return res.status(400).json({ message: validationError });
    }

    const { jumlah = 0, tipe, jenisBudidayaId, notifikasi = {} } = payload;

    const jenisBudidaya = await JenisBudidaya.findOne({
      where: { id: jenisBudidayaId },
      isDeleted: false,
      transaction: t,
    });

    if (!jenisBudidaya || jenisBudidaya.isDeleted) {
      await t.rollback();
      return res.status(404).json({ message: "Data not found" });
    }

    const data = await UnitBudidaya.create(
      {
        ...payload,
        JenisBudidayaId: jenisBudidayaId,
        isDeleted: false,
      },
      { transaction: t }
    );

    let objekList = [];
    let createdObjekList = [];

    if (tipe.toLowerCase() == "individu") {
      objekList = Array.from({ length: jumlah }, (_, i) => {
        const prefix = jenisBudidaya.tipe === "hewan" ? "Ternak" : "Tanaman";
        const deskripsi = `${prefix} ${jenisBudidaya.nama} pada ${
          data.nama
        } nomor ${i + 1}`;

        return {
          UnitBudidayaId: data.id,
          namaId: `${jenisBudidaya.nama} #${i + 1}`,
          status: true,
          deskripsi,
          isDeleted: false,
        };
      });

      createdObjekList = await ObjekBudidaya.bulkCreate(objekList, {
        transaction: t,
        returning: true,
      });

      for (const obj of createdObjekList) {
        await Logs.create({
          tableName: "ObjekBudidaya",
          action: "create",
          recordId: obj.id,
          before: null,
          after: obj.toJSON(),
          changedBy: req.user?.id,
        });
      }
    }
    if (notifikasi?.panen != null) {
      await ScheduledUnitNotification.create(
        {
          ...notifikasi.panen,
          unitBudidayaId: data.id,
          title: `Pengingat Laporan Panen ${data.nama}`,
          messageTemplate: `Hai! 👋

Sudah waktunya panen nih! 🌾
Jangan lupa lapor panen untuk ${data.nama}, ya. Biar semua tetap tercatat dan nggak ada yang kelewat.

Klik di sini buat lapor sekarang! 🌾`,
          tipeLaporan: "panen",
          isDeleted: false,
        },
        { transaction: t }
      );
    }

    if (notifikasi?.vitamin != null) {
      await ScheduledUnitNotification.create(
        {
          unitBudidayaId: data.id,
          title: `Pengingat Pemberian Vitamin ${data.nama}`,
          messageTemplate: `Hai! 👋

Sudah waktunya memberikan nutrisi nih! 💊
Jangan lupa lapor pemberian nutrisi untuk ${data.nama}, ya. Biar semua tetap tercatat dan nggak ada yang kelewat.

Klik di sini buat lapor sekarang! 💊`,
          notificationType: notifikasi.vitamin.notificationType,
          tipeLaporan: "vitamin",
          dayOfWeek: notifikasi.vitamin.dayOfWeek ?? null,
          dayOfMonth: notifikasi.vitamin.dayOfMonth ?? null,
          scheduledTime: notifikasi.vitamin.scheduledTime,
          isActive: true,
          isDeleted: false,
        },
        { transaction: t }
      );
    }

    await t.commit();

    res.locals.createdData = data.toJSON();

    return res.status(201).json({
      message: "Successfully created new unit budidaya data",
      data: {
        unitBudidaya: data,
        objekBudidaya: createdObjekList,
      },
    });
  } catch (error) {
    t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const updateUnitBudidaya = async (req, res) => {
  const t = await db.transaction();

  try {
    const payload = { ...req.body };
    const validationError = normalizeUmurMinggu(payload);

    if (validationError) {
      await t.rollback();
      return res.status(400).json({ message: validationError });
    }

    const jenisBudidaya = await JenisBudidaya.findOne({
      where: {
        id: payload.jenisBudidayaId,
        isDeleted: false,
      },
    });

    const data = await UnitBudidaya.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    await UnitBudidaya.update(payload, {
      transaction: t,
      where: {
        id: req.params.id,
      },
    });

    const updated = { id: data.id, ...payload };

    if (data.tipe.toLowerCase() != updated.tipe.toLowerCase()) {
      console.log(updated);
      if (updated.tipe.toLowerCase() == "individu") {
        const objekList = Array.from({ length: updated.jumlah }, (_, i) => {
          const prefix = jenisBudidaya.tipe === "hewan" ? "Ternak" : "Tanaman";
          const deskripsi = `${prefix} ${jenisBudidaya.nama} pada ${
            data.nama
          } nomor ${i + 1}`;

          return {
            UnitBudidayaId: updated.id,
            namaId: `${jenisBudidaya.nama} #${i + 1}`,
            status: true,
            deskripsi,
            isDeleted: false,
          };
        });

        const createdObjekList = await ObjekBudidaya.bulkCreate(objekList, {
          transaction: t,
          returning: true,
        });

        console.log("createdObjekList", createdObjekList);

        for (const obj of createdObjekList) {
          await Logs.create({
            tableName: "ObjekBudidaya",
            action: "create",
            recordId: obj.id,
            before: null,
            after: obj.toJSON(),
            changedBy: req.user?.id,
          });
        }
      } else {
        const dataObjekBudidaya = await ObjekBudidaya.findAll({
          where: {
            UnitBudidayaId: req.params.id,
            isDeleted: false,
          },
        });

        for (const obj of dataObjekBudidaya) {
          await ObjekBudidaya.update(
            { isDeleted: true },
            {
              transaction: t,
              where: {
                id: obj.id,
              },
            }
          );
        }

        res.locals.updatedData = dataObjekBudidaya;
      }
    }

    if (data.tipe == "individu" && data.jumlah != updated.jumlah) {
      if (updated.jumlah < data.jumlah) {
        const dataObjekBudidaya = await ObjekBudidaya.findAll({
          where: {
            UnitBudidayaId: req.params.id,
            isDeleted: false,
          },
          order: [
            [db.fn("length", db.col("namaId")), "ASC"],
            ["namaId", "ASC"],
          ],
        });
        for (const [index, obj] of dataObjekBudidaya.entries()) {
          if (index >= updated.jumlah) {
            await ObjekBudidaya.update(
              { isDeleted: true },
              {
                transaction: t,
                where: {
                  id: obj.id,
                },
              }
            );
          }
        }
      }

      if (updated.jumlah > data.jumlah) {
        const objekList = Array.from(
          { length: updated.jumlah - data.jumlah },
          (_, i) => {
            const prefix =
              jenisBudidaya.tipe === "hewan" ? "Ternak" : "Tanaman";
            const deskripsi = `${prefix} ${jenisBudidaya.nama} pada ${
              data.nama
            } nomor ${data.jumlah + i + 1}`;

            return {
              UnitBudidayaId: updated.id,
              namaId: `${jenisBudidaya.nama} #${data.jumlah + i + 1}`,
              status: true,
              deskripsi,
              isDeleted: false,
            };
          }
        );

        createdObjekList = await ObjekBudidaya.bulkCreate(objekList, {
          transaction: t,
          returning: true,
        });

        for (const obj of createdObjekList) {
          await Logs.create({
            tableName: "ObjekBudidaya",
            action: "create",
            recordId: obj.id,
            before: null,
            after: obj.toJSON(),
            changedBy: req.user?.id,
          });
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(updated, "notifikasi")) {
      const { notifikasi = {} } = updated;
      if (notifikasi?.panen != null) {
      const panenNotifData = {
        unitBudidayaId: updated.id,
        title: `Pengingat Laporan Panen ${updated.nama ?? data.nama}`,
        messageTemplate: `Hai! 👋

Sudah waktunya panen nih! 🌾
Jangan lupa lapor panen untuk ${
          updated.nama ?? data.nama
        }, ya. Biar semua tetap tercatat dan nggak ada yang kelewat.

Klik di sini buat lapor sekarang! 🌾`,
        notificationType: notifikasi.panen.notificationType,
        tipeLaporan: "panen",
        dayOfWeek: notifikasi.panen.dayOfWeek ?? null,
        dayOfMonth: notifikasi.panen.dayOfMonth ?? null,
        scheduledTime: notifikasi.panen.scheduledTime,
        isActive: true,
        isDeleted: false,
      };
      if (notifikasi.panen.id != null) {
        panenNotifData.id = notifikasi.panen.id;
      }
      await ScheduledUnitNotification.upsert(panenNotifData, {
        transaction: t,
      });
    } else {
      await ScheduledUnitNotification.update(
        {
          isDeleted: true,
          isActive: false,
        },
        {
          where: {
            unitBudidayaId: updated.id,
            tipeLaporan: "panen",
          },
          transaction: t,
        }
      );
    }
      if (notifikasi?.vitamin != null) {
      const vitaminNotifData = {
        unitBudidayaId: updated.id,
        title: `Pengingat Pemberian Vitamin ${updated.nama ?? data.nama}`,
        messageTemplate: `Hai! 👋

Sudah waktunya memberikan nutrisi nih! 💊
Jangan lupa lapor pemberian nutrisi untuk ${
          updated.nama ?? data.nama
        }, ya. Biar semua tetap tercatat dan nggak ada yang kelewat.

Klik di sini buat lapor sekarang! 💊`,
        notificationType: notifikasi.vitamin.notificationType,
        tipeLaporan: "vitamin",
        dayOfWeek: notifikasi.vitamin.dayOfWeek ?? null,
        dayOfMonth: notifikasi.vitamin.dayOfMonth ?? null,
        scheduledTime: notifikasi.vitamin.scheduledTime,
        isActive: true,
        isDeleted: false,
      };
      if (notifikasi.vitamin.id != null) {
        vitaminNotifData.id = notifikasi.vitamin.id;
      }
      await ScheduledUnitNotification.upsert(vitaminNotifData, {
        transaction: t,
      });
    } else {
      await ScheduledUnitNotification.update(
        {
          isDeleted: true,
          isActive: false,
        },
        {
          where: {
            unitBudidayaId: updated.id,
            tipeLaporan: "vitamin",
          },
          transaction: t,
        }
      );
      }
    }

    await t.commit();

    const updatedData = await UnitBudidaya.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    res.locals.updatedData = updatedData.toJSON();

    return res.status(200).json({
      message: "Successfully updated unit budidaya data",
      data: {
        id: updatedData.id,
        ...updatedData.toJSON(),
        unitBudidaya: updatedData,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const deleteUnitBudidaya = async (req, res) => {
  try {
    const data = await UnitBudidaya.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({ message: "Data not found" });
    }

    if (data["tipe"] == "individu") {
      const dataObjekBudidaya = await ObjekBudidaya.findAll({
        where: {
          UnitBudidayaId: req.params.id,
          isDeleted: false,
        },
      });
      dataObjekBudidaya.forEach(async (obj) => {
        await ObjekBudidaya.update(
          { isDeleted: true },
          {
            where: {
              id: obj.id,
            },
          }
        );
      });

      res.locals.updatedData = dataObjekBudidaya;
    }

    await ScheduledUnitNotification.update(
      { isDeleted: true, isActive: false },
      {
        where: {
          unitBudidayaId: req.params.id,
        },
      }
    );

    data.isDeleted = true;
    await data.save();

    res.locals.updatedData = data;

    return res
      .status(200)
      .json({ message: "Successfully deleted unit budidaya data" });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getUnitBudidayaByTipe = async (req, res) => {
  try {
    const { tipe } = req.params;

    const data = await UnitBudidaya.findAll({
      include: [
        {
          model: JenisBudidaya,
          where: {
            tipe: tipe,
          },
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    return res.status(200).json({
      message: "Successfully retrieved unit budidaya data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

module.exports = {
  getAllUnitBudidaya,
  getUnitBudidayaById,
  getUnitBudidayaByName,
  getUnitBudidayaByJenisBudidaya,
  createUnitBudidaya,
  updateUnitBudidaya,
  deleteUnitBudidaya,
  getUnitBudidayaByTipe,
};
