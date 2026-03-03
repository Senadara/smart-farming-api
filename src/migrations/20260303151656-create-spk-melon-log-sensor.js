"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_log_sensor", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			unitBudidayaId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "unitBudidaya",
					key: "id",
				},
				comment: "Which greenhouse block",
			},
			nitrogen: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "ppm",
			},
			fosfor: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "ppm",
			},
			kalium: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "ppm",
			},
			ph: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
			},
			ec: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
				comment: "mS/cm",
			},
			suhu: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
				comment: "Celsius",
			},
			kelembaban: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
				comment: "Percent",
			},
			dicatatPada: {
				type: Sequelize.DATE,
				allowNull: false,
				comment: "When measured",
			},
			isDeleted: {
				type: Sequelize.BOOLEAN,
				defaultValue: false,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE,
				defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
			},
		});

		// Index for efficient queries by block + time range
		await queryInterface.addIndex(
			"spk_melon_log_sensor",
			["unitBudidayaId", "dicatatPada"],
			{ name: "log_sensor_unit_waktu_idx" },
		);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("spk_melon_log_sensor");
	},
};
