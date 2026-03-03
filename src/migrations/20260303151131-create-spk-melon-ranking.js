"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_ranking", {
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
			unitBudidayaId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "unitBudidaya",
					key: "id",
				},
			},
			jarakIdealPositif: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: false,
				comment: "D+ (distance to positive ideal solution)",
			},
			jarakIdealNegatif: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: false,
				comment: "D- (distance to negative ideal solution)",
			},
			skorPreferensi: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "V = D- / (D+ + D-), range 0-1",
			},
			peringkat: {
				type: Sequelize.INTEGER,
				allowNull: false,
				comment: "Rank position (1 = best)",
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
		await queryInterface.dropTable("spk_melon_ranking");
	},
};
