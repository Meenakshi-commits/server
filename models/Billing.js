const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date },
});

module.exports = mongoose.model('Billing', billingSchema);