const mongoose = require('mongoose');
require('../config/db');

const messageSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true },
  read_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

messageSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = { Message };
