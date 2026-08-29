// Secure, interactive master-admin setup.
// Run: `npm run setup-admin` (or `node scripts/setup-admin.js`)
// Prompts privately for the admin email + password, hashes it with bcrypt,
// and creates OR updates the admin account. No password is ever hardcoded
// or written to source code — only stored hashed in the database.

require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/userModel');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_tracking';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to the database.');

  const email = (await ask('Master admin email [maria.ai.tech@gmail.com]: ')).trim() || 'maria.ai.tech@gmail.com';
  const password = await ask('Master admin password (min 6 characters): ');
  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }
  const name = (await ask('Display name [Maria]: ')).trim() || 'Maria';

  const hash = await bcrypt.hash(password, 10);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.password_hash = hash;
    existing.role = 'admin';
    existing.status = 'active';
    if (existing.performance_score == null) existing.performance_score = 100;
    await existing.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    await User.create({
      name,
      email,
      password_hash: hash,
      role: 'admin',
      performance_score: 100,
      status: 'active'
    });
    console.log(`Created master admin: ${email}`);
  }

  console.log('Done. You can now log in with these credentials.');
  rl.close();
  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
