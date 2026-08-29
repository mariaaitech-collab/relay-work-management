const mongoose = require('mongoose');
require('../config/db');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  due_date: { type: String, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  assignee_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['assigned', 'in_progress', 'submitted', 'completed', 'overdue', 'cancelled', 'open', 'archived'], default: 'assigned' },
  completed_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

taskSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

module.exports = { Task };
