"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_perbandingan", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			sesiId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_sesi_penilaian",
					key: "id",
				},
			},
			kriteria1Id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_kriteria",
					key: "id",
				},
				comment: "Row criterion",
			},
			kriteria2Id: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_kriteria",
					key: "id",
				},
				comment: "Column criterion",
			},
			nilaiSaaty: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: false,
				comment: "Saaty scale value (1-9 or reciprocal 1/2-1/9)",
			},
			tfnL: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "TFN lower bound",
			},
			tfnM: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "TFN middle value",
			},
			tfnU: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "TFN upper bound",
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
		await queryInterface.dropTable("spk_melon_perbandingan");
	},
};
