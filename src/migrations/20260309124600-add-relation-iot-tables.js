"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // iot_connection_config.protocolId → iot_protocol.id
    await queryInterface.addConstraint("iot_connection_config", {
      fields: ["protocolId"],
      type: "foreign key",
      name: "fk_connection_config_protocol",
      references: { table: "iot_protocol", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // iot_device.unitBudidayaId → unitBudidaya.id
    await queryInterface.addConstraint("iot_device", {
      fields: ["unitBudidayaId"],
      type: "foreign key",
      name: "fk_device_unit_budidaya",
      references: { table: "unitBudidaya", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // iot_device.connectionConfigId → iot_connection_config.id
    await queryInterface.addConstraint("iot_device", {
      fields: ["connectionConfigId"],
      type: "foreign key",
      name: "fk_device_connection_config",
      references: { table: "iot_connection_config", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // commodity_parameter.commodityId → komoditas.id
    await queryInterface.addConstraint("commodity_parameter", {
      fields: ["commodityId"],
      type: "foreign key",
      name: "fk_commodity_param_komoditas",
      references: { table: "komoditas", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // commodity_parameter.parameterId → iot_parameter.id
    await queryInterface.addConstraint("commodity_parameter", {
      fields: ["parameterId"],
      type: "foreign key",
      name: "fk_commodity_param_parameter",
      references: { table: "iot_parameter", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // iot_parameter_mapping.deviceId → iot_device.id
    await queryInterface.addConstraint("iot_parameter_mapping", {
      fields: ["deviceId"],
      type: "foreign key",
      name: "fk_param_mapping_device",
      references: { table: "iot_device", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // iot_parameter_mapping.parameterId → iot_parameter.id
    await queryInterface.addConstraint("iot_parameter_mapping", {
      fields: ["parameterId"],
      type: "foreign key",
      name: "fk_param_mapping_parameter",
      references: { table: "iot_parameter", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // iot_sensor_data.deviceId → iot_device.id
    await queryInterface.addConstraint("iot_sensor_data", {
      fields: ["deviceId"],
      type: "foreign key",
      name: "fk_sensor_data_device",
      references: { table: "iot_device", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // iot_sensor_data.parameterId → iot_parameter.id
    await queryInterface.addConstraint("iot_sensor_data", {
      fields: ["parameterId"],
      type: "foreign key",
      name: "fk_sensor_data_parameter",
      references: { table: "iot_parameter", field: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });

    // iot_device_log.deviceId → iot_device.id
    await queryInterface.addConstraint("iot_device_log", {
      fields: ["deviceId"],
      type: "foreign key",
      name: "fk_device_log_device",
      references: { table: "iot_device", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      "iot_device_log",
      "fk_device_log_device",
    );
    await queryInterface.removeConstraint(
      "iot_sensor_data",
      "fk_sensor_data_parameter",
    );
    await queryInterface.removeConstraint(
      "iot_sensor_data",
      "fk_sensor_data_device",
    );
    await queryInterface.removeConstraint(
      "iot_parameter_mapping",
      "fk_param_mapping_parameter",
    );
    await queryInterface.removeConstraint(
      "iot_parameter_mapping",
      "fk_param_mapping_device",
    );
    await queryInterface.removeConstraint(
      "commodity_parameter",
      "fk_commodity_param_parameter",
    );
    await queryInterface.removeConstraint(
      "commodity_parameter",
      "fk_commodity_param_komoditas",
    );
    await queryInterface.removeConstraint(
      "iot_device",
      "fk_device_connection_config",
    );
    await queryInterface.removeConstraint(
      "iot_device",
      "fk_device_unit_budidaya",
    );
    await queryInterface.removeConstraint(
      "iot_connection_config",
      "fk_connection_config_protocol",
    );
  },
};
