"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("spk_melon_kriteria", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			kode: {
				type: Sequelize.STRING(10),
				allowNull: false,
				unique: true,
			},
			nama: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			tipe: {
				type: Sequelize.ENUM("benefit", "cost"),
				allowNull: false,
			},
			kategori: {
				type: Sequelize.ENUM("produktivitas", "kualitas", "lingkungan"),
				allowNull: false,
			},
			spiHitung: {
				type: Sequelize.STRING(50),
				allowNull: true,
				comment: "Calculation field/formula reference",
			},
			spiSumber: {
				type: Sequelize.STRING(50),
				allowNull: true,
				comment:
					"Data source: harianKebun, panenKebun, sensor, manual, penilaianKualitas",
			},
			keterangan: {
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
		await queryInterface.dropTable("spk_melon_kriteria");
	},
};
