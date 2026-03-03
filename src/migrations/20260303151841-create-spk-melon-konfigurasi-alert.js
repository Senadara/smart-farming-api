"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_konfigurasi_alert", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			namaAturan: {
				type: Sequelize.STRING(150),
				allowNull: false,
				comment: "Rule name",
			},
			tipeAlert: {
				type: Sequelize.ENUM("sensor", "evaluasi_spk"),
				allowNull: false,
			},
			kriteriaId: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "spk_melon_kriteria",
					key: "id",
				},
				comment: "Required for sensor type, null for evaluasi_spk",
			},
			operator: {
				type: Sequelize.ENUM("kurang_dari", "lebih_dari", "sama_dengan"),
				allowNull: false,
			},
			nilaiThreshold: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: false,
				comment: "Threshold value",
			},
			tingkatKeparahan: {
				type: Sequelize.ENUM("info", "warning", "critical"),
				allowNull: false,
			},
			isActive: {
				type: Sequelize.BOOLEAN,
				defaultValue: true,
				comment: "Enable/disable without delete",
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
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("spk_melon_konfigurasi_alert");
	},
};
