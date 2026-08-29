const mongoose = require('mongoose');
require('../config/db');

const activitySchema = new mongoose.Schema({
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  type: { type: String, enum: ['task_assigned', 'task_started', 'task_submitted', 'task_completed', 'task_reassigned', 'task_updated', 'announcement_sent', 'announcement_viewed'], required: true },
  message: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

activitySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

const recordActivity = async ({ actorId, employeeId = null, taskId = null, type, message }) => {
  return Activity.create({ actor_id: actorId, employee_id: employeeId, task_id: taskId, type, message });
};

module.exports = { Activity, recordActivity };
