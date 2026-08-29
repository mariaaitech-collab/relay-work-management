const mongoose = require('mongoose');
require('../config/db');

const notificationSchema = new mongoose.Schema({
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read_at: { type: Date, default: null },
  source: { type: String, enum: ['tasks', 'reviews', 'messages', 'notifications'], default: 'notifications' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

const sendNotification = async (senderId, receiverId, message) => {
  const notification = new Notification({ sender_id: senderId, receiver_id: receiverId, message });
  await notification.save();
  return notification;
};

const getMyNotifications = async (userId) => {
  return await Notification.find({ receiver_id: userId }).populate('sender_id', 'name role job_role').sort({ created_at: -1 });
};

const markNotificationRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, receiver_id: userId },
    { read_at: new Date() },
    { new: true }
  );
};

const createWorkflowNotification = async (senderId, receiverIds, message, source = 'notifications') => {
  const ids = Array.isArray(receiverIds) ? receiverIds : [receiverIds];
  return await Notification.insertMany(ids.map((receiverId) => ({ sender_id: senderId, receiver_id: receiverId, message, source })));
};

module.exports = { Notification, sendNotification, getMyNotifications, markNotificationRead, createWorkflowNotification };