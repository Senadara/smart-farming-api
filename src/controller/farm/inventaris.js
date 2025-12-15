const { QueryTypes, Op, fn, col } = require("sequelize");
const sequelize = require("../../model/index");
const db = sequelize.sequelize;
const Inventaris = sequelize.Inventaris;
const Satuan = sequelize.Satuan;
const Kategori = sequelize.KategoriInventaris;
const PenggunaanInventaris = sequelize.PenggunaanInventaris;
const Vitamin = sequelize.Vitamin;
const Laporan = sequelize.Laporan;
const User = sequelize.User;

const { getPaginationOptions } = require("../../utils/paginationUtils");

// Helper function to determine if inventory uses Vitamin table or PenggunaanInventaris table
const shouldUseVitaminTable = (kategoriNama) => {
  const vitaminCategories = ["pupuk", "vitamin", "vaksin", "disinfektan"];
  return vitaminCategories.some((cat) =>
    kategoriNama.toLowerCase().includes(cat.toLowerCase())
  );
};

const getAllInventaris = async (req, res) => {
  try {
    const { page, limit, kategoriId, nama } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const whereClause = { isDeleted: false };
    if (kategoriId && kategoriId !== "all" && kategoriId.trim() !== "") {
      whereClause.KategoriInventarisId = kategoriId;
    }
    if (nama && nama.trim() !== "") {
      whereClause.nama = { [Op.like]: `%${nama}%` };
    }

    const { count, rows } = await Inventaris.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
        { model: Satuan, attributes: ["id", "nama", "lambang"] },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
      ...paginationOptions,
    });

    if (rows.length === 0 && (parseInt(page, 10) || 1) === 1) {
      return res.status(200).json({
        message: "Data not found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }
    if (rows.length === 0 && (parseInt(page, 10) || 1) > 1) {
      return res.status(200).json({
        message: "No more data",
        data: [],
        totalItems: count,
        totalPages: Math.ceil(count / paginationOptions.limit),
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved all inventaris data",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    console.error("Error getAllInventaris:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getInventarisById = async (req, res) => {
  try {
    const { id } = req.params;

    const inventarisData = await Inventaris.findOne({
      where: { id: id, isDeleted: false },
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
        { model: Satuan, attributes: ["id", "nama", "lambang"] },
      ],
    });

    if (!inventarisData || inventarisData.isDeleted) {
      return res.status(404).json({ message: "Data not found" });
    }

    // Last 7 days of usage
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Determine which table to use based on category
    const useVitaminTable = shouldUseVitaminTable(
      inventarisData.kategoriInventaris?.nama || ""
    );

    let pemakaianTerakhir7Hari;

    if (useVitaminTable) {
      pemakaianTerakhir7Hari = await Vitamin.findAll({
        attributes: [
          [fn("DATE", col("Vitamin.createdAt")), "tanggal"],
          [fn("SUM", col("jumlah")), "stokPemakaian"],
        ],
        where: {
          inventarisId: id,
          isDeleted: false,
          createdAt: {
            [Op.gte]: sevenDaysAgo,
            [Op.lte]: today,
          },
        },
        group: [fn("DATE", col("Vitamin.createdAt"))],
        order: [[fn("DATE", col("Vitamin.createdAt")), "ASC"]],
        raw: true,
      });
    } else {
      pemakaianTerakhir7Hari = await PenggunaanInventaris.findAll({
        attributes: [
          [fn("DATE", col("PenggunaanInventaris.createdAt")), "tanggal"],
          [fn("SUM", col("jumlah")), "stokPemakaian"],
        ],
        where: {
          inventarisId: id,
          isDeleted: false,
          createdAt: {
            [Op.gte]: sevenDaysAgo,
            [Op.lte]: today,
          },
        },
        group: [fn("DATE", col("PenggunaanInventaris.createdAt"))],
        order: [[fn("DATE", col("PenggunaanInventaris.createdAt")), "ASC"]],
        raw: true,
      });
    }

    const allDatesLast7Days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      allDatesLast7Days.push(date.toISOString().split("T")[0]);
    }
    allDatesLast7Days.reverse(); // from oldest to newest

    const defaultChartData = allDatesLast7Days.map((dateStr) => {
      const found = pemakaianTerakhir7Hari.find((p) => p.tanggal === dateStr);
      return {
        period: dateStr,
        stokPemakaian: found ? parseFloat(found.stokPemakaian) : 0,
      };
    });

    return res.status(200).json({
      message: "Successfully retrieved inventaris data",
      data: {
        inventaris: inventarisData,
        defaultChartData: defaultChartData,
      },
    });
  } catch (error) {
    console.error("Error getInventarisById:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getStatistikPemakaianInventaris = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate || !groupBy) {
      return res.status(400).json({
        message:
          "startDate, endDate, and groupBy query parameters are required.",
      });
    }

    // Get inventory data to determine which table to use
    const inventarisData = await Inventaris.findOne({
      where: { id: id, isDeleted: false },
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
      ],
    });

    if (!inventarisData) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const useVitaminTable = shouldUseVitaminTable(
      inventarisData.kategoriInventaris?.nama || ""
    );

    let dateColumn;
    const tableName = useVitaminTable ? "Vitamin" : "PenggunaanInventaris";

    switch (groupBy) {
      case "day":
        dateColumn = fn("DATE", col(`${tableName}.createdAt`));
        break;
      case "month":
        dateColumn = fn(
          "DATE_FORMAT",
          col(`${tableName}.createdAt`),
          "%Y-%m-01"
        );
        break;
      case "year":
        dateColumn = fn(
          "DATE_FORMAT",
          col(`${tableName}.createdAt`),
          "%Y-01-01"
        );
        break;
      default:
        return res.status(400).json({
          message: "Invalid groupBy value. Use 'day', 'month', or 'year'.",
        });
    }

    let statistik;

    if (useVitaminTable) {
      statistik = await Vitamin.findAll({
        attributes: [
          [dateColumn, "period"],
          [fn("SUM", col("jumlah")), "stokPemakaian"],
        ],
        where: {
          inventarisId: id,
          isDeleted: false,
          createdAt: {
            [Op.between]: [
              new Date(startDate),
              new Date(endDate + "T23:59:59.999Z"),
            ],
          },
        },
        group: ["period"],
        order: [["period", "ASC"]],
        raw: true,
      });
    } else {
      statistik = await PenggunaanInventaris.findAll({
        attributes: [
          [dateColumn, "period"],
          [fn("SUM", col("jumlah")), "stokPemakaian"],
        ],
        where: {
          inventarisId: id,
          isDeleted: false,
          createdAt: {
            [Op.between]: [
              new Date(startDate),
              new Date(endDate + "T23:59:59.999Z"),
            ],
          },
        },
        group: ["period"],
        order: [["period", "ASC"]],
        raw: true,
      });
    }

    console.log("Backend Query Result (statistik):", statistik);

    return res.status(200).json({
      message: "Successfully retrieved usage statistics",
      data: statistik.map((s) => ({
        ...s,
        stokPemakaian: parseFloat(s.stokPemakaian),
      })),
    });
  } catch (error) {
    console.error("Error getStatistikPemakaianInventaris:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getRiwayatPemakaianInventarisPaginated = async (req, res) => {
  try {
    const { id: inventarisId } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    // Get inventory data to determine which table to use
    const inventarisData = await Inventaris.findOne({
      where: { id: inventarisId, isDeleted: false },
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
      ],
    });

    if (!inventarisData) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const useVitaminTable = shouldUseVitaminTable(
      inventarisData.kategoriInventaris?.nama || ""
    );

    let count, rows;

    if (useVitaminTable) {
      const result = await Vitamin.findAndCountAll({
        where: {
          inventarisId: inventarisId,
          isDeleted: false,
        },
        include: [
          {
            model: Laporan,
            attributes: ["id", "gambar", "createdAt", "userId"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
              },
            ],
          },
          {
            model: Inventaris,
            as: "inventaris",
            attributes: ["nama"],
          },
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        ...paginationOptions,
      });
      count = result.count;
      rows = result.rows;
    } else {
      const result = await PenggunaanInventaris.findAndCountAll({
        where: {
          inventarisId: inventarisId,
          isDeleted: false,
        },
        include: [
          {
            model: Laporan,
            as: "laporan",
            attributes: ["id", "gambar", "createdAt", "userId"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
              },
            ],
          },
          {
            model: Inventaris,
            as: "inventaris",
            attributes: ["nama"],
          },
        ],
        order: [["createdAt", "DESC"]],
        distinct: true,
        ...paginationOptions,
      });
      count = result.count;
      rows = result.rows;
    }

    const formattedRows = rows.map((item) => {
      return {
        id: item.id,
        jumlah: item.jumlah,
        createdAt: item.createdAt,
        inventarisId: item.inventarisId,
        inventarisNama: item.inventaris?.nama || "Unknown",
        laporanGambar: useVitaminTable
          ? item.Laporan?.gambar
          : item.laporan?.gambar,
        petugasNama: useVitaminTable
          ? item.Laporan?.user?.name || "Unknown"
          : item.laporan?.user?.name || "Unknown",
        laporanTanggal: (
          useVitaminTable ? item.Laporan?.createdAt : item.laporan?.createdAt
        )
          ? new Date(
              useVitaminTable ? item.Laporan.createdAt : item.laporan.createdAt
            ).toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Unknown date",
        laporanWaktu: (
          useVitaminTable ? item.Laporan?.createdAt : item.laporan?.createdAt
        )
          ? new Date(
              useVitaminTable ? item.Laporan.createdAt : item.laporan.createdAt
            ).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Unknown time",
        laporanId: useVitaminTable ? item.Laporan?.id : item.laporan?.id,
      };
    });

    if (rows.length === 0 && (parseInt(page, 10) || 1) === 1) {
      return res.status(200).json({
        message: "No usage history found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }
    if (rows.length === 0 && (parseInt(page, 10) || 1) > 1) {
      return res.status(200).json({
        message: "No more usage history",
        data: [],
        totalItems: count,
        totalPages: Math.ceil(count / paginationOptions.limit),
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved usage history",
      data: formattedRows,
      totalItems: count,
      totalPages: Math.ceil(count / (paginationOptions.limit || limit)),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    console.error("Error getRiwayatPemakaianInventarisPaginated:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getInventarisByName = async (req, res) => {
  try {
    const { nama } = req.params;
    const { page, limit } = req.query;
    const paginationOptions = getPaginationOptions(page, limit);

    const { count, rows } = await Inventaris.findAndCountAll({
      where: {
        nama: { [Op.like]: `%${nama}%` },
        isDeleted: false,
      },
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
        { model: Satuan, attributes: ["id", "nama", "lambang"] },
      ],
      order: [["createdAt", "DESC"]],
      distinct: true,
      ...paginationOptions,
    });

    if (rows.length === 0 && (parseInt(page, 10) || 1) === 1) {
      return res.status(200).json({
        message: "Data not found",
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: parseInt(page, 10) || 1,
      });
    }
    if (rows.length === 0 && (parseInt(page, 10) || 1) > 1) {
      return res.status(200).json({
        message: "No more data",
        data: [],
        totalItems: count,
        totalPages: Math.ceil(count / paginationOptions.limit),
        currentPage: parseInt(page, 10) || 1,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved inventaris data",
      data: rows,
      totalItems: count,
      totalPages: Math.ceil(count / paginationOptions.limit),
      currentPage: parseInt(page, 10) || 1,
    });
  } catch (error) {
    console.error("Error getInventaris:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getInventarisByKategoriName = async (req, res) => {
  try {
    const { kategori } = req.params;

    const data = await Inventaris.findAll({
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          where: {
            nama: {
              [Op.like]: `%${kategori}%`,
            },
          },
          attributes: ["id", "nama"],
        },
      ],
      where: {
        isDeleted: false,
        jumlah: {
          [Op.gt]: 0,
        },
        // Show items that either have no expiration date (null) OR are not expired yet
        [Op.or]: [
          { tanggalKadaluwarsa: null },
          { tanggalKadaluwarsa: { [Op.gte]: new Date() } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    if (data.length === 0) {
      return res.status(404).json({ message: "Data not found" });
    }

    return res.status(200).json({
      message: "Successfully retrieved inventaris data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getInventarisByKategoriId = async (req, res) => {
  try {
    const { kategoriId } = req.params;
    const data = await Inventaris.findAll({
      where: {
        KategoriInventarisId: kategoriId,
        isDeleted: false,
      },
      include: [
        {
          model: Kategori,
          as: "kategoriInventaris",
          attributes: ["id", "nama"],
        },
        {
          model: Satuan,
          attributes: ["id", "nama", "lambang"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (data.length === 0) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved inventaris data by kategori",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const createInventaris = async (req, res) => {
  try {
    const data = await Inventaris.create({
      SatuanId: req.body.satuanId,
      KategoriInventarisId: req.body.kategoriInventarisId,
      ...req.body,
    });

    res.locals.createdData = data.toJSON();

    return res.status(201).json({
      message: "Successfully created new inventaris data",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const updateInventaris = async (req, res) => {
  try {
    const data = await Inventaris.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    if (req.body.jumlah === 0) {
      req.body.ketersediaan = "tidak tersedia";
    } else if (req.body.jumlah > 0) {
      req.body.ketersediaan = "tersedia";
    }

    await Inventaris.update(req.body, {
      where: {
        id: req.params.id,
      },
    });

    const updated = await Inventaris.findOne({ where: { id: req.params.id } });

    res.locals.updatedData = updated.toJSON();

    return res.status(200).json({
      message: "Successfully updated inventaris data",
      data: {
        id: req.params.id,
        ...req.body,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const deleteInventaris = async (req, res) => {
  try {
    const data = await Inventaris.findOne({
      where: { id: req.params.id, isDeleted: false },
    });

    if (!data || data.isDeleted) {
      return res.status(404).json({
        message: "Data not found",
      });
    }

    data.isDeleted = true;
    await data.save();

    res.locals.updatedData = data;

    return res.status(200).json({
      message: "Successfully deleted inventaris data",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      detail: error,
    });
  }
};

const getRiwayatPenggunaanInventaris = async (req, res) => {
  try {
    // Get all PenggunaanInventaris data
    const daftarPemakaianPIOrm = await PenggunaanInventaris.findAll({
      attributes: ["id", "jumlah", "createdAt"],
      include: [
        {
          model: Inventaris,
          as: "inventaris",
          attributes: ["id", "nama"],
          where: {
            isDeleted: false,
          },
          required: true,
        },
        {
          model: Laporan,
          as: "laporan",
          attributes: ["id", "userId", "gambar", "createdAt"],
          where: { isDeleted: false },
          required: true,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["name"],
              where: {
                isDeleted: false,
              },
              required: true,
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    // Get all Vitamin data
    const daftarPemakaianVitaminOrm = await Vitamin.findAll({
      attributes: ["id", "jumlah", "createdAt"],
      include: [
        {
          model: Inventaris,
          as: "inventaris",
          attributes: ["id", "nama"],
          where: {
            isDeleted: false,
          },
          required: true,
        },
        {
          model: Laporan,
          attributes: ["id", "userId", "gambar", "createdAt"],
          where: { isDeleted: false },
          required: true,
          include: [
            {
              model: User,
              as: "user",
              attributes: ["name"],
              where: {
                isDeleted: false,
              },
              required: true,
            },
          ],
        },
      ],
      where: {
        isDeleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    // Transform PenggunaanInventaris data to match expected format
    const daftarPemakaianPI = daftarPemakaianPIOrm.map((item) => {
      const pi = item.toJSON();
      const inventarisData = pi.inventaris || {};
      const laporanData = pi.laporan || {};
      const userData = laporanData.user || {};

      let laporanTanggalFormatted = null;
      let laporanWaktuFormatted = null;

      if (laporanData.createdAt) {
        const laporanDate = new Date(laporanData.createdAt);
        try {
          laporanTanggalFormatted = laporanDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          laporanWaktuFormatted = laporanDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          console.warn(
            "Warning: Locale 'id-ID' not fully supported for date formatting. Using default.",
            e.message
          );
          laporanTanggalFormatted = laporanDate.toDateString();
          laporanWaktuFormatted = laporanDate.toTimeString().substring(0, 5);
        }
      }

      return {
        id: pi.id,
        jumlah: pi.jumlah,
        createdAt: pi.createdAt,
        inventarisId: inventarisData.id,
        inventarisNama: inventarisData.nama,
        userId: laporanData.userId,
        laporanGambar: laporanData.gambar,
        petugasNama: userData.name,
        laporanId: laporanData.id,
        laporanTanggal: laporanTanggalFormatted,
        laporanWaktu: laporanWaktuFormatted,
        sourceTable: "penggunaan",
      };
    });

    // Transform Vitamin data to match expected format
    const daftarPemakaianVitamin = daftarPemakaianVitaminOrm.map((item) => {
      const vitamin = item.toJSON();
      const inventarisData = vitamin.inventaris || {};
      const laporanData = vitamin.Laporan || {};
      const userData = laporanData.user || {};

      let laporanTanggalFormatted = null;
      let laporanWaktuFormatted = null;

      if (laporanData.createdAt) {
        const laporanDate = new Date(laporanData.createdAt);
        try {
          laporanTanggalFormatted = laporanDate.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          laporanWaktuFormatted = laporanDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch (e) {
          console.warn(
            "Warning: Locale 'id-ID' not fully supported for date formatting. Using default.",
            e.message
          );
          laporanTanggalFormatted = laporanDate.toDateString();
          laporanWaktuFormatted = laporanDate.toTimeString().substring(0, 5);
        }
      }

      return {
        id: vitamin.id,
        jumlah: vitamin.jumlah,
        createdAt: vitamin.createdAt,
        inventarisId: inventarisData.id,
        inventarisNama: inventarisData.nama,
        userId: laporanData.userId,
        laporanGambar: laporanData.gambar,
        petugasNama: userData.name,
        laporanId: laporanData.id,
        laporanTanggal: laporanTanggalFormatted,
        laporanWaktu: laporanWaktuFormatted,
        sourceTable: "vitamin",
      };
    });

    // Combine and sort by createdAt
    const daftarPemakaian = [
      ...daftarPemakaianPI,
      ...daftarPemakaianVitamin,
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const daftarPemakaianTerbaru = daftarPemakaian.slice(0, 3);

    res.status(200).json({
      status: "success",
      message: "Data retrieved successfully",
      data: {
        daftarPemakaian,
        daftarPemakaianTerbaru,
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getPemakaianInventarisById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find in PenggunaanInventaris first
    let pemakaianData = await PenggunaanInventaris.findOne({
      where: { id: id, isDeleted: false },
      include: [
        {
          model: Inventaris,
          as: "inventaris",
          attributes: ["id", "nama", "gambar"],
          include: [
            {
              model: Satuan,
              attributes: ["id", "nama", "lambang"],
            },
            {
              model: Kategori,
              as: "kategoriInventaris",
              attributes: ["id", "nama"],
            },
          ],
        },
        {
          model: Laporan,
          as: "laporan",
          attributes: ["id", "gambar", "createdAt", "userId", "catatan"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    // If not found in PenggunaanInventaris, try Vitamin table
    if (!pemakaianData) {
      pemakaianData = await Vitamin.findOne({
        where: { id: id, isDeleted: false },
        include: [
          {
            model: Inventaris,
            as: "inventaris",
            attributes: ["id", "nama", "gambar"],
            include: [
              {
                model: Satuan,
                attributes: ["id", "nama", "lambang"],
              },
              {
                model: Kategori,
                as: "kategoriInventaris",
                attributes: ["id", "nama"],
              },
            ],
          },
          {
            model: Laporan,
            attributes: ["id", "gambar", "createdAt", "userId", "catatan"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
              },
            ],
          },
        ],
      });
    }

    if (!pemakaianData || pemakaianData.isDeleted) {
      return res.status(404).json({ message: "Data not found" });
    }

    return res.status(200).json({
      message: "Successfully retrieved pemakaian data",
      data: pemakaianData,
    });
  } catch (error) {
    console.error("Error getPemakaianInventarisById:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

const getPemakaianInventarisByLaporanId = async (req, res) => {
  try {
    const { laporanId } = req.params;

    // Try to find in PenggunaanInventaris first
    let pemakaianData = await PenggunaanInventaris.findOne({
      where: { laporanId: laporanId, isDeleted: false },
      include: [
        {
          model: Inventaris,
          as: "inventaris",
          attributes: ["id", "nama", "gambar"],
          include: [
            {
              model: Satuan,
              attributes: ["id", "nama", "lambang"],
            },
            {
              model: Kategori,
              as: "kategoriInventaris",
              attributes: ["id", "nama"],
            },
          ],
        },
        {
          model: Laporan,
          as: "laporan",
          attributes: ["id", "gambar", "createdAt", "userId", "catatan"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    // If not found in PenggunaanInventaris, try Vitamin table
    if (!pemakaianData) {
      pemakaianData = await Vitamin.findOne({
        where: { LaporanId: laporanId, isDeleted: false },
        include: [
          {
            model: Inventaris,
            as: "inventaris",
            attributes: ["id", "nama", "gambar"],
            include: [
              {
                model: Satuan,
                attributes: ["id", "nama", "lambang"],
              },
              {
                model: Kategori,
                as: "kategoriInventaris",
                attributes: ["id", "nama"],
              },
            ],
          },
          {
            model: Laporan,
            attributes: ["id", "gambar", "createdAt", "userId", "catatan"],
            include: [
              {
                model: User,
                as: "user",
                attributes: ["name"],
              },
            ],
          },
        ],
      });
    }

    if (!pemakaianData || pemakaianData.isDeleted) {
      return res.status(404).json({
        message: "Data pemakaian inventaris tidak ditemukan untuk laporan ini",
        status: false,
      });
    }

    return res.status(200).json({
      message: "Successfully retrieved pemakaian data by laporan",
      status: true,
      data: pemakaianData,
    });
  } catch (error) {
    console.error("Error getPemakaianInventarisByLaporanId:", error);
    res.status(500).json({ message: error.message, detail: error });
  }
};

module.exports = {
  getAllInventaris,
  getInventarisById,
  getInventarisByName,
  getInventarisByKategoriName,
  getInventarisByKategoriId,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  getRiwayatPenggunaanInventaris,
  getStatistikPemakaianInventaris,
  getRiwayatPemakaianInventarisPaginated,
  getPemakaianInventarisById,
  getPemakaianInventarisByLaporanId,
};
