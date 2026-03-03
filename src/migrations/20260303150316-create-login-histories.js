"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("login_histories", {
			id: {
				type: Sequelize.UUID,
				defaultValue: Sequelize.UUIDV4,
				primaryKey: true,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING(100),
				allowNull: false,
			},
			ipAddress: {
				type: Sequelize.STRING(45),
				allowNull: false,
			},
			userAgent: {
				type: Sequelize.TEXT,
				allowNull: false,
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

		// Composite uniqueness (email + ipAddress + userAgent) enforced at
		// application level via Eloquent updateOrCreate, not DB level,
		// because userAgent is TEXT type (not indexable without prefix in MySQL).
		await queryInterface.addIndex("login_histories", ["email", "ipAddress"], {
			name: "login_histories_email_ip_idx",
		});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("login_histories");
	},
};
