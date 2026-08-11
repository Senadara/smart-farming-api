const sequelize = require("../../model/index");
const Op = sequelize.Sequelize.Op;
const Satuan = sequelize.Satuan;
const Inventaris = sequelize.Inventaris;
const Komoditas = sequelize.Komoditas;
const { dataValid } = require("../../validation/dataValidation");
const { getPaginationOptions } = require("../../utils/paginationUtils");

const normalizeMasterValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const displayMasterValue = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const findSatuanByNormalizedField = async (field, value, { isDeleted, excludeId } = {}) => {
  const where = {};
  if (typeof isDeleted === "boolean") {
    where.isDeleted = isDeleted;
  }
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const normalized = normalizeMasterValue(value);
  const rows = await Satuan.findAll({ where });

  return rows.find((row) => normalizeMasterValue(row[field]) === normalized) || null;
};

const getAllSatuan = async (req, res) => {
  try {
    const { page, limit, nama, lambang } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);
    const whereClause = { isDeleted: false };

    // Jika ada pencarian, cari di nama ATAU lambang dengan query yang sama
    if ((nama && nama.trim() !== "") || (lambang && lambang.trim() !== "")) {
      const searchQuery = nama || lambang; // ambil query dari parameter mana saja yang ada
      whereClause[Op.or] = [
        { nama: { [Op.like]: `%${searchQuery}%` } },
        { lambang: { [Op.like]: `%${searchQuery}%` } },
      ];
    }

    const { count, rows } = await Satuan.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    const currentPageNum = parseInt(page, 10) || 1;
    const totalPages = Math.ceil(
      count / (paginationOptions.limit || parseInt(limit, 10) || 10)
    );
    if (rows.length === 0) {
      return res.status(200).json({
        message: currentPageNum > 1 ? "No more data" : "Data not found",
        data: [],
        totalItems: count,
        totalPages: totalPages,
        currentPage: currentPageNum,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved all satuan data",
      data: rows,
      totalItems: count,
      totalPages: totalPages,
      currentPage: currentPageNum,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getSatuanById = async (req, res) => {
  try {
    const data = await Satuan.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved satuan data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getSatuanSearch = async (req, res) => {
  try {
    const { nama, lambang } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await Satuan.findAndCountAll({
      where: {
        [Op.or]: [
          { nama: { [Op.like]: `%${nama}%` } },
          { lambang: { [Op.like]: `%${lambang}%` } },
        ],
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    const currentPageNum = parseInt(page, 10) || 1;
    const totalPages = Math.ceil(
      count / (paginationOptions.limit || parseInt(limit, 10) || 10)
    );

    if (rows.length === 0) {
      return res.status(200).json({
        message:
          currentPageNum > 1
            ? "No more data for this search"
            : "Data not found for this search",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: currentPageNum,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved satuan data",
      data: rows,
      totalItems: count,
      totalPages: totalPages,
      currentPage: currentPageNum,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createSatuan = async (req, res) => {
  const valid = {
    nama: "required",
    lambang: "required",
  };
  const validation = await dataValid(valid, req.body);
  if (validation.message.length > 0) {
    return res.status(400).json({
      error: validation.message,
      message: "Validation error",
    });
  }

  try {
    const normalizedPayload = {
      ...req.body,
      nama: displayMasterValue(req.body.nama),
      lambang: displayMasterValue(req.body.lambang),
    };

    // Cek apakah ada data dengan nama yang sama yang sudah di-soft delete
    const softDeleted = await findSatuanByNormalizedField("nama", normalizedPayload.nama, {
      isDeleted: true,
    });

    if (softDeleted) {
      const existingLambang = await findSatuanByNormalizedField("lambang", normalizedPayload.lambang, {
        excludeId: softDeleted.id,
      });

      if (existingLambang) {
        return res.status(400).json({
          status: false,
          message:
            "Satuan dengan lambang tersebut sudah ada. Silakan gunakan lambang yang berbeda.",
        });
      }

      // Restore data yang sudah di-soft delete dengan update semua field
      await Satuan.update(
        {
          ...normalizedPayload,
          isDeleted: false,
          updatedAt: new Date(),
        },
        {
          where: { id: softDeleted.id },
        }
      );

      const restoredData = await Satuan.findOne({
        where: { id: softDeleted.id },
      });

      res.locals.createdData = restoredData.toJSON();

      return res.status(201).json({
        status: true,
        message:
          "Data with this name existed before and has been restored with new information",
        data: restoredData,
      });
    }

    // Cek apakah ada data aktif dengan nama yang sama
    const existingNama = await findSatuanByNormalizedField("nama", normalizedPayload.nama, {
      isDeleted: false,
    });

    if (existingNama) {
      return res.status(400).json({
        status: false,
        message:
          "Satuan dengan nama tersebut sudah ada. Silakan gunakan nama yang berbeda.",
      });
    }

    // Cek apakah ada data aktif dengan lambang yang sama
    const existingLambang = await findSatuanByNormalizedField("lambang", normalizedPayload.lambang);

    if (existingLambang) {
      return res.status(400).json({
        status: false,
        message:
          "Satuan dengan lambang tersebut sudah ada. Silakan gunakan lambang yang berbeda.",
      });
    }

    // Buat data baru jika tidak ada duplikasi
    const data = await Satuan.create({
      ...normalizedPayload,
      isDeleted: false,
    });

    res.locals.createdData = data.toJSON();

    return res.status(201).json({
      status: true,
      message: "Successfully created new satuan data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const updateSatuan = async (req, res) => {
  try {
    const data = await Satuan.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        status: false,
        message: "Data not found",
      });
    }

    // Jika nama diubah, cek apakah nama baru sudah ada
    if (req.body.nama) {
      req.body.nama = displayMasterValue(req.body.nama);
      const existing = await findSatuanByNormalizedField("nama", req.body.nama, {
        excludeId: req.params.id,
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message:
            "Satuan dengan nama tersebut sudah ada. Silakan gunakan nama yang berbeda.",
        });
      }
    }

    // Jika lambang diubah, cek apakah lambang baru sudah ada
    if (req.body.lambang) {
      req.body.lambang = displayMasterValue(req.body.lambang);
      const existing = await findSatuanByNormalizedField("lambang", req.body.lambang, {
        excludeId: req.params.id,
      });

      if (existing) {
        return res.status(400).json({
          status: false,
          message:
            "Satuan dengan lambang tersebut sudah ada. Silakan gunakan lambang yang berbeda.",
        });
      }
    }

    await Satuan.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    const updated = await Satuan.findOne({ where: { id: req.params.id } });

    res.locals.updatedData = updated.toJSON();

    return res.status(200).json({
      status: true,
      message: "Successfully updated satuan data",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

const deleteSatuan = async (req, res) => {
  try {
    const data = await Satuan.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        status: false,
        message: "Data not found",
      });
    }

    // Check if satuan is being used in other tables
    const inventarisCount = await Inventaris.count({
      where: {
        satuanId: req.params.id,
        isDeleted: false,
      },
    });

    const komoditasCount = await Komoditas.count({
      where: {
        satuanId: req.params.id,
        isDeleted: false,
      },
    });

    const totalUsage = inventarisCount + komoditasCount;

    if (totalUsage > 0) {
      let usageDetails = [];
      if (inventarisCount > 0) {
        usageDetails.push(`${inventarisCount} inventaris`);
      }
      if (komoditasCount > 0) {
        usageDetails.push(`${komoditasCount} komoditas`);
      }

      return res.status(400).json({
        status: false,
        message: `Satuan tidak dapat dihapus karena masih digunakan oleh ${usageDetails.join(
          " dan "
        )}. Silakan periksa terlebih dahulu.`,
      });
    }

    data.isDeleted = true;
    await data.save();

    res.locals.updatedData = data;

    return res.status(200).json({
      status: true,
      message: "Successfully deleted satuan data",
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
      detail: error,
    });
  }
};

module.exports = {
  getAllSatuan,
  getSatuanById,
  getSatuanSearch,
  getSatuanByName: getSatuanSearch,
  createSatuan,
  updateSatuan,
  deleteSatuan,
};
