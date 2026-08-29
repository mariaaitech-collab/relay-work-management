const mongoose = require('mongoose');
const { User } = require('./userModel');
const { ProofOfWork } = require('./workModel');
require('../config/db');

const scoreHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  old_score: { type: Number, required: true },
  new_score: { type: Number, required: true },
  reason: { type: String, required: true },
  changed_by: { type: String, required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

scoreHistorySchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const ScoreHistory = mongoose.models.ScoreHistory || mongoose.model('ScoreHistory', scoreHistorySchema);

const getAllEmployees = async () => {
  return await User.find({ role: 'employee' });
};

const hasSubmittedOnDate = async (userId, date) => {
  const result = await ProofOfWork.findOne({ user_id: userId, date });
  return !!result;
};

const updateScore = async (userId, newScore, newStatus) => {
  return await User.findByIdAndUpdate(
    userId,
    { performance_score: newScore, status: newStatus },
    { new: true }
  );
};

const logScoreChange = async (userId, oldScore, newScore, reason, changedBy) => {
  const log = new ScoreHistory({
    user_id: userId,
    old_score: oldScore,
    new_score: newScore,
    reason,
    changed_by: changedBy
  });
  await log.save();
  return log;
};

module.exports = { ScoreHistory, getAllEmployees, hasSubmittedOnDate, updateScore, logScoreChange };