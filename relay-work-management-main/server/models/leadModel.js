const mongoose = require('mongoose');
require('../config/db');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, default: '' },
  message: { type: String, default: '' },
  source: { type: String, default: 'website' },
  created_at: { type: Date, default: Date.now }
});

const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

module.exports = { Lead };
