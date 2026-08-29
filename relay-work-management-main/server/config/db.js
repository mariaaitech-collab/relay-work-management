const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/employee_tracking';
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(`Primary MongoDB not reachable (${err.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({ binary: { version: '6.0.14' } });
      uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`InMemory MongoDB Connected: ${conn.connection.host}`);
    } catch (memErr) {
      console.error(`MongoDB Connection Error: ${memErr.message}`);
    }
  }

  setTimeout(async () => {
    try {
      const { User } = require('../models/userModel');

      // Auto-seed accounts only outside production.
      if (process.env.NODE_ENV !== 'production') {
        // Master admin (invite-only primary administrator). The password is NEVER
        // hardcoded: it is read from MASTER_ADMIN_PASSWORD in the (gitignored) .env.
        const MASTER_ADMIN_EMAIL = 'maria.ai.tech@gmail.com';
        const existingMaster = await User.findOne({ email: MASTER_ADMIN_EMAIL, role: 'admin' });
        if (!existingMaster) {
          let adminPass;
          const envPass = process.env.MASTER_ADMIN_PASSWORD;
          if (envPass && envPass.length >= 6) {
            adminPass = await bcrypt.hash(envPass, 10);
          } else if (process.env.NODE_ENV !== 'production') {
            // Dev fallback: generate a one-time random password and print it.
            const generated = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
            adminPass = await bcrypt.hash(generated, 10);
            console.log('WARNING: MASTER_ADMIN_PASSWORD not set — generated temporary master password (dev only):', generated);
          } else {
            console.error('Seeding error: MASTER_ADMIN_PASSWORD is not set. Run `npm run setup-admin` to create the admin.');
          }
          if (adminPass) {
            await User.create({
              name: 'Maria',
              email: MASTER_ADMIN_EMAIL,
              password_hash: adminPass,
              role: 'admin',
              performance_score: 100,
              status: 'active'
            });
            console.log('Seeded master Admin:', MASTER_ADMIN_EMAIL);
          }
        }

        // Demo employee so the workspace is usable immediately.
        const employeeCount = await User.countDocuments({ role: 'employee' });
        if (employeeCount === 0) {
          const empPass = await bcrypt.hash('employee123', 10);
          await User.create({
            name: 'John Doe',
            email: 'employee@emptrack.com',
            password_hash: empPass,
            role: 'employee',
            performance_score: 100,
            status: 'active'
          });
          console.log('Seeded default Employee: employee@emptrack.com / employee123');
        }
      }
    } catch (seedErr) {
      console.error('Seeding error:', seedErr.message);
    }

    // Backfill employee IDs for any users that don't have one yet
    try {
      const { User, generateEmployeeId } = require('../models/userModel');
      const usersWithoutId = await User.find({ employeeId: { $in: [null, ''] } });
      for (const u of usersWithoutId) {
        let candidate;
        let taken = true;
        while (taken) {
          candidate = generateEmployeeId();
          taken = !!(await User.exists({ employeeId: candidate }));
        }
        u.employeeId = candidate;
        await u.save();
      }
      if (usersWithoutId.length) console.log(`Assigned employee IDs to ${usersWithoutId.length} user(s).`);
    } catch (bfErr) {
      console.error('Employee ID backfill error:', bfErr.message);
    }
  }, 1000);
};

connectDB();

module.exports = mongoose;