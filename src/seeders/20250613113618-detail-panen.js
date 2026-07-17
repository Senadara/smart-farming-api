"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Detail panen is now handled inside 20250613113617-panen.js
    // This seeder is intentionally empty to avoid duplicate inserts.
  },

  async down(queryInterface, Sequelize) {
    // Cleanup handled by panen seeder
  },
};
