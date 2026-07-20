const { Op } = require("sequelize");
const {
  HealthIndication,
  HealthIndicationObject,
  UnitBudidaya,
  ObjekBudidaya,
} = require("../../model/index");

const STATUS_VALUES = ["pending", "checked", "dismissed"];

function parseLimit(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : 20;
}

function parsePage(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function numberOrNull(value) {
  return value === null || value === undefined ? null : Number(value);
}

function objectPayload(item) {
  const objek = item.ObjekBudidaya;

  return {
    id: item.id,
    objekBudidayaId: item.objekBudidayaId,
    namaId: item.namaId || objek?.namaId || null,
    dropPercent: numberOrNull(item.dropPercent),
    dropPoints: numberOrNull(item.dropPoints),
    currentLayingPercent: numberOrNull(item.currentLayingPercent),
    previousLayingPercent: numberOrNull(item.previousLayingPercent),
    currentLayingDays: item.currentLayingDays,
    previousLayingDays: item.previousLayingDays,
    status: item.status,
    checkedAt: item.checkedAt,
    objekBudidaya: objek
      ? {
        id: objek.id,
        namaId: objek.namaId,
        status: objek.status,
        deskripsi: objek.deskripsi,
      }
      : null,
  };
}

function indicationPayload(item) {
  const objects = item.objects || [];
  const unit = item.UnitBudidaya;

  return {
    id: item.id,
    unitBudidayaId: item.unitBudidayaId,
    unitBudidayaNama: unit?.nama || null,
    source: item.source,
    indicationCode: item.indicationCode,
    analysisMode: item.analysisMode,
    title: item.title,
    message: item.message,
    severity: item.severity,
    status: item.status,
    period: {
      start: item.periodStart,
      end: item.periodEnd,
      days: item.periodDays,
    },
    thresholdPercent: numberOrNull(item.thresholdPercent),
    affectedObjectCount: item.affectedObjectCount,
    detectedAt: item.detectedAt,
    checkedAt: item.checkedAt,
    objects: objects.map(objectPayload),
  };
}

function includeRelations(objectStatus = null) {
  const objectWhere = { isDeleted: false };

  if (objectStatus && objectStatus !== "all") {
    objectWhere.status = objectStatus;
  }

  return [
    {
      model: UnitBudidaya,
      attributes: ["id", "nama", "tipe", "lokasi"],
      required: false,
    },
    {
      model: HealthIndicationObject,
      as: "objects",
      where: objectWhere,
      required: false,
      include: [
        {
          model: ObjekBudidaya,
          attributes: ["id", "namaId", "status", "deskripsi"],
          required: false,
        },
      ],
    },
  ];
}

function baseWhere(query = {}) {
  const status = query.status || "pending";
  const where = { isDeleted: false };

  if (status !== "all") {
    where.status = STATUS_VALUES.includes(status) ? status : "pending";
  }

  if (query.unitBudidayaId) {
    where.unitBudidayaId = query.unitBudidayaId;
  }

  if (query.indicationCode) {
    where.indicationCode = query.indicationCode;
  }

  if (query.severity) {
    where.severity = query.severity;
  }

  if (query.startDate || query.endDate) {
    where.detectedAt = {};

    if (query.startDate) {
      where.detectedAt[Op.gte] = new Date(`${query.startDate}T00:00:00.000Z`);
    }

    if (query.endDate) {
      where.detectedAt[Op.lte] = new Date(`${query.endDate}T23:59:59.999Z`);
    }
  }

  return where;
}

async function getPendingIndications(req, res) {
  try {
    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);
    const offset = (page - 1) * limit;
    const { count, rows } = await HealthIndication.findAndCountAll({
      where: baseWhere(req.query),
      include: includeRelations(req.query.objectStatus || req.query.status || "pending"),
      order: [["detectedAt", "DESC"], ["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      status: true,
      success: true,
      message: "Successfully retrieved health indication data",
      data: rows.map(indicationPayload),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      success: false,
      message: error.message,
    });
  }
}

async function getIndicationById(req, res) {
  try {
    const data = await HealthIndication.findOne({
      where: {
        id: req.params.id,
        isDeleted: false,
      },
      include: includeRelations("all"),
    });

    if (!data) {
      return res.status(404).json({
        status: false,
        success: false,
        message: "Health indication data not found",
      });
    }

    return res.status(200).json({
      status: true,
      success: true,
      message: "Successfully retrieved health indication data",
      data: indicationPayload(data),
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      success: false,
      message: error.message,
    });
  }
}

async function updateIndicationStatus(req, res) {
  try {
    const status = req.body.status;

    if (!STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        status: false,
        success: false,
        message: "status wajib diisi dengan pending, checked, atau dismissed",
      });
    }

    const data = await HealthIndication.findOne({
      where: {
        id: req.params.id,
        isDeleted: false,
      },
      include: includeRelations("all"),
    });

    if (!data) {
      return res.status(404).json({
        status: false,
        success: false,
        message: "Health indication data not found",
      });
    }

    const checkedAt = status === "pending" ? null : new Date();
    await data.update({
      status,
      checkedAt,
      checkedBy: status === "pending" ? null : req.user?.id || null,
    });

    await HealthIndicationObject.update(
      {
        status,
        checkedAt,
      },
      {
        where: {
          healthIndicationId: data.id,
          isDeleted: false,
        },
      }
    );

    const updated = await HealthIndication.findOne({
      where: { id: data.id, isDeleted: false },
      include: includeRelations("all"),
    });

    return res.status(200).json({
      status: true,
      success: true,
      message: "Health indication status updated successfully",
      data: indicationPayload(updated),
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getPendingIndications,
  getIndicationById,
  updateIndicationStatus,
};
