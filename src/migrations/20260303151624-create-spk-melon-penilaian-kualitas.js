"use strict";

/**
 * TENTATIVE: Column definitions may change after thesis advisor
 * and agronomy expert confirmation.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_penilaian_kualitas", {
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
			beratBuah: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "Average fruit weight (gram)",
			},
			diameterBuah: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "Diameter (cm)",
			},
			panjangBuah: {
				type: Sequelize.DECIMAL(10, 2),
				allowNull: true,
				comment: "Length (cm)",
			},
			kadarBrix: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
				comment: "Brix degree (sweetness)",
			},
			kekerasanDaging: {
				type: Sequelize.DECIMAL(5, 2),
				allowNull: true,
				comment: "Flesh firmness",
			},
			skorKondisiKulit: {
				type: Sequelize.TINYINT,
				allowNull: true,
				comment: "Skin condition score (1-5)",
			},
			skorAroma: {
				type: Sequelize.TINYINT,
				allowNull: true,
				comment: "Aroma score (1-5)",
			},
			skorWarna: {
				type: Sequelize.TINYINT,
				allowNull: true,
				comment: "Color score (1-5)",
			},
			jumlahSampel: {
				type: Sequelize.INTEGER,
				allowNull: true,
				comment: "Number of sampled fruits",
			},
			dinilaiOleh: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "user",
					key: "id",
				},
				comment: "Who performed the assessment",
			},
			catatan: {
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
		await queryInterface.dropTable("spk_melon_penilaian_kualitas");
	},
};
