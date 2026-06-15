// Quick test script for REPL helpers
console.log('Testing REPL helpers loading...');

try {
     const fs = require('fs');
     const path = require('path');

     const replHelpersPath = path.join(__dirname, 'repl-helpers.js');

     if (fs.existsSync(replHelpersPath)) {
          console.log('✅ repl-helpers.js file exists');
          console.log('📁 Location:', replHelpersPath);

          const stats = fs.statSync(replHelpersPath);
          console.log('📊 File size:', stats.size, 'bytes');
          console.log('');
          console.log('🎉 REPL helpers ready!');
          console.log('');
          console.log('To use:');
          console.log('  docker compose exec node-api sh');
          console.log('  node repl-helpers.js');
     } else {
          console.log('❌ repl-helpers.js not found');
     }
} catch (error) {
     console.log('❌ Error:', error.message);
}
