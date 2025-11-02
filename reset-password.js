// Script to reset a user's password in the database
require('dotenv').config({ override: true });
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const {
  DB_HOST = 'localhost',
  DB_USER = 'root',
  DB_PASS = '',
  DB_NAME = 'bolt-coin',
} = process.env;

async function resetPassword(username, newPassword) {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  try {
    console.log(`Attempting to reset password for: ${username}`);

    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, username FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log('❌ User not found!');
      console.log('\nAvailable users:');
      const [allUsers] = await connection.execute('SELECT username FROM users');
      allUsers.forEach(u => console.log('  - ' + u.username));
      return;
    }

    // Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // Update password
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE username = ?',
      [hash, username]
    );

    console.log('✅ Password reset successful!');
    console.log(`Username: ${username}`);
    console.log(`New Password: ${newPassword}`);
    console.log('\nYou can now login with these credentials.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('Usage: node reset-password.js <username> <new-password>');
  console.log('Example: node reset-password.js kabilan.muki@gmail.com myNewPassword123');
  process.exit(1);
}

const [username, newPassword] = args;
resetPassword(username, newPassword);
