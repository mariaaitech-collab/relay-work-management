const mongoose = require('mongoose');
require('../config/db');

const workSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
  date: { type: String, required: true },
  screenshot_url: { type: String, default: null },
  github_link: { type: String, default: null },
  review_status: { type: String, enum: ['pending', 'approved', 'changes_requested'], default: 'pending' },
  review_message: { type: String, default: '' },
  reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewed_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

workSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const ProofOfWork = mongoose.models.ProofOfWork || mongoose.model('ProofOfWork', workSchema);

const addProofOfWork = async (userId, date, screenshotUrl, githubLink, taskId = null) => {
  const work = new ProofOfWork({
    user_id: userId,
    task_id: taskId,
    date,
    screenshot_url: screenshotUrl,
    github_link: githubLink
  });
  await work.save();
  return work;
};

const getWorkHistory = async (userId) => {
  return await ProofOfWork.find({ user_id: userId }).populate('task_id', 'title due_date').sort({ date: -1 });
};

const checkTodaySubmission = async (userId, date, taskId = null) => {
  return await ProofOfWork.findOne({ user_id: userId, date, task_id: taskId });
};

module.exports = { ProofOfWork, addProofOfWork, getWorkHistory, checkTodaySubmission };