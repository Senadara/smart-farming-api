"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. spk_action_tasks — tugas tindakan dari hasil analisa SPK
    await queryInterface.createTable("spk_action_tasks", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      spk_fuzzy_log_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "FK ke spk_fuzzy_logs — sumber analisa yang menghasilkan tugas ini",
        references: { model: "spk_fuzzy_logs", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      unit_budidaya_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: "FK ke unitBudidaya — kandang target tugas",
      },
      assigned_to: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        comment: "UUID user petugas yang ditugaskan",
      },
      assigned_by: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        comment: "UUID user owner/admin yang membuat tugas",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "Judul tugas, e.g. 'Perbaiki ventilasi kandang A2'",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Deskripsi detail tugas dan rekomendasi tindakan",
      },
      priority: {
        type: Sequelize.ENUM("urgent", "high", "medium", "low"),
        allowNull: false,
        defaultValue: "medium",
        comment: "Tingkat prioritas tugas",
      },
      status: {
        type: Sequelize.ENUM("todo", "in_progress", "done", "cancelled"),
        allowNull: false,
        defaultValue: "todo",
        comment: "Status pengerjaan tugas",
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        comment: "Tenggat waktu pengerjaan",
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Waktu tugas selesai dikerjakan",
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

    // 2. spk_action_reports — laporan pengerjaan tugas oleh petugas
    await queryInterface.createTable("spk_action_reports", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      task_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK ke spk_action_tasks",
        references: { model: "spk_action_tasks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      reported_by: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        comment: "UUID user petugas yang melaporkan",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Catatan laporan pengerjaan",
      },
      photo: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "URL/path bukti foto pengerjaan",
      },
      status_update: {
        type: Sequelize.ENUM("in_progress", "done"),
        allowNull: false,
        defaultValue: "in_progress",
        comment: "Status tugas setelah laporan ini disubmit",
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

    // Indexes
    await queryInterface.addIndex("spk_action_tasks", ["status"], {
      name: "idx_tasks_status",
    });
    await queryInterface.addIndex("spk_action_tasks", ["assigned_to"], {
      name: "idx_tasks_assigned_to",
    });
    await queryInterface.addIndex("spk_action_tasks", ["priority"], {
      name: "idx_tasks_priority",
    });
    await queryInterface.addIndex("spk_action_reports", ["task_id"], {
      name: "idx_reports_task_id",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("spk_action_reports");
    await queryInterface.dropTable("spk_action_tasks");
  },
};
