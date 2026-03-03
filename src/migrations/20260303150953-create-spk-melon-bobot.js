"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_bobot", {
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
			kriteriaId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_kriteria",
					key: "id",
				},
			},
			bobotFuzzyL: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "Fuzzy weight lower",
			},
			bobotFuzzyM: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "Fuzzy weight middle",
			},
			bobotFuzzyU: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "Fuzzy weight upper",
			},
			bobotAkhir: {
				type: Sequelize.DECIMAL(10, 6),
				allowNull: false,
				comment: "Crisp (defuzzified) weight",
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
		await queryInterface.dropTable("spk_melon_bobot");
	},
};
