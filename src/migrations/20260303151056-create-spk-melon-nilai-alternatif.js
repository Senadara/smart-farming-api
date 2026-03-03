"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_nilai_alternatif", {
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
				comment: "The alternative (greenhouse block)",
			},
			kriteriaId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_kriteria",
					key: "id",
				},
			},
			nilaiAsli: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: true,
				comment: "Raw value from data source",
			},
			nilaiNormalisasi: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: true,
				comment: "After vector normalization",
			},
			nilaiTerbobot: {
				type: Sequelize.DECIMAL(15, 6),
				allowNull: true,
				comment: "After weighting (normalisasi x bobot)",
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
		await queryInterface.dropTable("spk_melon_nilai_alternatif");
	},
};
