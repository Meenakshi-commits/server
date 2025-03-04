const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);