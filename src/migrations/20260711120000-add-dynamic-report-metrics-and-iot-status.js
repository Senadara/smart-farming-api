"use strict";

async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => (typeof table === "object" ? table.tableName || table.name : table)).includes(tableName);
}

async function columnExists(queryInterface, tableName, columnName) {
  if (!(await tableExists(queryInterface, tableName))) return false;
  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, columnName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "daily_report_metrics"))) {
      await queryInterface.createTable("daily_report_metrics", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        laporan_id: {
          type: Sequelize.UUID,
          allowNull: false,
        },
        metric_code: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        value: {
          type: Sequelize.DOUBLE,
          allowNull: false,
          defaultValue: 0,
        },
        unit: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        metadata: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
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

      await queryInterface.addIndex("daily_report_metrics", ["laporan_id", "metric_code"], {
        unique: true,
        name: "daily_report_metrics_report_metric_unique",
      });
      await queryInterface.addIndex("daily_report_metrics", ["metric_code"], {
        name: "daily_report_metrics_metric_code_index",
      });
    }

    if (await tableExists(queryInterface, "iot_device")) {
      if (!(await columnExists(queryInterface, "iot_device", "lastSeenAt"))) {
        await queryInterface.addColumn("iot_device", "lastSeenAt", {
          type: Sequelize.DATE,
          allowNull: true,
          after: "installedAt",
        });
      }

      if (!(await columnExists(queryInterface, "iot_device", "lastMissedAt"))) {
        await queryInterface.addColumn("iot_device", "lastMissedAt", {
          type: Sequelize.DATE,
          allowNull: true,
          after: "lastSeenAt",
        });
      }

      if (!(await columnExists(queryInterface, "iot_device", "missedCount"))) {
        await queryInterface.addColumn("iot_device", "missedCount", {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
          after: "lastMissedAt",
        });
      }

      if (!(await columnExists(queryInterface, "iot_device", "offlineAfterMisses"))) {
        await queryInterface.addColumn("iot_device", "offlineAfterMisses", {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 3,
          after: "missedCount",
        });
      }

      if (!(await columnExists(queryInterface, "iot_device", "offlineAfterMinutes"))) {
        await queryInterface.addColumn("iot_device", "offlineAfterMinutes", {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 30,
          after: "offlineAfterMisses",
        });
      }
    }

    if (await tableExists(queryInterface, "spk_fuzzy_input_sources")) {
      await queryInterface.sequelize.query(
        "ALTER TABLE spk_fuzzy_input_sources MODIFY source_type ENUM('iot','database','function','report_metric') NOT NULL"
      );
    }
  },

  async down(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, "spk_fuzzy_input_sources")) {
      await queryInterface.sequelize.query(
        "ALTER TABLE spk_fuzzy_input_sources MODIFY source_type ENUM('iot','database','function') NOT NULL"
      );
    }

    if (await tableExists(queryInterface, "iot_device")) {
      for (const column of [
        "offlineAfterMinutes",
        "offlineAfterMisses",
        "missedCount",
        "lastMissedAt",
        "lastSeenAt",
      ]) {
        if (await columnExists(queryInterface, "iot_device", column)) {
          await queryInterface.removeColumn("iot_device", column);
        }
      }
    }

    if (await tableExists(queryInterface, "daily_report_metrics")) {
      await queryInterface.dropTable("daily_report_metrics");
    }
  },
};
