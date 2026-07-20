"use strict";

const DEFAULT_SETTING_ID = "9f0b1800-0000-4000-8000-000000000601";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "spk_health_scheduler_settings"))) {
      await queryInterface.createTable("spk_health_scheduler_settings", {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          allowNull: false,
        },
        is_enabled: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        schedule_times: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        days: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 7,
        },
        threshold_percent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 40,
        },
        target_role: {
          type: Sequelize.STRING(30),
          allowNull: false,
          defaultValue: "petugas",
        },
        last_run_at: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        last_run_key: {
          type: Sequelize.STRING(40),
          allowNull: true,
        },
        last_status: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        last_summary: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        configured_by: {
          type: Sequelize.UUID,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM spk_health_scheduler_settings WHERE id = :id LIMIT 1",
      { replacements: { id: DEFAULT_SETTING_ID } }
    );

    if (!rows[0]) {
      const now = new Date();
      await queryInterface.bulkInsert("spk_health_scheduler_settings", [{
        id: DEFAULT_SETTING_ID,
        is_enabled: false,
        schedule_times: JSON.stringify(["07:00"]),
        days: 7,
        threshold_percent: 40,
        target_role: "petugas",
        last_run_at: null,
        last_run_key: null,
        last_status: null,
        last_summary: null,
        configured_by: null,
        createdAt: now,
        updatedAt: now,
      }]);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("spk_health_scheduler_settings");
  },
};
