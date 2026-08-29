const mongoose = require('mongoose');
require('../config/db');

const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Setting = mongoose.models.Setting || mongoose.model('Setting', settingsSchema);

const getSetting = async (key, fallback) => {
  const doc = await Setting.findOne({ key });
  return doc ? doc.value : fallback;
};

const setSetting = async (key, value) => {
  const updated = await Setting.findOneAndUpdate(
    { key },
    { $set: { value } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return updated.value;
};

module.exports = { Setting, getSetting, setSetting };
