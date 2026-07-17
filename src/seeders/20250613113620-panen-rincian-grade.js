"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // panenRincianGrade is now handled inside panen.js and panen-kebun.js seeders
    // to ensure referential integrity. This seeder is intentionally empty.
  },

  async down(queryInterface, Sequelize) {
    // Cleanup handled by the respective seeders
  },
};
