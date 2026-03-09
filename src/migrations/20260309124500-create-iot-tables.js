"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. iot_protocol
    await queryInterface.createTable("iot_protocol", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      protocolName: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Jenis komunikasi: API | MQTT | WEBSOCKET",
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

    // 2. iot_connection_config
    await queryInterface.createTable("iot_connection_config", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      protocolId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      baseUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Base URL untuk komunikasi REST API",
      },
      endpointPath: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Path endpoint spesifik device",
      },
      mqttBrokerUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Alamat broker MQTT",
      },
      mqttTopic: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Topik MQTT yang digunakan device",
      },
      authType: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: "none | api_key | bearer | basic",
      },
      authKey: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "API key atau token autentikasi",
      },
      headers: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: "Custom HTTP headers jika diperlukan",
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

    // 3. iot_parameter
    await queryInterface.createTable("iot_parameter", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      parameterCode: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: "Kode parameter sensor",
      },
      parameterName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: "Satuan pengukuran seperti °C, %, ppm, pH",
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

    // 4. iot_device
    await queryInterface.createTable("iot_device", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      unitBudidayaId: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: "FK: Device berada di unit budidaya mana",
      },
      connectionConfigId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      deviceCode: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Kode unik dari sistem IoT",
      },
      deviceName: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      pollingInterval: {
        type: Sequelize.INTEGER,
        defaultValue: 300,
        comment: "Interval pengambilan data (detik) jika menggunakan API",
      },
      status: {
        type: Sequelize.STRING(50),
        defaultValue: "active",
        comment: "active | inactive | maintenance",
      },
      installedAt: {
        type: Sequelize.DATE,
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

    // 5. commodity_parameter
    await queryInterface.createTable("commodity_parameter", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      commodityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      parameterId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      minValue: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: "Nilai minimum ideal",
      },
      maxValue: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        comment: "Nilai maksimum ideal",
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

    // 6. iot_parameter_mapping
    await queryInterface.createTable("iot_parameter_mapping", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      parameterId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      payloadKey: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: "Key pada response payload IoT API / MQTT",
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

    // 7. iot_sensor_data
    await queryInterface.createTable("iot_sensor_data", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      parameterId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      value: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        comment: "Nilai sensor",
      },
      sensorTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Timestamp dari device",
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

    // 8. iot_device_log
    await queryInterface.createTable("iot_device_log", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      deviceId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      logType: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "INFO | WARNING | ERROR",
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Pesan log dari proses komunikasi device",
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
    // Drop in reverse order to avoid FK issues
    await queryInterface.dropTable("iot_device_log");
    await queryInterface.dropTable("iot_sensor_data");
    await queryInterface.dropTable("iot_parameter_mapping");
    await queryInterface.dropTable("commodity_parameter");
    await queryInterface.dropTable("iot_device");
    await queryInterface.dropTable("iot_parameter");
    await queryInterface.dropTable("iot_connection_config");
    await queryInterface.dropTable("iot_protocol");
  },
};
