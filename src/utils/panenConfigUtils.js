"use strict";

const DEFAULT_GRADE_FIELDS = ["jumlah", "berat"];

const toPlain = (value) =>
  value && typeof value.toJSON === "function" ? value.toJSON() : value;

const parseJsonObject = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (error) {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value) ? value : {};
};

const boolOrDefault = (value, fallback) =>
  typeof value === "boolean" ? value : fallback;

const getKomoditasSatuan = (komoditas) => {
  const plain = toPlain(komoditas) || {};
  const satuan =
    plain.Satuan ||
    plain.satuan ||
    plain.SatuanData ||
    plain.satuanData ||
    null;

  return satuan?.lambang || satuan?.nama || "satuan";
};

const defaultPanenConfig = (komoditas = {}) => ({
  tipePanen: "custom",
  modePanen: "produksi",
  jumlah: {
    enabled: true,
    required: true,
    label: "Jumlah panen",
    satuan: getKomoditasSatuan(komoditas),
    integerOnly: false,
  },
  berat: {
    enabled: true,
    required: false,
    label: "Berat total panen",
    satuan: "kg",
    integerOnly: false,
  },
  jumlahHewan: {
    enabled: false,
    required: false,
    label: "Jumlah hewan",
    satuan: "ekor",
    integerOnly: true,
    defaultValue: 0,
  },
  grade: {
    enabled: true,
    required: false,
    allowedFields: DEFAULT_GRADE_FIELDS,
    validateTotalJumlah: true,
    validateTotalBerat: true,
  },
});

const normalizeFieldConfig = (raw, fallback) => {
  const config = parseJsonObject(raw);

  return {
    ...fallback,
    ...config,
    enabled: boolOrDefault(config.enabled, fallback.enabled),
    required: boolOrDefault(config.required, fallback.required),
    integerOnly: boolOrDefault(config.integerOnly, fallback.integerOnly),
  };
};

const normalizeGradeConfig = (raw, fallback) => {
  const config = parseJsonObject(raw);
  const allowedFields = Array.isArray(config.allowedFields)
    ? config.allowedFields.filter((field) => DEFAULT_GRADE_FIELDS.includes(field))
    : fallback.allowedFields;

  return {
    ...fallback,
    ...config,
    enabled: boolOrDefault(config.enabled, fallback.enabled),
    required: boolOrDefault(config.required, fallback.required),
    allowedFields: allowedFields.length > 0 ? allowedFields : fallback.allowedFields,
    validateTotalJumlah: boolOrDefault(
      config.validateTotalJumlah,
      fallback.validateTotalJumlah
    ),
    validateTotalBerat: boolOrDefault(
      config.validateTotalBerat,
      fallback.validateTotalBerat
    ),
  };
};

const normalizePanenConfig = (rawConfig, komoditas = {}) => {
  const fallback = defaultPanenConfig(komoditas);
  const config = parseJsonObject(rawConfig);

  return {
    ...fallback,
    ...config,
    jumlah: normalizeFieldConfig(config.jumlah, fallback.jumlah),
    berat: normalizeFieldConfig(config.berat, fallback.berat),
    jumlahHewan: normalizeFieldConfig(config.jumlahHewan, fallback.jumlahHewan),
    grade: normalizeGradeConfig(config.grade, fallback.grade),
  };
};

const attachPanenConfig = (komoditas) => {
  const plain = toPlain(komoditas);

  if (!plain) {
    return plain;
  }

  return {
    ...plain,
    panenConfig: normalizePanenConfig(plain.panenConfig, plain),
  };
};

const attachPanenConfigToRows = (rows) =>
  Array.isArray(rows) ? rows.map((row) => attachPanenConfig(row)) : [];

module.exports = {
  defaultPanenConfig,
  normalizePanenConfig,
  attachPanenConfig,
  attachPanenConfigToRows,
};
