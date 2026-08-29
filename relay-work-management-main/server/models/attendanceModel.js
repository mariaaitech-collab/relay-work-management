const mongoose = require('mongoose');
require('../config/db');

const attendanceSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  markedAt: { type: Date, default: null },
  autoMarked: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

attendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

attendanceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);

// Marks an employee present for a given date (idempotent via upsert).
const markPresent = async (userId, date) => {
  return await Attendance.findOneAndUpdate(
    { user_id: userId, date },
    {
      $set: {
        status: 'present',
        markedAt: new Date(),
        autoMarked: false
      }
    },
    { new: true, upsert: true }
  );
};

const getAttendanceForDate = async (date) => {
  return await Attendance.find({ date }).populate('user_id', 'name email employeeId department job_role');
};

const getEmployeeAttendance = async (userId, date) => {
  return await Attendance.findOne({ user_id: userId, date });
};

const getHistory = async (userId) => {
  return await Attendance.find({ user_id: userId }).sort({ date: -1 });
};

module.exports = {
  Attendance,
  markPresent,
  getAttendanceForDate,
  getEmployeeAttendance,
  getHistory
};
