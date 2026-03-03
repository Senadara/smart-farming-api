"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_keputusan", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			rankingId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_ranking",
					key: "id",
				},
			},
			statusKeputusan: {
				type: Sequelize.ENUM("disetujui", "ditolak", "ditunda"),
				allowNull: false,
			},
			catatan: {
				type: Sequelize.TEXT,
				allowNull: true,
				comment: "Manager notes",
			},
			diputuskanOleh: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "user",
					key: "id",
				},
				comment: "Validator identity",
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
		await queryInterface.dropTable("spk_melon_keputusan");
	},
};
