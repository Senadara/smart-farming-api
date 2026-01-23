require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('✅ Connected to database\n');
    
    const [rows] = await conn.query('SELECT id, name, email, phone, role FROM user');
    console.log(`📊 Total users in database: ${rows.length}\n`);
    
    if (rows.length > 0) {
      console.log('Users:');
      rows.forEach(r => {
        console.log(`  - ${r.name.padEnd(12)} | ${r.email.padEnd(25)} | ${r.phone || 'N/A'} | Role: ${r.role}`);
      });
    } else {
      console.log('⚠️  No users found in database');
    }
    
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
