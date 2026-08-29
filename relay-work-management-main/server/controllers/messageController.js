const mongoose = require('mongoose');
const { Message } = require('../models/messageModel');
const { User } = require('../models/userModel');
const { createWorkflowNotification } = require('../models/notificationModel');

const listContacts = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { role: 'employee' } : { role: { $in: ['admin', 'employee'] }, _id: { $ne: req.user.id } };
    const contacts = await User.find(filter).select('name email job_role department role').sort({ name: 1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const listMessages = async (req, res) => {
  try {
    const { contactId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(contactId)) return res.status(400).json({ message: 'Invalid contact' });
    const messages = await Message.find({
      $or: [
        { sender_id: req.user.id, receiver_id: contactId },
        { sender_id: contactId, receiver_id: req.user.id }
      ]
    }).populate('sender_id', 'name role job_role').sort({ created_at: 1 });
    await Message.updateMany({ sender_id: contactId, receiver_id: req.user.id, read_at: null }, { read_at: new Date() });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, body } = req.body;
    if (!receiverId || !body?.trim()) return res.status(400).json({ message: 'Recipient and message are required' });
    if (!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).json({ message: 'Invalid recipient' });
    const receiver = await User.findById(receiverId).select('role');
    if (!receiver || (req.user.role === 'admin' && receiver.role !== 'employee') || (req.user.role === 'employee' && !['admin', 'employee'].includes(receiver.role))) {
      return res.status(403).json({ message: 'You cannot message this account' });
    }
    const message = await Message.create({ sender_id: req.user.id, receiver_id: receiverId, body: body.trim() });
    await message.populate('sender_id', 'name role job_role');
    await createWorkflowNotification(req.user.id, receiverId, `New query from ${message.sender_id.name}: ${body.trim().slice(0, 100)}`, 'messages');
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

module.exports = { listContacts, listMessages, sendMessage };
