const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);