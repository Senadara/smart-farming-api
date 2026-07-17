"use strict";

const indexes = [
  {
    table: "iot_sensor_data",
    fields: ["deviceId", "sensorTimestamp"],
    name: "idx_iot_sensor_device_time",
  },
  {
    table: "iot_sensor_data",
    fields: ["deviceId", "parameterId", "sensorTimestamp"],
    name: "idx_iot_sensor_device_param_time",
  },
  {
    table: "iot_sensor_data",
    fields: ["parameterId", "sensorTimestamp"],
    name: "idx_iot_sensor_param_time",
  },
  {
    table: "iot_device",
    fields: ["unitBudidayaId", "status"],
    name: "idx_iot_device_unit_status",
  },
  {
    table: "iot_parameter",
    fields: ["parameterCode"],
    name: "idx_iot_parameter_code",
  },
  {
    table: "commodity_parameter",
    fields: ["commodityId", "parameterId"],
    name: "idx_commodity_param_pair",
  },
  {
    table: "unitBudidaya",
    fields: ["jenisBudidayaId", "status", "isDeleted"],
    name: "idx_unit_budidaya_jenis_status_deleted",
  },
  {
    table: "komoditas",
    fields: ["jenisBudidayaId", "isDeleted"],
    name: "idx_komoditas_jenis_deleted",
  },
  {
    table: "laporan",
    fields: ["unitBudidayaId", "isDeleted", "createdAt"],
    name: "idx_laporan_unit_deleted_created",
  },
  {
    table: "laporan",
    fields: ["unitBudidayaId", "tipe", "createdAt"],
    name: "idx_laporan_unit_tipe_created",
  },
  {
    table: "panen",
    fields: ["laporanId", "isDeleted"],
    name: "idx_panen_laporan_deleted",
  },
  {
    table: "harianTernak",
    fields: ["laporanId", "isDeleted"],
    name: "idx_harian_ternak_laporan_deleted",
  },
  {
    table: "kematian",
    fields: ["laporanId", "isDeleted", "tanggal"],
    name: "idx_kematian_laporan_deleted_tanggal",
  },
  {
    table: "panenRincianGrade",
    fields: ["panenId", "gradeId", "isDeleted"],
    name: "idx_panen_grade_panen_grade_deleted",
  },
  {
    table: "panenRincianGrade",
    fields: ["panenKebunId", "gradeId", "isDeleted"],
    name: "idx_panen_grade_kebun_grade_deleted",
  },
  {
    table: "spk_fuzzy_logs",
    fields: ["unit_budidaya_id", "createdAt"],
    name: "idx_spk_fuzzy_logs_unit_created",
  },
  {
    table: "spk_fuzzy_logs",
    fields: ["createdAt"],
    name: "idx_spk_fuzzy_logs_created",
  },
];

module.exports = {
  async up(queryInterface) {
    for (const index of indexes) {
      await queryInterface.addIndex(index.table, index.fields, {
        name: index.name,
      });
    }
  },

  async down(queryInterface) {
    for (const index of [...indexes].reverse()) {
      await queryInterface.removeIndex(index.table, index.name);
    }
  },
};
