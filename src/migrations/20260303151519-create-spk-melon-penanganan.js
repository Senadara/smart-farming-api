"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_penanganan", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			keputusanId: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "spk_melon_keputusan",
					key: "id",
				},
			},
			judul: {
				type: Sequelize.STRING(200),
				allowNull: false,
				comment: "Report title",
			},
			deskripsi: {
				type: Sequelize.TEXT,
				allowNull: false,
				comment: "Detailed description",
			},
			tanggalPelaksanaan: {
				type: Sequelize.DATEONLY,
				allowNull: false,
			},
			status: {
				type: Sequelize.ENUM(
					"direncanakan",
					"sedang_dikerjakan",
					"selesai",
					"dibatalkan",
				),
				defaultValue: "direncanakan",
			},
			hasil: {
				type: Sequelize.TEXT,
				allowNull: true,
				comment: "Outcome description",
			},
			catatan: {
				type: Sequelize.TEXT,
				allowNull: true,
			},
			fotoPath: {
				type: Sequelize.STRING(500),
				allowNull: true,
				comment: "Photo documentation path",
			},
			dilakukanOleh: {
				type: Sequelize.UUID,
				allowNull: false,
				references: {
					model: "user",
					key: "id",
				},
				comment: "Officer who created the report",
			},
			diverifikasiOleh: {
				type: Sequelize.UUID,
				allowNull: true,
				references: {
					model: "user",
					key: "id",
				},
				comment: "Verifier identity",
			},
			diverifikasiPada: {
				type: Sequelize.DATE,
				allowNull: true,
				comment: "Verification timestamp",
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
		await queryInterface.dropTable("spk_melon_penanganan");
	},
};
