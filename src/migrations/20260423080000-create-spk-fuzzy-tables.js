"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. spk_fuzzy_variables — menyimpan semua variabel fuzzy (input & output)
    await queryInterface.createTable("spk_fuzzy_variables", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Nama variabel, e.g. suhu, kelembapan, hdp, status_lingkungan",
      },
      type: {
        type: Sequelize.ENUM("input", "output"),
        allowNull: false,
        comment: "Apakah variabel ini input atau output",
      },
      group: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Kelompok engine: lingkungan | kesehatan | kausalitas",
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: "Satuan fisik: °C, %, ppm, %, score",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 2. spk_fuzzy_sets — membership functions per variabel
    await queryInterface.createTable("spk_fuzzy_sets", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      variable_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_variables",
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Label himpunan: Dingin, Nyaman, Panas, Rendah, Tinggi, dst.",
      },
      shape: {
        type: Sequelize.ENUM("triangle", "trapezoid"),
        allowNull: false,
        comment: "Bentuk membership function",
      },
      a: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        comment: "Titik awal (kaki kiri / foot left)",
      },
      b: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        comment: "Puncak kiri (triangle) atau kaki kiri atas (trapezoid)",
      },
      c: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        comment: "Puncak kanan (triangle) atau kaki kanan atas (trapezoid)",
      },
      d: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: "Titik akhir kaki kanan (trapezoid saja, null untuk triangle)",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 3. spk_fuzzy_rules — aturan IF-THEN
    await queryInterface.createTable("spk_fuzzy_rules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Nama deskriptif rule opsional",
      },
      operator: {
        type: Sequelize.ENUM("AND", "OR"),
        allowNull: false,
        defaultValue: "AND",
        comment: "Operator antar kondisi: AND (min) atau OR (max)",
      },
      output_set_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_sets — set output yang diaktifkan rule ini",
      },
      group: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "lingkungan | kesehatan | kausalitas",
      },
      diagnosis: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Diagnosis singkat sebagai konteks narasi, e.g. Risiko dehidrasi & dingin",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 4. spk_fuzzy_rule_conditions — kondisi setiap rule (bagian IF)
    await queryInterface.createTable("spk_fuzzy_rule_conditions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      rule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_rules",
      },
      variable_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_variables",
      },
      set_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_sets — himpunan yang digunakan dalam kondisi ini",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 5. spk_fuzzy_input_sources — mapping variabel ke sumber data asli
    await queryInterface.createTable("spk_fuzzy_input_sources", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      variable_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_fuzzy_variables (hanya type=input)",
      },
      source_type: {
        type: Sequelize.ENUM("iot", "database", "function"),
        allowNull: false,
        comment: "Jenis sumber: iot (sensor), database (query), function (kalkulasi)",
      },
      source_name: {
        type: Sequelize.STRING(150),
        allowNull: true,
        comment: "Nama tabel (untuk iot/database) atau class (untuk function)",
      },
      field_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Nama kolom yang diambil nilainya (untuk iot: value dengan filter parameterCode)",
      },
      function_name: {
        type: Sequelize.STRING(200),
        allowNull: true,
        comment: "Full class name untuk source_type=function, e.g. App\\Services\\Fuzzy\\CalculateHdp",
      },
      extra_config: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Konfigurasi tambahan, e.g. {parameterCode: TEMP} untuk filter IoT",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 6. spk_fuzzy_logs — riwayat setiap eksekusi engine
    await queryInterface.createTable("spk_fuzzy_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      unit_budidaya_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "FK ke unitBudidaya — null berarti global (semua kandang)",
      },
      input_json: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: "Nilai input mentah: {suhu: 32.5, kelembapan: 60, amonia: 24, hdp: 92.1, fcr: 2.14}",
      },
      fuzzified_json: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Derajat keanggotaan per variabel per set",
      },
      rule_result_json: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Hasil evaluasi rules: rule dominan, alpha, diagnosis",
      },
      status_lingkungan: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Output engine 1: Buruk | Waspada | Baik | Optimal",
      },
      status_kesehatan: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Output engine 2: Buruk | Waspada | Baik | Optimal",
      },
      diagnosis_kausalitas: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Output engine 3: Krisis Total | Stres Lingkungan | dst.",
      },
      output_value: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: "Nilai crisp hasil defuzzifikasi gabungan (0–100)",
      },
      output_label: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Label keputusan akhir",
      },
      narrative: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Narasi AI-like yang dihasilkan NarrativeGenerator",
      },
      recommendation: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Rekomendasi tindakan dari rule kausalitas",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse dependency order
    await queryInterface.dropTable("spk_fuzzy_logs");
    await queryInterface.dropTable("spk_fuzzy_input_sources");
    await queryInterface.dropTable("spk_fuzzy_rule_conditions");
    await queryInterface.dropTable("spk_fuzzy_rules");
    await queryInterface.dropTable("spk_fuzzy_sets");
    await queryInterface.dropTable("spk_fuzzy_variables");
  },
};
