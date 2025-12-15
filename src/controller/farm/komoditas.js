const sequelize = require("../../model/index");
const db = sequelize.sequelize;
const Komoditas = sequelize.Komoditas;
const JenisBudidaya = sequelize.JenisBudidaya;
const Satuan = sequelize.Satuan;
const Produk = sequelize.Produk;
const Op = sequelize.Sequelize.Op;

const { getPaginationOptions } = require("../../utils/paginationUtils");

const getAllKomoditas = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await Komoditas.findAndCountAll({
      where: {
        isDeleted: false,
      },
      include: [
        {
          model: JenisBudidaya,
          required: true,
        },
        {
          model: Satuan,
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data not found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved all komoditas data",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKomoditasById = async (req, res) => {
  try {
    const data = await Komoditas.findOne({
      where: {
        id: req.params.id,
        isDeleted: false,
      },
      include: [
        {
          model: Satuan,
          required: true,
        },
        {
          model: JenisBudidaya,
          required: true,
        },
      ],
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved komoditas data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKomoditasSearch = async (req, res) => {
  try {
    const { nama, tipe } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const whereClause = {
      isDeleted: false,
    };
    if (nama && nama.toLowerCase() !== "all" && nama.trim() !== "") {
      whereClause.nama = {
        [Op.like]: `%${nama}%`,
      };
    }

    const includeClause = [
      {
        model: JenisBudidaya,
        required: true,
      },
      {
        model: Satuan,
        required: false,
      },
    ];
    if (tipe && tipe.toLowerCase() !== "all" && tipe.trim() !== "") {
      includeClause[0].where = { tipe: tipe };
    }

    const { count, rows } = await Komoditas.findAndCountAll({
      include: includeClause,
      where: whereClause,
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data not found for the given search criteria",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved komoditas data",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    console.error("Error in getKomoditasSearch:", error);
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getKomoditasByTipe = async (req, res) => {
  try {
    const { tipe } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await Komoditas.findAndCountAll({
      include: [
        {
          model: JenisBudidaya,
          required: true,
          where: {
            tipe: tipe,
          },
        },
        {
          model: Satuan,
          required: false,
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    if (rows.length === 0 && parseInt(page, 10) === 1) {
      return res.status(200).json({
        message: "Data not found for this type",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }
    if (rows.length === 0 && parseInt(page, 10) > 1) {
      return res.status(200).json({
        message: "No more data for this type",
        data: [],
        totalItems: count,
        totalPages: Math.ceil(count / paginationOptions.limit),
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved komoditas data by type",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createKomoditas = async (req, res) => {
  try {
    const data = await Komoditas.create({
      ...req.body,
      SatuanId: req.body.SatuanId,
      JenisBudidayaId: req.body.JenisBudidayaId,
    });

    const createdDataWithIncludes = await Komoditas.findOne({
      where: { id: data.id },
      include: [{ model: JenisBudidaya }, { model: Satuan }],
    });

    res.locals.createdData = createdDataWithIncludes.toJSON();

    return res.status(201).json({
      message: "Successfully created new komoditas data",
      data: createdDataWithIncludes,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const updateKomoditas = async (req, res) => {
  const t = await db.transaction();

  try {
    const komoditasInstance = await Komoditas.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!komoditasInstance) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    const produk = await Produk.findOne({
      where: { id: komoditasInstance.produkId, isDeleted: false },
    });

    if (produk) {
      await produk.update(
        {
          nama: req.body.nama,
          stok: req.body.jumlah,
        },
        { transaction: t }
      );
    }

    await komoditasInstance.update(req.body, {
      transaction: t,
    });

    await t.commit();

    const updatedDataWithIncludes = await Komoditas.findOne({
      where: { id: req.params.id },
      include: [{ model: JenisBudidaya }, { model: Satuan }],
    });

    res.locals.updatedData = updatedDataWithIncludes.toJSON();

    return res.status(200).json({
      message: "Successfully updated komoditas data",
      data: updatedDataWithIncludes,
    });
  } catch (error) {
    await t.rollback();

    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const deleteKomoditas = async (req, res) => {
  const t = await db.transaction();
  try {
    const data = await Komoditas.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    const produkInstance = await Produk.findOne({
      where: { id: data.produkId, isDeleted: false },
    });

    if (!data) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    if (produkInstance) {
      await produkInstance.update(
        {
          isDeleted: true,
        },
        { transaction: t }
      );
    }

    data.isDeleted = true;
    await data.save({ transaction: t });

    await t.commit();

    res.locals.updatedData = data.toJSON();

    return res.status(200).json({
      message: "Successfully deleted komoditas data",
      data: { id: req.params.id },
    });
  } catch (error) {
    await t.rollback();

    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getAllKomoditasWithoutProduk = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await Komoditas.findAndCountAll({
      where: {
        isDeleted: false,
        [Op.or]: [{ ProdukId: null }, { "$Produk.isDeleted$": true }],
      },
      include: [
        {
          model: JenisBudidaya,
          required: true,
        },
        {
          model: Satuan,
          required: false,
        },
        {
          model: Produk,
          required: false,
          attributes: ["id", "isDeleted"],
        },
      ],
      order: [["createdAt", "DESC"]],
      ...paginationOptions,
    });

    if (rows.length === 0) {
      return res.status(200).json({
        message: "Data not found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved komoditas data without produk",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

module.exports = {
  getAllKomoditas,
  getKomoditasById,
  getKomoditasSearch,
  createKomoditas,
  updateKomoditas,
  deleteKomoditas,
  getKomoditasByTipe,
  getAllKomoditasWithoutProduk,
};
