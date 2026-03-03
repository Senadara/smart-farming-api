"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_sesi_penilaian", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			namaSesi: {
				type: Sequelize.STRING(150),
				allowNull: false,
			},
			tipeEvaluasi: {
				type: Sequelize.ENUM("produktivitas", "kualitas"),
				allowNull: false,
			},
			periodeMulai: {
				type: Sequelize.DATEONLY,
				allowNull: false,
			},
			periodeSelesai: {
				type: Sequelize.DATEONLY,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM("draft", "proses", "selesai", "gagal"),
				defaultValue: "draft",
			},
			rasioKonsistensi: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: true,
				comment: "CR value, set after Fuzzy AHP stage 3",
			},
			dinilaiOleh: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "user",
					key: "id",
				},
			},
			catatanSesi: {
				type: Sequelize.TEXT,
				allowNull: true,
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
		await queryInterface.dropTable("spk_melon_sesi_penilaian");
	},
};
