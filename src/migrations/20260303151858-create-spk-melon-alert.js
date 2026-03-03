"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_alert", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			konfigurasiAlertId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_konfigurasi_alert",
					key: "id",
				},
				comment: "Which rule triggered this alert",
			},
			unitBudidayaId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "unitBudidaya",
					key: "id",
				},
				comment: "Affected greenhouse block",
			},
			sesiId: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "spk_melon_sesi_penilaian",
					key: "id",
				},
				comment: "For evaluasi_spk type alerts",
			},
			logSensorId: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "spk_melon_log_sensor",
					key: "id",
				},
				comment: "For sensor type alerts",
			},
			pesan: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: "Alert message",
			},
			nilaiAktual: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: true,
				comment: "Actual value that triggered the alert",
			},
			status: {
				type: Sequelize.ENUM("belum_dibaca", "dibaca", "ditindaklanjuti"),
				defaultValue: "belum_dibaca",
			},
			tingkatKeparahan: {
				type: Sequelize.ENUM("info", "warning", "critical"),
				allowNull: false,
				comment: "Copied from konfigurasi at trigger time",
			},
			dibacaOleh: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "user",
					key: "id",
				},
				comment: "Who read the alert",
			},
			dibacaPada: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: "When the alert was read",
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

		// Index for dashboard query: unread alerts count
		await queryInterface.addIndex("spk_melon_alert", ["status", "isDeleted"], {
			name: "alert_status_active_idx",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("spk_melon_alert");
	},
};
