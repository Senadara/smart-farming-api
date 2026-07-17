'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Buat tabel status_log_penyakit_ayam tanpa FK constraint
        // (validasi integritas dilakukan di application layer)
        await queryInterface.createTable('status_log_penyakit_ayam', {
            id: {
                type: Sequelize.CHAR(36),
                primaryKey: true,
                allowNull: false,
            },
            laporan_sakit_id: {
                type: Sequelize.CHAR(36),
                allowNull: false,
            },
            status: {
                type: Sequelize.STRING(50),
                allowNull: false,
            },
            catatan: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.CHAR(36),
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        // Index untuk query cepat berdasarkan laporan_sakit_id
        await queryInterface.addIndex('status_log_penyakit_ayam', ['laporan_sakit_id'], {
            name: 'idx_status_log_laporan_sakit_id',
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('status_log_penyakit_ayam');
    },
};
