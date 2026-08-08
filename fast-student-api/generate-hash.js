/**
 * One-time utility to generate a bcrypt hash for your admin password.
 * 
 * Usage:
 *   1. cd fast-student-api
 *   2. npm install
 *   3. node generate-hash.js YOUR_PASSWORD_HERE
 * 
 * Copy the output hash into Vercel Dashboard → Settings → Environment Variables → ADMIN_PW_HASH
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-hash.js <your-password>');
  console.error('Example: node generate-hash.js placement123');
  process.exit(1);
}

const SALT_ROUNDS = 12; // Industry standard: 10-12 rounds

const hash = bcrypt.hashSync(password, SALT_ROUNDS);

console.log('\n=== Bcrypt Hash Generated ===');
console.log(`Password: ${password}`);
console.log(`Hash:     ${hash}`);
console.log('\nCopy the hash above and paste it into Vercel Dashboard:');
console.log('  Settings → Environment Variables → ADMIN_PW_HASH');
console.log('');
