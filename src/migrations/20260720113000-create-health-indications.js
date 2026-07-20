"use strict";

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (error) {
    return false;
  }
}

async function addIndexIfTableExists(queryInterface, tableName, fields, options) {
  if (await tableExists(queryInterface, tableName)) {
    await queryInterface.addIndex(tableName, fields, options);
  }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, "health_indications"))) {
      await queryInterface.createTable("health_indications", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        unitBudidayaId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "unitBudidaya",
            key: "id",
          },
        },
        source: {
          type: Sequelize.STRING(80),
          allowNull: false,
          defaultValue: "spk-web",
        },
        indicationCode: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        analysisMode: {
          type: Sequelize.STRING(80),
          allowNull: false,
          defaultValue: "individual_productivity_drop",
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        severity: {
          type: Sequelize.ENUM("info", "warning", "critical"),
          allowNull: false,
          defaultValue: "warning",
        },
        status: {
          type: Sequelize.ENUM("pending", "checked", "dismissed"),
          allowNull: false,
          defaultValue: "pending",
        },
        periodStart: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        periodEnd: {
          type: Sequelize.DATEONLY,
          allowNull: true,
        },
        periodDays: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        thresholdPercent: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        affectedObjectCount: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        context: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        notificationResult: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        detectedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        checkedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        checkedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: "user",
            key: "id",
          },
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

    if (!(await tableExists(queryInterface, "health_indication_objects"))) {
      await queryInterface.createTable("health_indication_objects", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
          unique: true,
        },
        healthIndicationId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "health_indications",
            key: "id",
          },
          onDelete: "CASCADE",
          onUpdate: "CASCADE",
        },
        objekBudidayaId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: "objekBudidaya",
            key: "id",
          },
        },
        namaId: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        dropPercent: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true,
        },
        dropPoints: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true,
        },
        currentLayingPercent: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true,
        },
        previousLayingPercent: {
          type: Sequelize.DECIMAL(6, 2),
          allowNull: true,
        },
        currentLayingDays: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        previousLayingDays: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM("pending", "checked", "dismissed"),
          allowNull: false,
          defaultValue: "pending",
        },
        checkedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        isDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

    await addIndexIfTableExists(queryInterface, "health_indications", ["unitBudidayaId", "status"], {
      name: "idx_health_indications_unit_status",
    });
    await addIndexIfTableExists(
      queryInterface,
      "health_indications",
      ["unitBudidayaId", "indicationCode", "periodStart", "periodEnd"],
      { name: "idx_health_indications_period" }
    );
    await addIndexIfTableExists(queryInterface, "health_indication_objects", ["healthIndicationId"], {
      name: "idx_health_indication_objects_indication",
    });
    await addIndexIfTableExists(queryInterface, "health_indication_objects", ["objekBudidayaId", "status"], {
      name: "idx_health_indication_objects_object_status",
    });
  },

  async down(queryInterface) {
    if (await tableExists(queryInterface, "health_indication_objects")) {
      await queryInterface.dropTable("health_indication_objects");
    }

    if (await tableExists(queryInterface, "health_indications")) {
      await queryInterface.dropTable("health_indications");
    }
  },
};
