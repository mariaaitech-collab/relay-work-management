const mongoose = require('mongoose');
require('../config/db');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  job_role: { type: String, default: 'Employee' },
  department: { type: String, default: 'General' },
  employeeId: { type: String, unique: true, sparse: true },
  performance_score: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'warning', 'blocked'], default: 'active' },
  reset_token: { type: String, default: null },
  reset_token_expiry: { type: Date, default: null },
  created_log: {
    date: { type: String, default: '' },
    month: { type: String, default: '' },
    year: { type: String, default: '' },
    time: { type: String, default: '' }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Record the exact Date / Month / Year / Time of creation for every new user.
userSchema.pre('save', async function () {
  if (!this.created_log || !this.created_log.date) {
    const d = this.created_at || new Date();
    this.created_log = {
      date: String(d.getDate()).padStart(2, '0'),
      month: d.toLocaleString('en-US', { month: 'long' }),
      year: String(d.getFullYear()),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  }
});

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const generateEmployeeId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'EMP-';
  for (let i = 0; i < 5; i += 1) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const createUser = async (name, email, hashedPassword, role, employeeId) => {
  const user = new User({
    name,
    email,
    password_hash: hashedPassword,
    role: role || 'employee',
    employeeId: employeeId || generateEmployeeId()
  });
  await user.save();
  return user;
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const findUserByEmployeeId = async (employeeId) => {
  return await User.findOne({ employeeId });
};

const findUserById = async (id) => {
  return await User.findById(id);
};

const findAdmins = async () => {
  return await User.find({ role: 'admin' }).select('_id name email');
};

module.exports = { User, generateEmployeeId, createUser, findUserByEmail, findUserByEmployeeId, findUserById, findAdmins };