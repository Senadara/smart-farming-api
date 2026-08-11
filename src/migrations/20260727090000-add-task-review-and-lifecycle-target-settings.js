"use strict";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

async function addColumnIfMissing(queryInterface, Sequelize, tableName, columnName, definition) {
  if (!(await tableExists(queryInterface, tableName))) {
    return;
  }

  const table = await queryInterface.describeTable(tableName);
  if (table[columnName]) {
    return;
  }

  await queryInterface.addColumn(tableName, columnName, definition);
}

async function removeColumnIfExists(queryInterface, tableName, columnName) {
  if (!(await tableExists(queryInterface, tableName))) {
    return;
  }

  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    return;
  }

  await queryInterface.removeColumn(tableName, columnName);
}

async function seedLivestockCycleDefaults(queryInterface) {
  if (!(await tableExists(queryInterface, "livestock_master_configs"))) {
    return;
  }

  if (!(await tableExists(queryInterface, "jenisBudidaya"))) {
    return;
  }

  const [rows] = await queryInterface.sequelize.query(`
    SELECT config.id, type.nama
    FROM livestock_master_configs config
    LEFT JOIN jenisBudidaya type ON type.id = config.jenis_budidaya_id
  `);

  for (const row of rows) {
    const name = String(row.nama || "").toLowerCase();
    const isLayer = name.includes("petelur") || name.includes("layer");

    if (!isLayer) {
      continue;
    }

    await queryInterface.sequelize.query(
      `
        UPDATE livestock_master_configs
        SET production_start_weeks = COALESCE(production_start_weeks, 18),
            peak_start_weeks = COALESCE(peak_start_weeks, 25),
            peak_end_weeks = COALESCE(peak_end_weeks, 45),
            production_decline_weeks = COALESCE(production_decline_weeks, 46),
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = :id
      `,
      { replacements: { id: row.id } }
    );
  }
}

async function seedProductivityTargets(queryInterface) {
  if (!(await tableExists(queryInterface, "livestock_productivity_functions"))) {
    return;
  }

  if (!(await tableExists(queryInterface, "livestock_productivity_function_configs"))) {
    return;
  }

  const targets = {
    hdp: [85, 100],
    hhep: [85, 100],
    fcr: [1.85, 2.55],
    feed_intake: [100, 130],
    avg_egg_weight: [53, 73],
    mortalitas: [0, 1],
  };

  for (const [code, [min, max]] of Object.entries(targets)) {
    await queryInterface.sequelize.query(
      `
        UPDATE livestock_productivity_function_configs cfg
        JOIN livestock_productivity_functions fn ON fn.id = cfg.function_id
        SET cfg.target_min_value = COALESCE(cfg.target_min_value, :min),
            cfg.target_max_value = COALESCE(cfg.target_max_value, :max),
            cfg.updatedAt = CURRENT_TIMESTAMP
        WHERE fn.code = :code
      `,
      { replacements: { code, min, max } }
    );
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "completion_requested_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "review_status", {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "none",
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "reviewed_by", {
      type: Sequelize.CHAR(36),
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "reviewed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "review_note", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "system_validation_status", {
      type: Sequelize.STRING(30),
      allowNull: false,
      defaultValue: "not_checked",
    });
    await addColumnIfMissing(queryInterface, Sequelize, "spk_action_tasks", "system_validation_note", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await addColumnIfMissing(queryInterface, Sequelize, "livestock_master_configs", "production_start_weeks", {
      type: Sequelize.SMALLINT.UNSIGNED,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "livestock_master_configs", "peak_start_weeks", {
      type: Sequelize.SMALLINT.UNSIGNED,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "livestock_master_configs", "peak_end_weeks", {
      type: Sequelize.SMALLINT.UNSIGNED,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "livestock_master_configs", "production_decline_weeks", {
      type: Sequelize.SMALLINT.UNSIGNED,
      allowNull: true,
    });

    await addColumnIfMissing(queryInterface, Sequelize, "livestock_productivity_function_configs", "target_min_value", {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });
    await addColumnIfMissing(queryInterface, Sequelize, "livestock_productivity_function_configs", "target_max_value", {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await seedLivestockCycleDefaults(queryInterface);
    await seedProductivityTargets(queryInterface);
  },

  async down(queryInterface) {
    for (const column of ["target_max_value", "target_min_value"]) {
      await removeColumnIfExists(queryInterface, "livestock_productivity_function_configs", column);
    }

    for (const column of [
      "production_decline_weeks",
      "peak_end_weeks",
      "peak_start_weeks",
      "production_start_weeks",
    ]) {
      await removeColumnIfExists(queryInterface, "livestock_master_configs", column);
    }

    for (const column of [
      "system_validation_note",
      "system_validation_status",
      "review_note",
      "reviewed_at",
      "reviewed_by",
      "review_status",
      "completion_requested_at",
    ]) {
      await removeColumnIfExists(queryInterface, "spk_action_tasks", column);
    }
  },
};
